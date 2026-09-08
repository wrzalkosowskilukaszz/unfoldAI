import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { describeUnreadable, parseModelJson, textOf } from '$lib/server/model';
import { RECONSIDER_SCHEMA } from '$lib/server/schemas';
import { tooLong } from '$lib/server/rateLimit';
import { logUsage } from '$lib/server/usage';
import { SECTION_LABELS_FOR_PROMPT } from '$lib/server/prompts';

/**
 * The cascade. A decision has just been locked; does it settle any of the
 * findings still open? Cheap and fast on purpose — low effort, short output —
 * because it runs after every answer. It only ever retires; it never invents.
 */
const SYSTEM_PROMPT = `You are a senior creative strategist keeping a list of open questions about a creative brief. The client has just answered one of them. Your only job: say which of the OTHER open questions that answer now settles or makes moot.

Rules:
1. Retire a finding only when the answer clearly resolves it or removes the reason it was raised. When in doubt, keep it open — retiring something wrongly hides a real gap.
2. Never retire a finding merely because it is about the same topic; it must actually be answered.
3. "reason" is one short sentence, under 15 words, addressed to the client, e.g. "Choosing premium-led settles this."
4. Return an empty list when nothing is settled. That is the common case.`;

interface RequestBody {
	sections?: Record<string, string>;
	decision?: { dimension?: string; title?: string; question?: string; resolution?: string };
	open?: { id: string; kind: string; dimension: string; title: string; detail: string; question?: string }[];
}

export const POST: RequestHandler = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { sections = {}, decision, open = [] } = body;
	if (!decision || typeof decision.title !== 'string') throw error(400, 'decision is required');
	const candidates = open.filter((f) => f && typeof f.id === 'string' && typeof f.title === 'string');
	if (candidates.length === 0) return json({ retire: [] });

	if (
		tooLong(
			...Object.values(sections),
			...candidates.flatMap((f) => [f.title, f.detail, f.question]),
			decision.resolution,
			decision.question
		)
	) {
		throw error(413, 'That is more text than this tool can process at once.');
	}

	const briefLines = Object.entries(sections)
		.filter(([, v]) => typeof v === 'string' && v.trim())
		.map(([k, v]) => `### ${SECTION_LABELS_FOR_PROMPT[k] ?? k}\n${v.trim()}`)
		.join('\n\n');

	const openLines = candidates
		.map(
			(f) =>
				`- id ${f.id} [${f.kind}] ${f.dimension}: ${f.title} — ${f.detail}${f.question ? ` (asks: ${f.question})` : ''}`
		)
		.join('\n');

	const userPrompt = `THE BRIEF
${briefLines || '(empty)'}

THE ANSWER JUST GIVEN
${decision.dimension ?? ''}: ${decision.title}
Question: ${decision.question ?? '(not recorded)'}
Answer: ${decision.resolution ?? 'confirmed'}

STILL OPEN
${openLines}

Which of the open findings does this answer settle? Return only those.`;

	let message;
	try {
		message = await anthropic.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 1024,
			// No thinking: this runs after every answer, and a yes/no over a short
			// list does not need it. Adaptive thinking made it a 25-second wait.
			thinking: { type: 'disabled' },
			output_config: { format: { type: 'json_schema', schema: RECONSIDER_SCHEMA } },
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		});
	} catch (err) {
		console.error('Anthropic API error reconsidering findings', err);
		throw error(502, 'Failed to reach the AI. Please try again.');
	}

	logUsage('reconsider', message.usage);

	const raw = textOf(message);
	const parsed = parseModelJson(raw) as { retire?: unknown } | null;
	if (!parsed || !Array.isArray(parsed.retire)) {
		console.error(JSON.stringify({ type: 'unreadable', route: 'reconsider', ...describeUnreadable(raw) }));
		// A cascade that fails must never break the answer that was just given.
		return json({ retire: [] });
	}

	const known = new Set(candidates.map((f) => f.id));
	const retire = parsed.retire
		.filter(
			(r): r is { id: string; reason: string } =>
				!!r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string' && known.has((r as { id: string }).id)
		)
		.map((r) => ({ id: r.id, reason: typeof r.reason === 'string' ? r.reason.slice(0, 160) : '' }));

	return json({ retire });
};
