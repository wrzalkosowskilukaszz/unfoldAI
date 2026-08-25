import { browser } from '$app/environment';
import {
	SECTION_ORDER,
	STEP_LABELS,
	type Finding,
	type HelpExchange,
	type ProjectMeta,
	type SavedBrief,
	type SectionKey,
	type SectionState,
	type SectionStatus
} from '$lib/types';

const STORAGE_KEY = 'unfold-ai-briefs-v1';
/** Pre-rename multi-brief store. Read once, then migrated to STORAGE_KEY. */
const LEGACY_BRIEFS_KEY = 'briefflow-ai-briefs-v1';
/** Original single-brief store, from before the My Briefs gallery existed. */
const LEGACY_SINGLE_KEY = 'briefflow-ai-state-v1';
/** Derived from the labels so the two can never drift apart. */
const TOTAL_STEPS = STEP_LABELS.length;
const DEFAULT_NAME = 'Untitled Brief';

function emptySection(): SectionState {
	return { raw: '', refined: null, accepted: false, status: 'idle', error: null };
}

function emptyMeta(): ProjectMeta {
	return { projectName: '', clientName: '', briefDate: '', launchDate: '' };
}

function emptySections(): Record<SectionKey, SectionState> {
	const sections = {} as Record<SectionKey, SectionState>;
	for (const key of SECTION_ORDER) sections[key] = emptySection();
	return sections;
}

function makeId(): string {
	return browser && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function makeBrief(overrides: Partial<SavedBrief> = {}): SavedBrief {
	const now = new Date().toISOString();
	return {
		id: makeId(),
		name: DEFAULT_NAME,
		nameManuallySet: false,
		createdAt: now,
		updatedAt: now,
		step: 1,
		meta: emptyMeta(),
		sections: emptySections(),
		helpHistory: [],
		findings: [],
		reviewedAt: null,
		polishedBrief: null,
		...overrides
	};
}

/** Briefs saved before a field existed load without it — backfill so nothing reads undefined. */
function normalizeBrief(brief: SavedBrief): SavedBrief {
	if (!Array.isArray(brief.helpHistory)) brief.helpHistory = [];
	if (!Array.isArray(brief.findings)) brief.findings = [];
	if (brief.reviewedAt === undefined) brief.reviewedAt = null;
	if (brief.polishedBrief === undefined) brief.polishedBrief = null;
	for (const key of SECTION_ORDER) {
		if (!brief.sections[key]) brief.sections[key] = emptySection();
	}
	return brief;
}

class BriefStore {
	briefs = $state<Record<string, SavedBrief>>({});
	activeBriefId = $state<string | null>(null);
	private fallbackBrief = makeBrief();

	constructor() {
		if (!browser) return;
		this.load();
		// Deliberately does NOT create a brief when there are none. A first-time
		// user should see a real starting point, not a phantom "Untitled Brief"
		// they never made sitting under "Pick up where you left off".
		if (!this.activeBriefId || !this.briefs[this.activeBriefId]) {
			this.activeBriefId = Object.keys(this.briefs)[0] ?? null;
		}
	}

	get isEmpty(): boolean {
		return Object.keys(this.briefs).length === 0;
	}

	/** Briefs carrying findings the user hasn't settled yet. */
	get briefsNeedingAttention(): SavedBrief[] {
		return this.listBriefs().filter((b) =>
			(b.findings ?? []).some((f) => f.status === 'open' && f.kind !== 'clear')
		);
	}

	private load() {
		// Current store, then each older format in turn — briefs survive the renames.
		if (this.loadBriefsFormat(STORAGE_KEY)) return;
		if (this.loadBriefsFormat(LEGACY_BRIEFS_KEY)) {
			localStorage.removeItem(LEGACY_BRIEFS_KEY);
			this.persist();
			return;
		}
		this.loadSingleBriefFormat();
	}

	/** Reads the {briefs, activeBriefId} shape. Returns false if absent or unreadable. */
	private loadBriefsFormat(key: string): boolean {
		const saved = localStorage.getItem(key);
		if (!saved) return false;
		try {
			const parsed = JSON.parse(saved);
			if (!parsed.briefs || Object.keys(parsed.briefs).length === 0) return false;
			for (const brief of Object.values(parsed.briefs as Record<string, SavedBrief>)) {
				normalizeBrief(brief);
			}
			this.briefs = parsed.briefs;
			if (typeof parsed.activeBriefId === 'string') this.activeBriefId = parsed.activeBriefId;
			return true;
		} catch {
			return false;
		}
	}

	/** Reads the original single-brief shape and wraps it as one saved brief. */
	private loadSingleBriefFormat() {
		const legacy = localStorage.getItem(LEGACY_SINGLE_KEY);
		if (!legacy) return;
		try {
			const parsed = JSON.parse(legacy);
			const brief = makeBrief({
				name: parsed.meta?.projectName || DEFAULT_NAME,
				nameManuallySet: false,
				step: typeof parsed.step === 'number' ? parsed.step : 1,
				meta: { ...emptyMeta(), ...parsed.meta },
				sections: { ...emptySections(), ...parsed.sections }
			});
			this.briefs = { [brief.id]: brief };
			this.activeBriefId = brief.id;
			localStorage.removeItem(LEGACY_SINGLE_KEY);
			this.persist();
		} catch {
			// corrupt legacy state — ignore, start fresh
		}
	}

	private persist() {
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ briefs: this.briefs, activeBriefId: this.activeBriefId })
		);
	}

	private touch() {
		if (this.active) this.active.updatedAt = new Date().toISOString();
	}

	get active(): SavedBrief {
		return (this.activeBriefId && this.briefs[this.activeBriefId]) || this.fallbackBrief;
	}

	get step() {
		return this.active.step;
	}

	get meta() {
		return this.active.meta;
	}

	get sections() {
		return this.active.sections;
	}

	get name() {
		return this.active.name;
	}

	/**
	 * Whether a step actually has something in it. Position alone is not
	 * completion — marking empty steps "done" because the user walked past them
	 * reports a state that isn't true, and lets an empty brief look finished.
	 */
	isStepComplete(step: number): boolean {
		const b = this.active;
		switch (step) {
			case 1:
				return b.meta.projectName.trim().length > 0;
			case 2:
				return b.sections.objectives.raw.trim().length > 0;
			case 3:
				return b.sections.audience.raw.trim().length > 0;
			case 4:
				return b.sections.deliverables.raw.trim().length > 0;
			case 5:
				return b.sections.constraints.raw.trim().length > 0;
			case 6:
				return b.reviewedAt !== null && b.findings.length > 0;
			default:
				return false;
		}
	}

	/** Sections left empty — surfaced in the export so gaps are visible. */
	get emptySections(): SectionKey[] {
		return SECTION_ORDER.filter((k) => !this.active.sections[k].raw.trim());
	}

	get openFindings(): Finding[] {
		return this.active.findings.filter((f) => f.status === 'open' && f.kind !== 'clear');
	}

	listBriefs(): SavedBrief[] {
		return Object.values(this.briefs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}

	createBrief(): string {
		const brief = makeBrief();
		this.briefs[brief.id] = brief;
		this.activeBriefId = brief.id;
		this.persist();
		return brief.id;
	}

	openBrief(id: string) {
		if (!this.briefs[id]) return;
		this.activeBriefId = id;
		this.persist();
	}

	renameBrief(id: string, name: string) {
		const brief = this.briefs[id];
		if (!brief) return;
		brief.name = name.trim() || DEFAULT_NAME;
		brief.nameManuallySet = true;
		brief.updatedAt = new Date().toISOString();
		this.persist();
	}

	deleteBrief(id: string) {
		if (!this.briefs[id]) return;
		delete this.briefs[id];
		// Deleting the last brief returns to the empty state rather than
		// silently conjuring a replacement.
		if (this.activeBriefId === id) {
			this.activeBriefId = Object.keys(this.briefs)[0] ?? null;
		}
		this.persist();
	}

	duplicateBrief(id: string): string | null {
		const source = this.briefs[id];
		if (!source) return null;
		const now = new Date().toISOString();
		const copy = makeBrief({
			...$state.snapshot(source),
			id: makeId(),
			name: `${source.name} (copy)`,
			// A copy is new: inheriting the source's timestamps would mis-sort the gallery.
			createdAt: now,
			updatedAt: now
		});
		this.briefs[copy.id] = copy;
		this.persist();
		return copy.id;
	}

	exportBriefJSON(id: string): string {
		return JSON.stringify($state.snapshot(this.briefs[id]), null, 2);
	}

	importBriefFromJSON(json: string): string {
		const parsed = JSON.parse(json);
		if (!parsed || typeof parsed !== 'object') {
			throw new Error('Not a brief file');
		}
		const now = new Date().toISOString();
		// Carry everything the export wrote — dropping findings or help history here
		// would silently lose the client decisions this brief was built on.
		const brief = makeBrief({
			name: parsed.name ? `${parsed.name} (imported)` : 'Imported Brief',
			nameManuallySet: true,
			createdAt: now,
			updatedAt: now,
			step: typeof parsed.step === 'number' ? parsed.step : 1,
			meta: { ...emptyMeta(), ...parsed.meta },
			sections: { ...emptySections(), ...parsed.sections },
			helpHistory: Array.isArray(parsed.helpHistory) ? parsed.helpHistory : [],
			findings: Array.isArray(parsed.findings) ? parsed.findings : [],
			reviewedAt: typeof parsed.reviewedAt === 'string' ? parsed.reviewedAt : null,
			polishedBrief: typeof parsed.polishedBrief === 'string' ? parsed.polishedBrief : null
		});
		normalizeBrief(brief);
		this.briefs[brief.id] = brief;
		this.persist();
		return brief.id;
	}

	goToStep(step: number) {
		this.active.step = Math.min(Math.max(step, 1), TOTAL_STEPS);
		this.persist();
	}

	next() {
		this.goToStep(this.step + 1);
	}

	back() {
		this.goToStep(this.step - 1);
	}

	updateMeta(patch: Partial<ProjectMeta>) {
		Object.assign(this.active.meta, patch);
		if (!this.active.nameManuallySet && patch.projectName?.trim()) {
			this.active.name = patch.projectName.trim();
		}
		this.touch();
		this.persist();
	}

	setRaw(key: SectionKey, value: string) {
		this.active.sections[key].raw = value;
		this.active.sections[key].accepted = false;
		this.touch();
		this.persist();
	}

	setStatus(key: SectionKey, status: SectionStatus, error: string | null = null) {
		this.active.sections[key].status = status;
		this.active.sections[key].error = error;
		this.persist();
	}

	setRefined(key: SectionKey, refined: string) {
		this.active.sections[key].refined = refined;
		this.active.sections[key].status = 'idle';
		this.active.sections[key].error = null;
		this.touch();
		this.persist();
	}

	acceptRefined(key: SectionKey) {
		const section = this.active.sections[key];
		if (section.refined) {
			section.raw = section.refined;
			section.refined = null;
			section.accepted = true;
		}
		this.touch();
		this.persist();
	}

	setEdited(key: SectionKey, value: string) {
		const section = this.active.sections[key];
		section.raw = value;
		section.refined = null;
		section.accepted = true;
		this.touch();
		this.persist();
	}

	get helpHistory(): HelpExchange[] {
		return this.active.helpHistory;
	}

	get polishedBrief(): string | null {
		return this.active.polishedBrief;
	}

	setPolishedBrief(markdown: string) {
		this.active.polishedBrief = markdown;
		this.touch();
		this.persist();
	}

	get findings(): Finding[] {
		return this.active.findings;
	}

	get reviewedAt(): string | null {
		return this.active.reviewedAt;
	}

	/** Decisions the user has locked — carried into the final brief. */
	get decisions(): Finding[] {
		return this.active.findings.filter((f) => f.status === 'confirmed');
	}

	setFindings(findings: Finding[]) {
		// A re-review replaces open findings but never discards locked decisions.
		const locked = this.active.findings.filter((f) => f.status === 'confirmed');
		const lockedDimensions = new Set(locked.map((f) => `${f.dimension}::${f.title}`));
		const fresh = findings.filter((f) => !lockedDimensions.has(`${f.dimension}::${f.title}`));
		this.active.findings = [...locked, ...fresh];
		this.active.reviewedAt = new Date().toISOString();
		this.touch();
		this.persist();
	}

	resolveFinding(id: string, resolution: string) {
		const finding = this.active.findings.find((f) => f.id === id);
		if (!finding) return;
		finding.status = 'confirmed';
		finding.resolution = resolution;
		finding.resolvedAt = new Date().toISOString();
		this.touch();
		this.persist();
	}

	reopenFinding(id: string) {
		const finding = this.active.findings.find((f) => f.id === id);
		if (!finding) return;
		finding.status = 'open';
		finding.resolution = undefined;
		finding.resolvedAt = undefined;
		this.touch();
		this.persist();
	}

	appendHelpHistory(section: SectionKey, exchanges: { question: string; answer: string }[]) {
		for (const { question, answer } of exchanges) {
			this.active.helpHistory.push({ section, question, answer });
		}
		this.touch();
		this.persist();
	}
}

export const briefStore = new BriefStore();
export { TOTAL_STEPS };
