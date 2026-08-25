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
	/** Null until the person says which end of the handoff they are on. */
	role: BriefRole | null;
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

/**
 * Which end of the handoff the person filling this in is on.
 *
 * The same brief reads differently depending on whether you are commissioning
 * the work or doing it: "Client / Brand" means someone else's company to a
 * designer, and your own company to the person hiring one. Labels, placeholders
 * and the AI's framing all key off this rather than assuming an agency reader.
 */
export type BriefRole = 'commissioning' | 'delivering';

export interface RoleCopy {
	/** Shown on the chooser. */
	label: string;
	hint: string;
	/** What the organisation field is actually called for this role. */
	orgLabel: string;
	orgPlaceholder: string;
	/** Handed to the model so it addresses the right person. */
	promptFraming: string;
}

export const ROLE_COPY: Record<BriefRole, RoleCopy> = {
	commissioning: {
		label: 'I need the work done',
		hint: "You're briefing a designer, studio or agency.",
		orgLabel: 'Your company or brand',
		orgPlaceholder: 'e.g. Acme Corp',
		promptFraming:
			'The person writing this is the CLIENT — they are commissioning the work and will hand this brief to a designer, studio or agency. Address them directly as the person who owns the project. Never refer to "the client" in the third person; they are the client. Do not assume they know design vocabulary.'
	},
	delivering: {
		label: "I'm doing the work",
		hint: "You're the designer, studio or agency.",
		orgLabel: 'Client / Brand',
		orgPlaceholder: 'e.g. Acme Corp',
		promptFraming:
			'The person writing this is the DESIGNER, studio or agency who will deliver the work. They are writing up what a client told them, so the notes may be second-hand. Refer to "the client" in the third person, and treat design vocabulary as shared ground.'
	}
};
