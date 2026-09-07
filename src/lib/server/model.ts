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
 * Models are asked for raw JSON but still wrap it in a fence now and then.
 * Returns the parsed value, or null when it is not JSON at all.
 */
export function parseModelJson(text: string): unknown | null {
	const trimmed = text.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	try {
		return JSON.parse(fenced ? fenced[1] : trimmed);
	} catch {
		return null;
	}
}
