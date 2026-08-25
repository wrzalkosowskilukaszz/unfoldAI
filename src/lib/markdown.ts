import { SECTION_DEFS, sectionsFor } from '$lib/types';
import type { Finding, ProjectMeta, SectionKey, SectionState } from '$lib/types';

/**
 * The exported document reads better with an "Executive Summary" than a
 * "Context & Objectives", so a few core sections get a document-voice heading.
 * Anything else falls back to the section's own heading.
 */
const DOCUMENT_HEADINGS: Record<string, string> = {
	objectives: 'Executive Summary',
	audience: 'Target Audience'
};

function headingFor(key: SectionKey): string {
	return DOCUMENT_HEADINGS[key] ?? SECTION_DEFS[key]?.heading ?? key;
}

/**
 * Briefs built before the interview switched to markdown still hold raw
 * "Q: …\nA: …" transcripts, which markdown collapses into one run-on line.
 * Rewrite them at render time so old briefs read as well as new ones.
 */
function normalizeLegacyTranscript(text: string): string {
	if (!/^Q:\s/m.test(text)) return text;

	return text
		.split(/\n{2,}/)
		.map((block) => {
			const match = block.match(/^Q:\s*([\s\S]*?)\n\s*A:\s*([\s\S]*)$/);
			if (!match) return block;
			const [, question, answer] = match;
			return `**${question.trim()}**\n\n${answer.trim()}`;
		})
		.join('\n\n');
}

export interface OpenItems {
	/** Findings raised by the review and not yet settled. */
	unresolved: Finding[];
	/** Sections with nothing written in them. */
	empty: SectionKey[];
}

/** Section content only. The Export view renders its own designed header above this. */
export function compileBriefBody(
	sections: Record<SectionKey, SectionState>,
	keys: SectionKey[],
	decisions: Finding[] = [],
	open?: OpenItems
): string {
	const parts: string[] = [];

	for (const key of keys) {
		const body = normalizeLegacyTranscript((sections[key]?.raw ?? '').trim()) || '_Not provided._';
		parts.push(`## ${headingFor(key)}`, '', body, '');
	}

	if (decisions.length > 0) {
		parts.push('## Decisions', '');
		for (const d of decisions) {
			parts.push(`- **${d.dimension} — ${d.title}:** ${d.resolution ?? 'Confirmed'}`);
		}
		parts.push('');
	}

	/*
	 * The point of this tool is what the brief has NOT settled. Leaving that out
	 * of the exported document hides the most useful thing it produced, so it
	 * ships as a real section — the team reading the brief needs to see it.
	 */
	if (open && (open.unresolved.length > 0 || open.empty.length > 0)) {
		parts.push('## Open Questions', '');
		parts.push('_Raised while building this brief and not yet settled._', '');

		for (const f of open.unresolved) {
			parts.push(`- **${f.dimension} — ${f.title}**`);
			if (f.question) parts.push(`  - ${f.question}`);
		}

		if (open.empty.length > 0) {
			parts.push(
				'',
				`**Not yet filled in:** ${open.empty.map((k) => headingFor(k)).join(', ')}.`
			);
		}
		parts.push('');
	}

	return parts.join('\n');
}

/** The complete document, used for clipboard and print. */
export function compileBriefMarkdown(
	meta: ProjectMeta,
	sections: Record<SectionKey, SectionState>,
	decisions: Finding[] = [],
	open?: OpenItems
): string {
	const keys = sectionsFor(meta.projectType);
	return [
		`# ${meta.projectName.trim() || 'Untitled Project'}`,
		'',
		`**Client/Brand:** ${meta.clientName.trim() || '—'}  `,
		`**Brief Date:** ${meta.briefDate || '—'}  `,
		`**Target Launch Date:** ${meta.launchDate || '—'}`,
		'',
		compileBriefBody(sections, keys, decisions, open)
	].join('\n');
}
