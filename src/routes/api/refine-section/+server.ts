import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { tooLong } from '$lib/server/rateLimit';
import { CREATIVE_STRATEGIST_SYSTEM_PROMPT, SECTION_FRAMING, VALID_SECTIONS } from '$lib/server/prompts';

export const POST: RequestHandler = async ({ request }) => {
	let body: { sectionName?: string; rawInput?: string; regenerate?: boolean };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { sectionName, rawInput, regenerate } = body;

	if (!sectionName || !VALID_SECTIONS.has(sectionName)) {
		throw error(400, `sectionName must be one of: ${[...VALID_SECTIONS].join(', ')}`);
	}
	if (!rawInput || !rawInput.trim()) {
		throw error(400, 'rawInput must not be empty');
	}

	if (tooLong(rawInput)) {
		throw error(413, 'That is more text than this tool can process at once. Please trim it down.');
	}

	const framing = SECTION_FRAMING[sectionName];
	const regenerateNote = regenerate
		? '\n\nThis is a regeneration request — produce a fresh alternative pass, structurally distinct from a typical first attempt, while still following all rules above.'
		: '';

	const userPrompt = `Section: ${sectionName}\n\n${framing}${regenerateNote}\n\nRaw client notes to transform:\n"""\n${rawInput}\n"""`;

	let message;
	try {
		message = await anthropic.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 4096,
			thinking: { type: 'adaptive' },
			output_config: { effort: 'medium' },
			system: CREATIVE_STRATEGIST_SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		});
	} catch (err) {
		console.error('Anthropic API error refining section', sectionName, err);
		throw error(502, 'Failed to reach Claude. Please try again.');
	}

	const refined = message.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n')
		.trim();

	if (!refined) {
		throw error(502, 'Claude returned an empty response. Please try again.');
	}

	return json({ refined });
};
