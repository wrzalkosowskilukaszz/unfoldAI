import type { Message } from '@anthropic-ai/sdk/resources/messages';

/**
 * Reading what the model sent back. Kept apart from the client in anthropic.ts
 * so these can be unit-tested without constructing an SDK instance.
 */

/** The model's prose, with any non-text blocks (thinking) left out. */
export function textOf(message: Pick<Message, 'content'>): string {
	return message.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n')
		.trim();
}

/**
 * Models are asked for raw JSON but still wrap it in a fence, or lead with a
 * sentence, now and then. Try the text as given, then whatever sits between
 * the first "{" and the last "}". Returns null when nothing parses.
 */
export function parseModelJson(text: string): unknown | null {
	const trimmed = text.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	const candidates = [fenced ? fenced[1] : trimmed];
	const open = trimmed.indexOf('{');
	const close = trimmed.lastIndexOf('}');
	if (open !== -1 && close > open) candidates.push(trimmed.slice(open, close + 1));
	for (const c of candidates) {
		try {
			return JSON.parse(c);
		} catch {
			// try the next shape
		}
	}
	return null;
}

/** Case, quote marks, punctuation and spacing all vary between a brief and a quote of it. */
export function normalizeForMatch(text: string): string {
	return text
		.toLowerCase()
		.replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Keeps only the quotes that really occur in the brief. A finding is only as
 * trustworthy as its evidence, and a model can misremember what it just read.
 */
export function verifyEvidence(brief: string, quotes: string[]): string[] {
	const haystack = normalizeForMatch(brief);
	return quotes
		.map((q) => q.trim())
		.filter((q) => q.length >= 3 && haystack.includes(normalizeForMatch(q)))
		.slice(0, 3);
}

/**
 * What to log when a reply could not be read: its shape, never its content —
 * a brief's text must not reach the log aggregator, and neither may a model
 * reply that could quote it.
 */
export function describeUnreadable(text: string): { length: number; shape: string } {
	const t = text.trim();
	const shape = t.startsWith('{') ? 'object' : t.startsWith('[') ? 'array' : t.startsWith('```') ? 'fenced' : t.length === 0 ? 'empty' : 'prose';
	return { length: t.length, shape };
}
