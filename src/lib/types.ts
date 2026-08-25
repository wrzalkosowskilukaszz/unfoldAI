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

export type FindingStatus = 'open' | 'confirmed' | 'dismissed';

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
	/** Set when the user says the finding doesn't apply. */
	dismissedAt?: string;
}

export const FINDING_META: Record<
	FindingKind,
	{ label: string; tone: string; wash: string; actionable: boolean }
> = {
	clear: { label: 'Marker', tone: 'var(--color-clear)', wash: 'var(--color-clear-wash)', actionable: false },
	attention: { label: 'Vague', tone: 'var(--color-attention)', wash: 'var(--color-attention-wash)', actionable: true },
	contradiction: { label: 'Tension', tone: 'var(--color-contradiction)', wash: 'var(--color-contradiction-wash)', actionable: true },
	missing: { label: 'Unknown', tone: 'var(--color-unknown)', wash: 'var(--color-unknown-wash)', actionable: true },
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
	/** Null until they pick a discipline; drives the AI's specialist lens. */
	projectType: ProjectType | null;
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
	'Survey',
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

/**
 * The kind of project being briefed.
 *
 * This is deliberately NOT a form template — pre-filled placeholder text gets
 * deleted and teaches the model nothing. It is a lens: it changes what the AI
 * asks about, what it treats as complete, and above all what it notices is
 * *absent*. The diagnostic can only flag a missing dieline if it knows the
 * project is packaging.
 */
export type ProjectType = 'identity' | 'website' | 'packaging' | 'campaign' | 'product' | 'other';

export interface ProjectTypeLens {
	label: string;
	/** Handed to every prompt so the model reasons as a specialist in this field. */
	lens: string;
}

export const PROJECT_TYPES: Record<ProjectType, ProjectTypeLens> = {
	identity: {
		label: 'Brand identity',
		lens: 'Reason as a brand identity specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: whether naming is in scope; which applications the identity must survive (signage, packaging, digital, merchandise, vehicle livery); how deep the guidelines must go and who will apply them; whether existing equity must be retained or deliberately broken; the competitor set it must stand apart from; typeface licensing and who pays for it; and whether any trademark search has happened.'
	},
	website: {
		label: 'Website or app',
		lens: 'Reason as a digital product specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: who writes the content and when it will exist; page or screen count and template count as distinct numbers; the CMS or platform and whether it is already chosen; required integrations (payments, CRM, booking, analytics); responsive and accessibility expectations; who builds it versus who designs it; migration of existing content and URLs; and what happens after launch.'
	},
	packaging: {
		label: 'Packaging',
		lens: 'Reason as a packaging design specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: exact SKU count and variants; substrate and finish; whether dielines exist or must be created and who supplies them; print process and printer; mandatory regulatory copy, barcodes and nutritional panels; shelf context and competitor adjacency; sustainability requirements; and territory, since legal copy changes by market.'
	},
	campaign: {
		label: 'Campaign',
		lens: 'Reason as a campaign and advertising specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: the full channel and format list with specs; whether media is booked and to what deadline; asset volume across sizes and cut-downs; usage rights, talent buyouts and stock licensing with their durations; localisation and how many markets; whether there is a single-minded proposition or a list of messages; and how success will actually be measured.'
	},
	product: {
		label: 'Physical product',
		lens: 'Reason as an industrial and product design specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: manufacturing process and tooling cost; materials and finishes; target unit cost and volume; certification and safety compliance for each territory; prototyping stages expected; who owns the CAD and the tooling; and lead times, which usually dominate the timeline.'
	},
	other: {
		label: 'Something else',
		lens: 'No specific discipline has been stated. Stay general: do not assume a medium, and where the medium would change the answer, ask rather than guess.'
	}
};
