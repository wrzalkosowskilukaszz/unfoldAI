import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { tooLong } from '$lib/server/rateLimit';
import { logUsage } from '$lib/server/usage';
import { projectLens, roleFraming } from '$lib/server/role';
import { SECTION_LABELS_FOR_PROMPT } from '$lib/server/prompts';
import type { Finding, FindingKind } from '$lib/types';

const VALID_KINDS: FindingKind[] = [
	'clear',
	'attention',
	'contradiction',
	'missing',
	'assumption',
	'why'
];

const SYSTEM_PROMPT = `You are a senior creative strategist reviewing a creative brief before it goes into production. You are not here to rewrite it. You are here to work out what is actually still unknown, assumed, contradictory, or unvalidated — the things that sink projects three weeks in.

Read the brief as ONE project, not as separate sections. The most valuable findings come from comparing sections against each other.

Look for exactly these six kinds of finding:

- "clear" — something genuinely well-defined and solid. No question needed.
- "attention" — a statement too vague to act on. "Increase engagement" with no definition of engagement.
- "contradiction" — two things in the brief that cannot both be true. Premium positioning vs. price-led acquisition. Fast launch vs. a six-week approval chain. Quote both sides.
- "missing" — something critical that is simply absent. No success metric, no budget, no decision maker.
- "assumption" — something YOU had to infer to make sense of the brief. Be explicit and honest about what you filled in. This is the most valuable kind: say what you assumed and ask them to confirm it.
- "why" — a solution specified before the problem was established. They asked for a website; the problem they described was that nobody understands their proposition. Ask whether the requested thing is actually the right answer.

Rules:
1. Return between 4 and 7 findings total. Quality over volume — never manufacture a problem to fill a quota.
1a. MANDATORY: at least one finding — and at most three — MUST be of kind "clear". This is not optional and not filler. A reviewer who only ever reports problems reads as a nagging machine and gets ignored; naming what is genuinely solid is what makes the criticism credible. Even a weak brief has something anchored: a firm date, a named audience, a real constraint. Find it and say so. If you return zero "clear" findings you have failed this task.
2. Every finding except "clear" MUST include a "question" that would resolve it, plus 2-4 "options" as likely answers. Each option must be under 12 words. The last option should usually be an escape hatch like "Something else" or "Not sure yet".
3. Be concrete and quote the brief's own words in "detail". Never generic advice.
4. "dimension" is a 1-3 word label for what it concerns: Audience, Success criteria, Budget, Scope, Positioning, Timeline, Approval, Problem.
5. "title" is a short headline under 10 words. "detail" is AT MOST 2 sentences and under 45 words — be tight, this is a scannable card, not an essay.
6. Do NOT raise anything already listed as a locked decision — those are settled.
7. Respond with ONLY raw JSON, no prose and no markdown fences:
{"findings": [{"id": "f1", "kind": "contradiction", "dimension": "Positioning", "title": "...", "detail": "...", "question": "...", "options": ["...", "..."]}]}`;

interface RequestBody {
	meta?: Record<string, unknown>;
	sections?: Record<string, string>;
	helpHistory?: { section: string; question: string; answer: string }[];
	decisions?: { dimension: string; title: string; resolution?: string }[];
}

function stripCodeFences(text: string): string {
	const trimmed = text.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1] : trimmed;
}

function sanitizeFinding(value: unknown, index: number): Finding | null {
	if (!value || typeof value !== 'object') return null;
	const f = value as Record<string, unknown>;

	const kind = f.kind as FindingKind;
	if (!VALID_KINDS.includes(kind)) return null;
	if (typeof f.title !== 'string' || typeof f.detail !== 'string') return null;
	if (typeof f.dimension !== 'string') return null;

	// Anything actionable is useless without a question to resolve it.
	const question = typeof f.question === 'string' ? f.question : undefined;
	if (kind !== 'clear' && !question) return null;

	const options =
		Array.isArray(f.options) && f.options.every((o) => typeof o === 'string')
			? (f.options as string[]).slice(0, 4)
			: undefined;

	return {
		id: typeof f.id === 'string' ? f.id : `f${index}`,
		kind,
		dimension: f.dimension,
		title: f.title,
		detail: f.detail,
		question,
		options,
		status: 'open'
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { meta = {}, sections = {}, helpHistory = [], decisions = [] } = body;

	const hasContent = Object.values(sections).some((v) => v && v.trim());
	if (!hasContent) {
		throw error(400, 'There is nothing to review yet — fill in a few sections first.');
	}

	if (tooLong(...Object.values(sections))) {
		throw error(413, 'That is more text than this tool can process at once. Please trim it down.');
	}

	const sectionLines = Object.entries(sections)
		.map(
			([key, value]) =>
				`### ${SECTION_LABELS_FOR_PROMPT[key] ?? key}\n${value?.trim() || '(left empty)'}`
		)
		.join('\n\n');

	const interviewLines = helpHistory
		.slice(-16)
		.map((e) => `- Q: ${e.question} → A: ${e.answer}`)
		.join('\n');

	const decisionLines = decisions
		.map((d) => `- ${d.dimension}: ${d.title} → ${d.resolution ?? 'confirmed'}`)
		.join('\n');

	const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

	const userPrompt = `PROJECT
Name: ${str(meta.projectName) || '(unnamed)'}
Client/Brand: ${str(meta.clientName) || '(not given)'}
Brief date: ${str(meta.briefDate) || '(not given)'}
Target launch: ${str(meta.launchDate) || '(not given)'}

WHO WROTE IT
${roleFraming(meta.role)}

DISCIPLINE — review it as a specialist in this field. Absences that matter in
this discipline are findings in their own right; say what is missing, not just
what is unclear.
${projectLens(meta.projectType)}

THE BRIEF
${sectionLines}

WHAT THEY SAID WHEN INTERVIEWED
${interviewLines || '(they were not interviewed)'}

DECISIONS ALREADY LOCKED — do not raise these again
${decisionLines || '(none yet)'}

Review this project and return your findings.`;

	let message;
	try {
		// Streamed: thinking counts against max_tokens, so this needs real headroom,
		// and a non-streaming call that size risks an HTTP timeout.
		const stream = anthropic.messages.stream({
			model: 'claude-sonnet-4-6',
			max_tokens: 8000,
			thinking: { type: 'adaptive' },
			output_config: { effort: 'medium' },
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		});
		message = await stream.finalMessage();
	} catch (err) {
		console.error('Anthropic API error reviewing brief', err);
		throw error(502, 'Failed to reach the AI. Please try again.');
	}

	logUsage('review-brief', message.usage);

	if (message.stop_reason === 'max_tokens') {
		console.error('Review hit the token ceiling before finishing its JSON.');
		throw error(502, 'The review ran long and got cut off. Please try again.');
	}

	const rawText = message.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n')
		.trim();

	let parsed: unknown;
	try {
		parsed = JSON.parse(stripCodeFences(rawText));
	} catch {
		console.error('Failed to parse review JSON:', rawText);
		throw error(502, "The AI's response couldn't be read. Please try again.");
	}

	const rawFindings = (parsed as { findings?: unknown }).findings;
	if (!Array.isArray(rawFindings)) {
		console.error('Review JSON missing findings array:', parsed);
		throw error(502, "The AI's response wasn't in the right format. Please try again.");
	}

	const findings = rawFindings
		.map((f, i) => sanitizeFinding(f, i))
		.filter((f): f is Finding => f !== null);

	if (findings.length === 0) {
		throw error(502, 'The review came back empty. Please try again.');
	}

	return json({ findings });
};
