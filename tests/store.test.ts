import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The store is a module-level singleton that reads localStorage in its
 * constructor, so every test needs a fresh module instance built against
 * whatever storage state it wants to simulate.
 */
async function freshStore() {
	vi.resetModules();
	const mod = await import('$lib/stores/brief.svelte');
	return mod.briefStore;
}

const KEY = 'surveyvor-briefs-v1';

function briefFixture(over: Record<string, unknown> = {}) {
	return {
		id: 'b1',
		name: 'Zorka sauce range',
		nameManuallySet: true,
		createdAt: '2026-08-01T10:00:00Z',
		updatedAt: '2026-08-01T10:00:00Z',
		step: 3,
		meta: { projectName: 'Zorka sauce range', clientName: 'Zorka', briefDate: '', launchDate: '' },
		sections: { objectives: { raw: 'Need new packs', refined: 'Refined', accepted: true, status: 'idle', error: null } },
		findings: [{ id: 'f1', kind: 'contradiction', dimension: 'Timeline', title: 'Dates clash', detail: 'd', status: 'open' }],
		helpHistory: [{ section: 'objectives', question: 'Q?', answer: 'A' }],
		reviewedAt: '2026-08-01T10:00:00Z',
		polishedBrief: 'Polished text',
		...over
	};
}

beforeEach(() => localStorage.clear());

describe('storage migration chain', () => {
	// Renaming the app twice has already happened; a dropped link here would
	// silently destroy every existing user's work.
	const legacyKeys = ['unfold-ai-briefs-v1', 'briefflow-ai-briefs-v1'];

	for (const key of legacyKeys) {
		it(`carries briefs forward from ${key} without losing anything`, async () => {
			localStorage.setItem(key, JSON.stringify({ activeBriefId: 'b1', briefs: { b1: briefFixture() } }));
			const store = await freshStore();

			const b = store.briefs.b1;
			expect(b, 'brief survived the migration').toBeTruthy();
			expect(b.name).toBe('Zorka sauce range');
			expect(b.step).toBe(3);
			expect(b.sections.objectives.raw).toBe('Need new packs');
			expect(b.findings).toHaveLength(1);
			expect(b.helpHistory).toHaveLength(1);
			expect(b.polishedBrief).toBe('Polished text');
			expect(b.reviewedAt).not.toBeNull();

			expect(localStorage.getItem(KEY), 'rewritten under the current key').toBeTruthy();
			expect(localStorage.getItem(key), 'old key cleaned up').toBeNull();
		});
	}

	it('normalises fields that did not exist when the brief was written', async () => {
		localStorage.setItem('unfold-ai-briefs-v1', JSON.stringify({ activeBriefId: 'b1', briefs: { b1: briefFixture() } }));
		const store = await freshStore();
		const b = store.briefs.b1;

		// role and projectType postdate these briefs — they must be null, never undefined,
		// or `in` checks and chooser state go wrong.
		expect(b.meta.role).toBeNull();
		expect(b.meta.projectType).toBeNull();
		// Every known section must exist so no lookup can throw.
		expect(b.sections.audience).toBeTruthy();
		expect(b.sections.specs).toBeTruthy();
	});

	it('leaves corrupt storage alone rather than crashing', async () => {
		localStorage.setItem(KEY, '{not valid json');
		const store = await freshStore();
		expect(store.isEmpty).toBe(true);
	});
});

describe('first run', () => {
	it('creates no phantom brief for a brand-new user', async () => {
		const store = await freshStore();
		expect(store.isEmpty, 'a first-time user sees an empty gallery').toBe(true);
		expect(Object.keys(store.briefs)).toHaveLength(0);
	});
});

describe('templates reshape the brief', () => {
	it('derives step count and section order from the chosen template', async () => {
		const store = await freshStore();
		store.createBrief();

		expect(store.totalSteps, 'no template: basics + 4 sections + survey + export').toBe(7);

		store.updateMeta({ projectType: 'campaign' });
		expect(store.totalSteps, 'a specialist template adds exactly one section').toBe(8);
		expect(store.sectionKeys).toEqual(['objectives', 'audience', 'channels', 'deliverables', 'constraints']);
		expect(store.stepLabels[0]).toBe('Basics');
		expect(store.stepLabels.at(-1)).toBe('Export');
		expect(store.surveyStep).toBe(7);
	});

	it('never discards text when the template changes', async () => {
		const store = await freshStore();
		store.createBrief();

		store.updateMeta({ projectType: 'campaign' });
		store.setRaw('objectives', 'CORE text');
		store.setRaw('channels', 'CAMPAIGN text');

		store.updateMeta({ projectType: 'packaging' });
		store.setRaw('specs', 'PACKAGING text');

		// Switching hides sections; it must never delete them.
		expect(store.sections.channels.raw).toBe('CAMPAIGN text');

		store.updateMeta({ projectType: 'campaign' });
		expect(store.sections.specs.raw).toBe('PACKAGING text');
		expect(store.sections.objectives.raw).toBe('CORE text');
	});

	it('clamps the current step when a template shortens the wizard', async () => {
		const store = await freshStore();
		store.createBrief();
		store.updateMeta({ projectType: 'campaign' });
		store.goToStep(8);
		expect(store.step).toBe(8);

		store.updateMeta({ projectType: null });
		expect(store.step, 'must not be stranded past the last step').toBeLessThanOrEqual(store.totalSteps);
	});
});

describe('step completion is content-based', () => {
	it('shows no ticks on an empty brief', async () => {
		const store = await freshStore();
		store.createBrief();
		for (let s = 1; s <= store.totalSteps; s++) {
			expect(store.isStepComplete(s), `step ${s} must not claim completion`).toBe(false);
		}
	});

	it('marks a section step complete only once it has content', async () => {
		const store = await freshStore();
		store.createBrief();
		expect(store.isStepComplete(2)).toBe(false);
		store.setRaw('objectives', 'something');
		expect(store.isStepComplete(2)).toBe(true);
		store.setRaw('objectives', '   ');
		expect(store.isStepComplete(2), 'whitespace is not content').toBe(false);
	});
});

describe('findings survive a re-survey', () => {
	async function seeded() {
		const store = await freshStore();
		store.createBrief();
		store.setFindings([
			{ id: 'a', kind: 'contradiction', dimension: 'Timeline', title: 'Dates clash', detail: 'd', question: 'q', options: ['x'], status: 'open' },
			{ id: 'b', kind: 'missing', dimension: 'Specs', title: 'No printer', detail: 'd', question: 'q', options: ['x'], status: 'open' },
			{ id: 'c', kind: 'clear', dimension: 'Budget', title: 'Budget firm', detail: 'd', status: 'open' }
		] as never);
		return store;
	}

	it('keeps confirmed decisions and dismissals, and does not re-raise them', async () => {
		const store = await seeded();
		store.resolveFinding('a', 'Launch moves');
		store.dismissFinding('b');

		// A fresh survey re-raising the same two titles must not undo the user.
		store.setFindings([
			{ id: 'n1', kind: 'contradiction', dimension: 'Timeline', title: 'Dates clash', detail: 'again', question: 'q', options: ['x'], status: 'open' },
			{ id: 'n2', kind: 'missing', dimension: 'Specs', title: 'No printer', detail: 'again', question: 'q', options: ['x'], status: 'open' },
			{ id: 'n3', kind: 'why', dimension: 'Budget', title: 'Genuinely new', detail: 'new', question: 'q', options: ['x'], status: 'open' }
		] as never);

		const byId = Object.fromEntries(store.findings.map((f) => [f.id, f]));
		expect(byId.a?.status, 'confirmed decision kept').toBe('confirmed');
		expect(byId.b?.status, 'dismissal is as deliberate as a confirmation').toBe('dismissed');
		expect(store.findings.filter((f) => f.title === 'Dates clash')).toHaveLength(1);
		expect(byId.n3, 'genuinely new findings still arrive').toBeTruthy();
	});

	it('restores a dismissed finding cleanly', async () => {
		const store = await seeded();
		store.dismissFinding('b');
		expect(store.findings.find((f) => f.id === 'b')?.dismissedAt).toBeTruthy();

		store.reopenFinding('b');
		const f = store.findings.find((x) => x.id === 'b');
		expect(f?.status).toBe('open');
		expect(f?.dismissedAt, 'timestamp cleared so it does not look set-aside').toBeUndefined();
	});

	it('counts only open, non-clear findings as outstanding', async () => {
		const store = await seeded();
		expect(store.openFindings).toHaveLength(2);
		store.dismissFinding('a');
		expect(store.openFindings, 'dismissing removes it from the outstanding count').toHaveLength(1);
	});
});

describe('duplicate and import keep full fidelity', () => {
	it('duplicates every field a brief was built from', async () => {
		const store = await freshStore();
		const id = store.createBrief();
		store.updateMeta({ projectType: 'packaging', role: 'commissioning', projectName: 'Zorka' });
		store.setRaw('specs', 'PACKAGING text');

		const copyId = store.duplicateBrief(id);
		expect(copyId, 'duplicate must actually produce a brief').toBeTruthy();

		store.openBrief(copyId!);
		expect(store.meta.projectType).toBe('packaging');
		expect(store.meta.role).toBe('commissioning');
		expect(store.sections.specs.raw).toBe('PACKAGING text');
	});

	it('round-trips an exported brief without dropping decisions', async () => {
		const store = await freshStore();
		const id = store.createBrief();
		store.updateMeta({ projectType: 'campaign', role: 'delivering' });
		store.setRaw('channels', 'TikTok, 40 cut-downs');
		store.setFindings([
			{ id: 'a', kind: 'contradiction', dimension: 'T', title: 'X', detail: 'd', question: 'q', options: ['y'], status: 'open' }
		] as never);
		store.resolveFinding('a', 'Launch moves');

		const json = store.exportBriefJSON(id);
		const importedId = store.importBriefFromJSON(json);
		store.openBrief(importedId);

		expect(store.meta.projectType).toBe('campaign');
		expect(store.meta.role).toBe('delivering');
		expect(store.sections.channels.raw).toBe('TikTok, 40 cut-downs');
		expect(store.findings.find((f) => f.id === 'a')?.resolution, 'client decisions survive').toBe('Launch moves');
	});

	it('rejects a file that is not a brief', async () => {
		const store = await freshStore();
		expect(() => store.importBriefFromJSON('"just a string"')).toThrow();
		expect(() => store.importBriefFromJSON('{not json')).toThrow();
	});
});

describe('deleting', () => {
	it('removes only the targeted brief', async () => {
		const store = await freshStore();
		const a = store.createBrief();
		const b = store.createBrief();
		store.deleteBrief(a);
		expect(store.briefs[a]).toBeUndefined();
		expect(store.briefs[b], 'the other brief is untouched').toBeTruthy();
	});
});
