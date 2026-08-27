import { browser } from '$app/environment';
import {
	SECTION_DEFS,
	STEP_LABELS,
	sectionsFor,
	stepLabelsFor,
	surveyStepFor,
	totalStepsFor,
	type Finding,
	type HelpExchange,
	type ProjectMeta,
	type SavedBrief,
	type SectionKey,
	type SectionState,
	type SectionStatus
} from '$lib/types';

const STORAGE_KEY = 'surveyvor-briefs-v1';
/** Unfold AI era. Read once, then migrated to STORAGE_KEY. */
const LEGACY_UNFOLD_KEY = 'unfold-ai-briefs-v1';
/** BriefFlow era. Read once, then migrated to STORAGE_KEY. */
const LEGACY_BRIEFS_KEY = 'briefflow-ai-briefs-v1';
/** Original single-brief store, from before the My Briefs gallery existed. */
const LEGACY_SINGLE_KEY = 'briefflow-ai-state-v1';
/** Derived from the labels so the two can never drift apart. */
/** Default only. A brief's real length depends on its template — use briefStore.totalSteps. */
const TOTAL_STEPS = STEP_LABELS.length;
const DEFAULT_NAME = 'Untitled Brief';

function emptySection(): SectionState {
	return { raw: '', refined: null, accepted: false, status: 'idle', error: null };
}

function emptyMeta(): ProjectMeta {
	return {
		projectName: '',
		clientName: '',
		briefDate: '',
		launchDate: '',
		role: null,
		projectType: null
	};
}

/**
 * Seeds every section this app knows about, not just the current template's.
 * Switching template then only changes which are *shown* — nothing a person
 * already typed is ever dropped on the floor.
 */
function emptySections(): Record<SectionKey, SectionState> {
	const sections = {} as Record<SectionKey, SectionState>;
	for (const key of Object.keys(SECTION_DEFS)) sections[key] = emptySection();
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
		lastExportedAt: null,
		...overrides
	};
}

/** Briefs saved before a field existed load without it — backfill so nothing reads undefined. */
function normalizeBrief(brief: SavedBrief): SavedBrief {
	if (!Array.isArray(brief.helpHistory)) brief.helpHistory = [];
	if (!Array.isArray(brief.findings)) brief.findings = [];
	if (brief.reviewedAt === undefined) brief.reviewedAt = null;
	if (brief.polishedBrief === undefined) brief.polishedBrief = null;
	if (brief.lastExportedAt === undefined) brief.lastExportedAt = null;
	// Briefs written before the role question existed simply never answered it.
	if (brief.meta && brief.meta.role === undefined) brief.meta.role = null;
	if (brief.meta && brief.meta.projectType === undefined) brief.meta.projectType = null;
	// Briefs written before a section existed simply do not have it yet.
	for (const key of Object.keys(SECTION_DEFS)) {
		if (!brief.sections[key]) brief.sections[key] = emptySection();
	}
	return brief;
}

class BriefStore {
	briefs = $state<Record<string, SavedBrief>>({});
	/** Drives the save indicator. 'error' is sticky until the next good write. */
	saveState = $state<'idle' | 'saved' | 'error'>('idle');
	savedAt = $state<number>(0);
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
		if (this.loadBriefsFormat(LEGACY_UNFOLD_KEY)) {
			localStorage.removeItem(LEGACY_UNFOLD_KEY);
			this.persist();
			return;
		}
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
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ briefs: this.briefs, activeBriefId: this.activeBriefId })
			);
		} catch (err) {
			// Quota exceeded or storage blocked (private browsing, disabled cookies).
			// Silently losing someone's brief is the worst thing this app could do.
			this.saveState = 'error';
			console.error('Could not save to localStorage', err);
			return;
		}

		// Writing is synchronous, so "saving" would never be seen. What people
		// actually need is proof it happened — so show "Saved" and let it settle.
		this.saveState = 'saved';
		this.savedAt = Date.now();
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
	/** The section ids this brief is made of, in order, per its template. */
	get sectionKeys(): SectionKey[] {
		return sectionsFor(this.active.meta.projectType);
	}

	get stepLabels(): string[] {
		return stepLabelsFor(this.active.meta.projectType);
	}

	get totalSteps(): number {
		return totalStepsFor(this.active.meta.projectType);
	}

	/** Step 1 is Basics, then one step per section, then Survey, then Export. */
	get surveyStep(): number {
		return surveyStepFor(this.active.meta.projectType);
	}

	/** The section shown at a given step, or null if that step isn't a section. */
	sectionAtStep(step: number): SectionKey | null {
		return this.sectionKeys[step - 2] ?? null;
	}

	isStepComplete(step: number): boolean {
		const b = this.active;
		if (step === 1) return b.meta.projectName.trim().length > 0;
		if (step === this.surveyStep) return b.reviewedAt !== null && b.findings.length > 0;
		const key = this.sectionAtStep(step);
		if (key) return (b.sections[key]?.raw ?? '').trim().length > 0;
		return false;
	}

	/** Sections left empty — surfaced in the export so gaps are visible. */
	get emptySections(): SectionKey[] {
		return this.sectionKeys.filter((k) => !(this.active.sections[k]?.raw ?? '').trim());
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

	/** Call whenever a brief leaves the app as something the user keeps. */
	markExported(id: string) {
		const b = this.briefs[id];
		if (!b) return;
		b.lastExportedAt = new Date().toISOString();
		this.persist();
	}

	/**
	 * True when there is real work here that has never been written to a file, or
	 * has changed since it was. Content-based, so an empty brief never nags.
	 */
	needsBackup(brief: SavedBrief): boolean {
		const hasContent = Object.values(brief.sections ?? {}).some((sec) => sec?.raw?.trim());
		if (!hasContent) return false;
		if (!brief.lastExportedAt) return true;
		return new Date(brief.updatedAt) > new Date(brief.lastExportedAt);
	}

	get activeNeedsBackup(): boolean {
		return this.needsBackup(this.active);
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
		this.active.step = Math.min(Math.max(step, 1), this.totalSteps);
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
		// Templates differ in length, so a change can leave you past the last step.
		// Nothing is lost — sections not in the new template keep their text.
		if (patch.projectType !== undefined) {
			this.active.step = Math.min(this.active.step, this.totalSteps);
		}
		this.touch();
		this.persist();
	}

	setRaw(key: SectionKey, value: string) {
		if (!this.active.sections[key]) this.active.sections[key] = emptySection();
		this.active.sections[key].raw = value;
		this.active.sections[key].accepted = false;
		this.touch();
		this.persist();
	}

	setStatus(key: SectionKey, status: SectionStatus, error: string | null = null) {
		if (!this.active.sections[key]) this.active.sections[key] = emptySection();
		this.active.sections[key].status = status;
		this.active.sections[key].error = error;
		this.persist();
	}

	setRefined(key: SectionKey, refined: string) {
		if (!this.active.sections[key]) this.active.sections[key] = emptySection();
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
		// Dismissed findings are as deliberate as confirmed ones — a re-review that
		// resurrected them would be the nagging machine we promised not to build.
		const locked = this.active.findings.filter(
			(f) => f.status === 'confirmed' || f.status === 'dismissed'
		);
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

	dismissFinding(id: string) {
		const finding = this.active.findings.find((f) => f.id === id);
		if (!finding) return;
		finding.status = 'dismissed';
		finding.dismissedAt = new Date().toISOString();
		this.touch();
		this.persist();
	}

	reopenFinding(id: string) {
		const finding = this.active.findings.find((f) => f.id === id);
		if (!finding) return;
		finding.status = 'open';
		finding.resolution = undefined;
		finding.resolvedAt = undefined;
		finding.dismissedAt = undefined;
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
