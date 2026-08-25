/**
 * Section ids are open, not a closed union: each brief template contributes its
 * own. See SECTION_DEFS for the vocabulary and PROJECT_TYPES[t].sections for
 * which ones a given template uses, in order.
 */
export type SectionKey = string;

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

/** Default steps, for when no template is chosen. Prefer stepLabelsFor(). */
export const STEP_LABELS = ['Basics', 'Objectives', 'Audience', 'Deliverables', 'Constraints', 'Survey', 'Export'];

export interface SectionDef {
	/** Short name, used in the stepper and as the field label. */
	label: string;
	/** Full heading at the top of the step. */
	heading: string;
	/** One line under the heading saying what this section is for. */
	blurb: string;
	placeholder: string;
	/** How the model should shape this section's output. */
	framing: string;
}

/**
 * Every section this app knows how to ask for. Templates pick and order from
 * here; the four core ones are shared by all templates so that switching
 * template never strands the answers someone already gave.
 */
export const SECTION_DEFS: Record<string, SectionDef> = {
	objectives: {
		label: 'Objectives',
		heading: 'Context & Objectives',
		blurb: "What's the background, and what does this project need to achieve?",
		placeholder:
			'Paste raw notes on background, business context, and what this project needs to achieve...',
		framing:
			'Frame the output as: **Problem Statement**, **Business Goal**, and **Success Metrics**.'
	},
	audience: {
		label: 'Audience',
		heading: 'Target Audience & Key Message',
		blurb: 'Who is this for, and what should they take away?',
		placeholder: 'Paste raw notes on who this is for, what they care about, and the key message...',
		framing: 'Frame the output as: **Primary Persona**, **Core Pain Point**, and **Desired Action**.'
	},
	deliverables: {
		label: 'Deliverables',
		heading: 'Aesthetics, Tone & Deliverables',
		blurb: 'How should it feel, and what exactly is being produced?',
		placeholder: 'Paste raw notes on look/feel, tone, references, and the list of assets needed...',
		framing: 'Format the output as an itemized, clear spec sheet of deliverables.'
	},
	constraints: {
		label: 'Constraints',
		heading: 'Constraints & Mandatories',
		blurb: 'What must be respected — budget, timeline, rules, non-negotiables?',
		placeholder:
			'Paste raw notes on budget, timeline, brand rules, legal/compliance, and must-haves...',
		framing:
			'Organize the output as a clear, bulleted list of constraints and mandatories (budget, timeline, brand rules, legal/compliance, must-haves).'
	},

	// --- Template-specific. Each specialist template adds exactly one, so the
	// --- wizard grows by a single step rather than becoming a questionnaire.
	content: {
		label: 'Content & build',
		heading: 'Content, Functionality & Platform',
		blurb: 'What has to work, who writes the words, and what is it built on?',
		placeholder:
			'Paste raw notes on required functionality, integrations, the CMS or platform, who writes the content, and what happens to the existing site...',
		framing:
			'Frame the output as: **Functionality**, **Platform & Integrations**, **Content Ownership**, and **Migration**. Keep who-does-what explicit.'
	},
	brandEquity: {
		label: 'Existing brand',
		heading: 'Existing Brand & Ambition',
		blurb: 'What has to be kept, what can change, and how far should it go?',
		placeholder:
			'Paste raw notes on the current brand, what has equity worth keeping, what must change, whether naming is in scope, and the competitor set...',
		framing:
			'Frame the output as: **Current State**, **Equity to Retain**, **What Must Change**, **Naming Scope**, and **Competitive Set**.'
	},
	channels: {
		label: 'Channels & rights',
		heading: 'Channels, Formats & Usage Rights',
		blurb: 'Where does it run, in how many pieces, and for how long?',
		placeholder:
			'Paste raw notes on channels and formats, asset volume and cut-downs, markets, whether media is booked, and usage rights or talent buyouts...',
		framing:
			'Frame the output as: **Channels & Formats**, **Asset Volume**, **Markets**, and **Usage Rights & Duration**. Give numbers wherever the notes provide them.'
	},
	specs: {
		label: 'Specs & compliance',
		heading: 'Specifications & Compliance',
		blurb: 'SKUs, materials, production method and what the law requires.',
		placeholder:
			'Paste raw notes on SKU count and variants, substrate and finish, dielines, print process and printer, territories, and mandatory regulatory copy...',
		framing:
			'Frame the output as: **SKUs & Variants**, **Substrate & Finish**, **Dielines & Print Process**, and **Territory & Regulatory Requirements**.'
	},
	manufacturing: {
		label: 'Manufacturing',
		heading: 'Manufacturing, Cost & Compliance',
		blurb: 'How it gets made, what it can cost, and what it must pass.',
		placeholder:
			'Paste raw notes on manufacturing process and tooling, materials and finishes, target unit cost and volume, certification, and prototyping stages...',
		framing:
			'Frame the output as: **Process & Tooling**, **Materials & Finishes**, **Unit Cost & Volume**, and **Certification & Prototyping**.'
	}
};

/** Shared by every template, so switching template never strands answers. */
export const CORE_SECTIONS: SectionKey[] = [
	'objectives',
	'audience',
	'deliverables',
	'constraints'
];

/** Back-compat: the default set, used when no template is chosen. */
export const SECTION_ORDER: SectionKey[] = CORE_SECTIONS;

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
	Object.entries(SECTION_DEFS).map(([k, d]) => [k, d.heading])
);

export const SECTION_PLACEHOLDERS: Record<string, string> = Object.fromEntries(
	Object.entries(SECTION_DEFS).map(([k, d]) => [k, d.placeholder])
);

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
	/** Ordered section ids this kind of brief is made of. */
	sections: SectionKey[];
	/**
	 * The knowledge model. Not a list of fields — a list of parts that must agree
	 * with each other. This is what lets the survey catch "your objective is
	 * awareness but your success metric measures conversion", which is a far more
	 * useful finding than "the success metric is vague".
	 */
	coherence: string;
}

export const PROJECT_TYPES: Record<ProjectType, ProjectTypeLens> = {
	identity: {
		label: 'Brand identity',
		sections: ['objectives', 'audience', 'brandEquity', 'deliverables', 'constraints'],
		lens: `Reason as a brand identity specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: whether naming is in scope; which applications the identity must survive (signage, packaging, digital, merchandise, vehicle livery); how deep the guidelines must go and who will apply them; whether existing equity must be retained or deliberately broken; the competitor set it must stand apart from; typeface licensing and who pays for it; and whether any trademark search has happened.`,
		coherence: `Naming scope must agree with budget and timeline — naming is a project in itself. Ambition must agree with equity: a brief asking to evolve rather than revolutionise, while also asking for a wholly new visual language, is in conflict. The application list must agree with guideline depth — many applications and thin guidelines means someone will improvise. Typeface licensing must agree with the application list, since licence tiers are priced by use.`
	},
	website: {
		label: 'Website or app',
		sections: ['objectives', 'audience', 'content', 'deliverables', 'constraints'],
		lens: `Reason as a digital product specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: who writes the content and when it will exist; page or screen count and template count as distinct numbers; the CMS or platform and whether it is already chosen; required integrations (payments, CRM, booking, analytics); responsive and accessibility expectations; who builds it versus who designs it; migration of existing content and URLs; and what happens after launch.`,
		coherence: `The business objective must agree with the primary user action and with the success metric — an awareness objective measured by demo bookings is a mismatch worth raising. Content ownership must agree with the timeline: if the client writes the copy and launch is in six weeks, say so. Page and template counts must agree with the budget. The stated reason for replacing an existing site (UX, technology, positioning) must agree with what is actually being commissioned.`
	},
	packaging: {
		label: 'Packaging',
		sections: ['objectives', 'audience', 'specs', 'deliverables', 'constraints'],
		lens: `Reason as a packaging design specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: exact SKU count and variants; substrate and finish; whether dielines exist or must be created and who supplies them; print process and printer; mandatory regulatory copy, barcodes and nutritional panels; shelf context and competitor adjacency; sustainability requirements; and territory, since legal copy changes by market.`,
		coherence: `SKU count must agree with budget and timeline; artwork scales linearly and briefs routinely forget it. Sustainability claims must agree with the substrate and print process. Territory must agree with regulatory copy, since mandatory panels differ by market. Shelf standout ambition must agree with any brand-consistency requirement, which usually pulls the other way.`
	},
	campaign: {
		label: 'Campaign',
		sections: ['objectives', 'audience', 'channels', 'deliverables', 'constraints'],
		lens: `Reason as a campaign and advertising specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: the full channel and format list with specs; whether media is booked and to what deadline; asset volume across sizes and cut-downs; usage rights, talent buyouts and stock licensing with their durations; localisation and how many markets; whether there is a single-minded proposition or a list of messages; and how success will actually be measured.`,
		coherence: `The objective must agree with the success metric — awareness objectives measured by conversion are the single most common contradiction in campaign briefs. Channels must agree with asset volume and budget. Usage rights and talent buyout durations must agree with how long the campaign runs. The number of messages must agree with any claim of a single-minded proposition.`
	},
	product: {
		label: 'Physical product',
		sections: ['objectives', 'audience', 'manufacturing', 'deliverables', 'constraints'],
		lens: `Reason as an industrial and product design specialist. Things briefs in this field routinely omit, and which you should probe for and flag when absent: manufacturing process and tooling cost; materials and finishes; target unit cost and volume; certification and safety compliance for each territory; prototyping stages expected; who owns the CAD and the tooling; and lead times, which usually dominate the timeline.`,
		coherence: `Target unit cost must agree with materials, finish and manufacturing process. Volume must agree with tooling investment. Certification requirements must agree with the territory list and with the timeline, since testing is slow. Prototyping stages must agree with the launch date.`
	},
	other: {
		label: 'Something else',
		sections: CORE_SECTIONS,
		lens: `No specific discipline has been stated. Stay general: do not assume a medium, and where the medium would change the answer, ask rather than guess.`,
		coherence: `No discipline stated, so check general coherence: objectives against success measures, scope against budget, and scope against timeline.`
	}
};

/** The sections a brief on this template is made of, in order. */
export function sectionsFor(template: ProjectType | null | undefined): SectionKey[] {
	if (!template || !(template in PROJECT_TYPES)) return CORE_SECTIONS;
	return PROJECT_TYPES[template].sections;
}

/**
 * Wizard steps for a template: Basics, one per section, Survey, Export.
 * Derived rather than stored so a template change can never leave the stepper
 * and the actual steps disagreeing.
 */
export function stepLabelsFor(template: ProjectType | null | undefined): string[] {
	return [
		'Basics',
		...sectionsFor(template).map((k) => SECTION_DEFS[k]?.label ?? k),
		'Survey',
		'Export'
	];
}

export function totalStepsFor(template: ProjectType | null | undefined): number {
	return stepLabelsFor(template).length;
}

/** Step number of the Survey step for this template. */
export function surveyStepFor(template: ProjectType | null | undefined): number {
	return sectionsFor(template).length + 2;
}
