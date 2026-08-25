import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { tooLong } from '$lib/server/rateLimit';
import type { SectionKey } from '$lib/types';

const SYSTEM_PROMPT = `You are a creative strategist sorting an existing, messy client brief into the four sections of a structured brief. The document was written by a human in whatever order made sense to them; your job is to work out what belongs where.

The four sections:
- "objectives" — Context & Objectives: background, the business problem, what this project must achieve, success measures.
- "audience" — Target Audience & Key Message: who it's for, what they care about, the single thing they should take away.
- "deliverables" — Aesthetics, Tone & Deliverables: look and feel, tone of voice, references, and the actual list of assets to produce.
- "constraints" — Constraints & Mandatories: budget, timeline, brand rules, legal or compliance requirements, approvals, non-negotiables.

Rules:
1. Use the document's OWN words wherever possible. You are sorting and lightly tidying, not rewriting. Do not invent facts, numbers, dates or names that are not present.
2. Preserve concrete detail — figures, dates, names, deliverable lists. These matter more than prose.
3. Light formatting is welcome: turn genuine lists into markdown bullets, bold a natural sub-label. Do not add headings inside a section.
4. If the document says nothing about a section, return an empty string for it. Never pad a section to look complete — an empty section is information.
5. Also extract, if clearly present: "projectName" and "clientName". Empty string if not stated.
6. In "unplaced", put anything meaningful that genuinely fits none of the four sections (internal notes, pricing negotiations, meeting logistics). Keep it brief.
7. Respond with ONLY raw JSON, no prose, no markdown fences:
{"projectName":"...","clientName":"...","objectives":"...","audience":"...","deliverables":"...","constraints":"...","unplaced":"..."}`;

const KEYS: SectionKey[] = ['objectives', 'audience', 'deliverables', 'constraints'];

function stripCodeFences(text: string): string {
	const trimmed = text.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1] : trimmed;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { text?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const text = (body.text ?? '').trim();
	if (!text) {
		throw error(400, "That document appears to be empty — there's nothing to read.");
	}
	if (tooLong(text)) {
		throw error(413, 'That document is too long to process at once. Try trimming it down.');
	}

	let message;
	try {
		const stream = anthropic.messages.stream({
			model: 'claude-sonnet-4-6',
			max_tokens: 8000,
			thinking: { type: 'adaptive' },
			output_config: { effort: 'medium' },
			system: SYSTEM_PROMPT,
			messages: [
				{ role: 'user', content: `Here is the document:\n\n"""\n${text}\n"""\n\nSort it now.` }
			]
		});
		message = await stream.finalMessage();
	} catch (err) {
		console.error('Anthropic API error parsing document', err);
		throw error(502, 'Failed to reach the AI. Please try again.');
	}

	if (message.stop_reason === 'max_tokens') {
		throw error(502, 'That document was too dense to sort in one pass. Try splitting it up.');
	}

	const raw = message.content
		.filter((b) => b.type === 'text')
		.map((b) => b.text)
		.join('\n')
		.trim();

	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(stripCodeFences(raw));
	} catch {
		console.error('Failed to parse document-sort JSON:', raw.slice(0, 400));
		throw error(502, "The AI's response couldn't be read. Please try again.");
	}

	const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
	const sections = Object.fromEntries(KEYS.map((k) => [k, str(parsed[k])])) as Record<
		SectionKey,
		string
	>;

	if (KEYS.every((k) => !sections[k])) {
		throw error(
			502,
			"Nothing in that document mapped to a brief. It may not be a creative brief — try pasting the relevant part instead."
		);
	}

	return json({
		projectName: str(parsed.projectName),
		clientName: str(parsed.clientName),
		sections,
		unplaced: str(parsed.unplaced)
	});
};
