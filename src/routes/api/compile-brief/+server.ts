import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { anthropic } from '$lib/server/anthropic';
import { tooLong } from '$lib/server/rateLimit';
import { logUsage } from '$lib/server/usage';
import { projectLens, roleFraming } from '$lib/server/role';
import { SECTION_LABELS_FOR_PROMPT } from '$lib/server/prompts';

const SYSTEM_PROMPT = `You are a senior creative strategist writing the final version of a client creative brief. You've been given structured notes from each section of the brief-building process. Your job is to weave them into one cohesive, warm, professional document that reads like it was thoughtfully written by a human strategist — not assembled from bullet points.

Rules:
1. Write in flowing prose paragraphs wherever the content is narrative (background, goals, audience, tone). Keep genuinely itemized things (deliverables lists, timelines) as clean lists — don't force everything into paragraphs if it hurts clarity.
2. Preserve every concrete fact: numbers, dates, budgets, named deliverables, constraints. Never invent or drop information.
3. Use exactly the section headers listed in SECTIONS below, in the order given. Do not add, merge, drop or rename them.
4. Keep the tone confident, clear, and human — like a strategist presenting to a client, not a report generator. No corporate jargon, no filler.
5. Use markdown: ## for headers, **bold** sparingly for emphasis, - for genuine lists only.`;

interface RequestBody {
	meta?: {
		role?: unknown;
		projectType?: unknown;
		projectName?: string;
		clientName?: string;
		briefDate?: string;
		launchDate?: string;
	};
	sections?: {
		objectives?: string;
		audience?: string;
		deliverables?: string;
		constraints?: string;
	};
	decisions?: { dimension: string; title: string; resolution?: string }[];
}

export const POST: RequestHandler = async ({ request }) => {
	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const meta = body.meta ?? {};
	const sections = body.sections ?? {};
	const decisions = body.decisions ?? [];

	const hasContent = Object.values(sections).some((value) => value && value.trim());
	if (!hasContent) {
		throw error(400, 'No section content to compile yet.');
	}

	if (tooLong(...Object.values(sections))) {
		throw error(413, 'That is more text than this tool can process at once. Please trim it down.');
	}

	/*
	 * Iterate whatever the client sent rather than four fixed names. A campaign
	 * brief carries a Channels section and a packaging one carries Specs; naming
	 * the core four here silently dropped them from the polished document.
	 */
	const DOCUMENT_HEADINGS: Record<string, string> = {
		objectives: 'Executive Summary',
		audience: 'Target Audience'
	};
	const sectionLines = Object.entries(sections)
		.map(([key, value]) => {
			const heading = DOCUMENT_HEADINGS[key] ?? SECTION_LABELS_FOR_PROMPT[key] ?? key;
			return `## ${heading}\n${value?.trim() || '(not provided)'}`;
		})
		.join('\n\n');

	const userPrompt = `Project: ${meta.projectName?.trim() || 'Untitled Project'}
Client/Brand: ${meta.clientName?.trim() || '—'}
Brief Date: ${meta.briefDate || '—'}
Target Launch Date: ${meta.launchDate || '—'}

WHO IT IS FOR
${roleFraming(meta.role)}

DISCIPLINE
${projectLens(meta.projectType)}

SECTIONS — use these headers, in this order:
${sectionLines}

DECISIONS THE CLIENT HAS EXPLICITLY CONFIRMED
These were raised as unclear, put to the client, and settled. They override anything vaguer in the notes above — write them as settled fact, never as open questions.
${
	decisions.length > 0
		? decisions.map((d) => `- ${d.dimension} — ${d.title}: ${d.resolution ?? 'confirmed'}`).join('\n')
		: '(none confirmed yet)'
}

Write the final, polished creative brief now.`;

	let message;
	try {
		message = await anthropic.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 4096,
			thinking: { type: 'adaptive' },
			output_config: { effort: 'medium' },
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		});
	} catch (err) {
		console.error('Anthropic API error compiling brief', err);
		throw error(502, 'Failed to reach Claude. Please try again.');
	}

	logUsage('compile-brief', message.usage);

	const polished = message.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n')
		.trim();

	if (!polished) {
		throw error(502, 'Claude returned an empty response. Please try again.');
	}

	return json({ polished });
};
