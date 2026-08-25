import type { Finding, ProjectMeta, SectionKey, SectionState } from '$lib/types';

const SECTION_HEADINGS: [SectionKey, string][] = [
	['objectives', 'Executive Summary'],
	['audience', 'Target Audience'],
	['deliverables', 'Deliverables'],
	['constraints', 'Constraints']
];

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

const SECTION_LABEL: Record<SectionKey, string> = {
	objectives: 'Context & Objectives',
	audience: 'Target Audience',
	deliverables: 'Deliverables',
	constraints: 'Constraints'
};

/** Section content only. The Export view renders its own designed header above this. */
export function compileBriefBody(
	sections: Record<SectionKey, SectionState>,
	decisions: Finding[] = [],
	open?: OpenItems
): string {
	const parts: string[] = [];

	for (const [key, heading] of SECTION_HEADINGS) {
		const body = normalizeLegacyTranscript(sections[key].raw.trim()) || '_Not provided._';
		parts.push(`## ${heading}`, '', body, '');
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
				`**Not yet filled in:** ${open.empty.map((k) => SECTION_LABEL[k]).join(', ')}.`
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
	return [
		`# ${meta.projectName.trim() || 'Untitled Project'}`,
		'',
		`**Client/Brand:** ${meta.clientName.trim() || '—'}  `,
		`**Brief Date:** ${meta.briefDate || '—'}  `,
		`**Target Launch Date:** ${meta.launchDate || '—'}`,
		'',
		compileBriefBody(sections, decisions, open)
	].join('\n');
}
