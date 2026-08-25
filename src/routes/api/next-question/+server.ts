import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { tooLong } from '$lib/server/rateLimit';
import { logUsage } from '$lib/server/usage';
import { SECTION_LABELS_FOR_PROMPT, VALID_SECTIONS } from '$lib/server/prompts';
import { MAX_HELP_QUESTIONS, type HelpQuestion } from '$lib/types';

/** Prior exchanges carried in from other sections — capped so the prompt stays lean. */
const MAX_LEARNED_CONTEXT = 12;

const SYSTEM_PROMPT = `You are a warm, perceptive creative strategist helping a client who feels stuck articulate part of a creative brief. You interview them the way a good designer does on a discovery call: one small question at a time, actually listening to each answer and letting it shape what you ask next.

Rules:
1. Ask exactly ONE question per response.
2. Build on what they have already said. If an answer reveals something specific, follow that thread — go deeper on it, or resolve an ambiguity it created. Never ask something their earlier answers already told you, in this section or any other.
3. When a client writes their own custom answer instead of picking an option, treat it as the strongest signal you have about how they actually think. Let it steer the next question, and mirror their own words back where natural.
4. Prefer a simple multiple-choice question ("type": "choice", with 2-4 short "options") over an open one. Use "type": "text" only when a short list of options genuinely cannot capture the answer.
5. Keep every question under 20 words, in plain everyday language. No jargon, no industry terms, no compound questions.
6. Stop as soon as you have enough to write a genuinely useful section — usually after 3 or 4 questions. Never exceed the maximum you are given.
7. Respond with ONLY raw JSON. No prose, no explanation, no markdown fences.
   To ask another question: {"done": false, "question": {"id": "q3", "text": "...", "type": "choice", "options": ["...", "..."]}}
   To finish: {"done": true}`;

interface RequestBody {
	sectionName?: string;
	sectionRaw?: string;
	otherSections?: Record<string, string>;
	answered?: { question: string; answer: string; skipped?: boolean }[];
	learnedContext?: { section: string; question: string; answer: string }[];
}

function stripCodeFences(text: string): string {
	const trimmed = text.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1] : trimmed;
}

function isValidQuestion(value: unknown): value is HelpQuestion {
	if (!value || typeof value !== 'object') return false;
	const q = value as Record<string, unknown>;
	if (typeof q.id !== 'string' || typeof q.text !== 'string') return false;
	if (q.type !== 'choice' && q.type !== 'text') return false;
	if (q.type === 'choice') {
		if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) return false;
		if (!q.options.every((opt) => typeof opt === 'string')) return false;
	}
	return true;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { sectionName, sectionRaw, otherSections, answered = [], learnedContext = [] } = body;

	if (!sectionName || !VALID_SECTIONS.has(sectionName)) {
		throw error(400, `sectionName must be one of: ${[...VALID_SECTIONS].join(', ')}`);
	}

	if (tooLong(sectionRaw, ...Object.values(otherSections ?? {}))) {
		throw error(413, 'That is more text than this tool can process at once. Please trim it down.');
	}

	// Server-side ceiling: never let the interview run past the cap even if the model keeps going.
	if (answered.length >= MAX_HELP_QUESTIONS) {
		return json({ done: true, question: null });
	}

	const sectionLabel = SECTION_LABELS_FOR_PROMPT[sectionName];

	const contextLines = Object.entries(otherSections ?? {})
		.filter(([, value]) => value && value.trim())
		.map(([key, value]) => `- ${SECTION_LABELS_FOR_PROMPT[key] ?? key}: ${value.trim()}`)
		.join('\n');

	const learnedLines = learnedContext
		.slice(-MAX_LEARNED_CONTEXT)
		.map(
			(e) =>
				`- [${SECTION_LABELS_FOR_PROMPT[e.section] ?? e.section}] Q: ${e.question} → A: ${e.answer}`
		)
		.join('\n');

	const sessionLines = answered
		.map((a, i) =>
			a.skipped
				? `Q${i + 1}: ${a.question}\nA${i + 1}: (client skipped this one — don't re-ask it)`
				: `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`
		)
		.join('\n\n');

	const userPrompt = `The client is filling out the "${sectionLabel}" section of a creative brief and isn't sure how to answer.

What they've written for this section so far (may be empty): "${(sectionRaw ?? '').trim() || '(nothing yet)'}"

What they've written in other sections of this brief:
${contextLines || '(nothing else provided yet)'}

What you've already learned about this client from interviewing them on earlier sections:
${learnedLines || '(this is the first section you have interviewed them on)'}

This interview so far (${answered.length} of a maximum ${MAX_HELP_QUESTIONS} questions):
${sessionLines || '(no questions asked yet — this will be your first)'}

Ask the single most useful next question, or finish if you have enough.`;

	let message;
	try {
		message = await anthropic.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 1024,
			thinking: { type: 'adaptive' },
			output_config: { effort: 'low' },
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		});
	} catch (err) {
		console.error('Anthropic API error generating next question', sectionName, err);
		throw error(502, 'Failed to reach the AI. Please try again.');
	}

	logUsage('next-question', message.usage);

	const rawText = message.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n')
		.trim();

	let parsed: unknown;
	try {
		parsed = JSON.parse(stripCodeFences(rawText));
	} catch {
		console.error('Failed to parse question JSON:', rawText);
		throw error(502, "The AI's response couldn't be read. Please try again.");
	}

	const result = parsed as { done?: unknown; question?: unknown };

	if (result.done === true) {
		return json({ done: true, question: null });
	}

	if (!isValidQuestion(result.question)) {
		console.error('Question JSON failed shape validation:', parsed);
		// Rather than erroring out mid-interview, end gracefully with whatever we have.
		if (answered.length > 0) return json({ done: true, question: null });
		throw error(502, "The AI's response wasn't in the right format. Please try again.");
	}

	return json({ done: false, question: result.question as HelpQuestion });
};
