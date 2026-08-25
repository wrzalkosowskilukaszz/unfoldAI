export type SectionKey = 'objectives' | 'audience' | 'deliverables' | 'constraints';

export type SectionStatus = 'idle' | 'loading' | 'error';

export interface SectionState {
	raw: string;
	refined: string | null;
	accepted: boolean;
	status: SectionStatus;
	error: string | null;
}

export interface HelpQuestion {
	id: string;
	text: string;
	type: 'choice' | 'text';
	options?: string[];
}

export interface HelpAnswer {
	question: string;
	answer: string;
	skipped?: boolean;
}

/** One Q&A exchange, kept across sections so later help sessions stay informed. */
export interface HelpExchange {
	section: SectionKey;
	question: string;
	answer: string;
}

export const MAX_HELP_QUESTIONS = 5;

/**
 * What the review found. `clear` is deliberately included so the panel reports
 * strengths too, rather than reading as a wall of complaints.
 */
export type FindingKind =
	| 'clear'
	| 'attention'
	| 'contradiction'
	| 'missing'
	| 'assumption'
	| 'why';

export type FindingStatus = 'open' | 'confirmed';

export interface Finding {
	id: string;
	kind: FindingKind;
	/** The brief dimension this concerns, e.g. "Audience", "Success criteria". */
	dimension: string;
	title: string;
	detail: string;
	/** Present on anything actionable; absent on `clear`. */
	question?: string;
	options?: string[];
	status: FindingStatus;
	/** The answer that locked it. */
	resolution?: string;
	resolvedAt?: string;
}

export const FINDING_META: Record<
	FindingKind,
	{ label: string; tone: string; wash: string; actionable: boolean }
> = {
	clear: { label: 'Clear', tone: 'var(--color-clear)', wash: 'var(--color-clear-wash)', actionable: false },
	attention: { label: 'Vague', tone: 'var(--color-attention)', wash: 'var(--color-attention-wash)', actionable: true },
	contradiction: { label: 'Contradiction', tone: 'var(--color-contradiction)', wash: 'var(--color-contradiction-wash)', actionable: true },
	missing: { label: 'Missing', tone: 'var(--color-unknown)', wash: 'var(--color-unknown-wash)', actionable: true },
	assumption: { label: 'Assumption', tone: 'var(--color-accent)', wash: 'var(--color-accent-wash)', actionable: true },
	why: { label: 'Why?', tone: 'var(--color-accent)', wash: 'var(--color-accent-wash)', actionable: true }
};

export interface ProjectMeta {
	projectName: string;
	clientName: string;
	briefDate: string;
	launchDate: string;
}

export interface SavedBrief {
	id: string;
	name: string;
	nameManuallySet: boolean;
	createdAt: string;
	updatedAt: string;
	step: number;
	meta: ProjectMeta;
	sections: Record<SectionKey, SectionState>;
	helpHistory: HelpExchange[];
	findings: Finding[];
	reviewedAt: string | null;
	/** Cached narrative rewrite — expensive to generate, so it survives navigation. */
	polishedBrief: string | null;
}

export const STEP_LABELS = [
	'Basics',
	'Objectives',
	'Audience',
	'Deliverables',
	'Constraints',
	'Review',
	'Export'
];

export const SECTION_ORDER: SectionKey[] = ['objectives', 'audience', 'deliverables', 'constraints'];

export const SECTION_LABELS: Record<SectionKey, string> = {
	objectives: 'Context & Objectives',
	audience: 'Target Audience & Key Message',
	deliverables: 'Aesthetics, Tone & Deliverables',
	constraints: 'Constraints & Mandatories'
};

export const SECTION_PLACEHOLDERS: Record<SectionKey, string> = {
	objectives:
		'Paste raw notes on background, business context, and what this project needs to achieve...',
	audience: 'Paste raw notes on who this is for, what they care about, and the key message...',
	deliverables: 'Paste raw notes on look/feel, tone, references, and the list of assets needed...',
	constraints: 'Paste raw notes on budget, timeline, brand rules, legal/compliance, and must-haves...'
};
