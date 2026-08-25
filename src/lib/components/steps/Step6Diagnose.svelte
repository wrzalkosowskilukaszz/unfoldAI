<script lang="ts">
	import { ScanSearch, Loader2, AlertTriangle, RefreshCw, Sparkles } from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import FindingCard from '$lib/components/FindingCard.svelte';
	import SpectralOrb from '$lib/components/SpectralOrb.svelte';
	import { SECTION_ORDER, type Finding } from '$lib/types';

	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errorMsg = $state<string | null>(null);

	// A full-project review takes ~40s. Narrate it so the wait reads as work, not a hang.
	const PROGRESS_NOTES = [
		'Reading every section as one project...',
		'Comparing your sections against each other...',
		'Looking for things that contradict...',
		'Checking what has been left undefined...',
		'Working out what I had to assume...',
		'Writing up what I found...'
	];
	let noteIndex = $state(0);
	let noteTimer: ReturnType<typeof setInterval> | undefined;

	function startNotes() {
		noteIndex = 0;
		clearInterval(noteTimer);
		noteTimer = setInterval(() => {
			if (noteIndex < PROGRESS_NOTES.length - 1) noteIndex += 1;
		}, 7000);
	}

	function stopNotes() {
		clearInterval(noteTimer);
	}

	// Navigating away mid-review would otherwise leave the interval running.
	$effect(() => () => clearInterval(noteTimer));

	let findings = $derived(briefStore.findings);
	let hasReviewed = $derived(briefStore.reviewedAt !== null && findings.length > 0);

	let open = $derived(findings.filter((f) => f.status === 'open'));
	let locked = $derived(findings.filter((f) => f.status === 'confirmed'));

	// Most consequential first; strengths last so the panel doesn't open with praise.
	const ORDER = ['contradiction', 'why', 'assumption', 'missing', 'attention', 'clear'];
	let sortedOpen = $derived(
		[...open].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
	);

	let counts = $derived({
		clear: findings.filter((f) => f.kind === 'clear').length,
		needsAttention: open.filter((f) => f.kind !== 'clear').length,
		locked: locked.length
	});

	let hasContent = $derived(SECTION_ORDER.some((k) => briefStore.sections[k].raw.trim()));

	async function runReview() {
		status = 'loading';
		errorMsg = null;
		startNotes();
		try {
			const sections: Record<string, string> = {};
			for (const key of SECTION_ORDER) sections[key] = briefStore.sections[key].raw;

			const res = await fetch('/api/review-brief', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					meta: briefStore.meta,
					sections,
					helpHistory: briefStore.helpHistory,
					decisions: briefStore.decisions.map((d) => ({
						dimension: d.dimension,
						title: d.title,
						resolution: d.resolution
					}))
				})
			});

			if (!res.ok) {
				let message = `Request failed (${res.status})`;
				try {
					const data = await res.json();
					if (data?.message) message = data.message;
				} catch {
					// non-JSON error body — keep the generic message
				}
				throw new Error(message);
			}

			const data = await res.json();
			briefStore.setFindings(data.findings as Finding[]);
			status = 'idle';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong.';
			status = 'error';
		} finally {
			stopNotes();
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">What's still unknown</h2>
			<p class="mt-1 text-sm text-ink-soft">
				Before you export, let's find what this brief hasn't settled yet.
			</p>
		</div>
		{#if hasReviewed}
			<button
				type="button"
				onclick={runReview}
				disabled={status === 'loading'}
				class="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md disabled:opacity-50"
			>
				{#if status === 'loading'}
					<Loader2 size={13} class="animate-spin" />
					Reviewing...
				{:else}
					<RefreshCw size={13} class="text-accent" />
					Review again
				{/if}
			</button>
		{/if}
	</div>

	{#if status === 'error' && errorMsg}
		<p class="flex items-center gap-1.5 text-xs text-contradiction">
			<AlertTriangle size={13} />
			{errorMsg}
		</p>
	{/if}

	{#if status === 'loading' && !hasReviewed}
		<div
			class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-alt/30 px-6 py-14 text-center"
		>
			<SpectralOrb size={128} chaos={0.72} strokeWidth={2} />
			{#key noteIndex}
				<p class="rise text-sm font-medium text-ink">{PROGRESS_NOTES[noteIndex]}</p>
			{/key}
			<p class="max-w-sm text-xs text-ink-soft">
				A proper review takes about a minute — it's reading everything together, not section by
				section.
			</p>
		</div>
	{:else if !hasReviewed}
		<div
			class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-surface-alt/30 px-6 py-12 text-center"
		>
			<span
				class="flex h-11 w-11 items-center justify-center rounded-full"
				style="background: var(--color-accent-wash)"
			>
				<ScanSearch size={20} class="text-accent" />
			</span>
			<div class="space-y-1">
				<p class="font-display text-base font-semibold text-ink">Review this brief</p>
				<p class="mx-auto max-w-md text-sm leading-relaxed text-ink-soft">
					I'll read every section as one project and tell you what's solid, what's too vague to act
					on, what contradicts itself, and what I had to assume to make sense of it.
				</p>
			</div>
			<button
				type="button"
				onclick={runReview}
				disabled={!hasContent || status === 'loading'}
				class="flex min-h-12 items-center gap-1.5 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Sparkles size={15} />
				Review my brief
			</button>
			{#if !hasContent}
				<p class="text-xs text-ink-faint">Fill in a few sections first.</p>
			{/if}
		</div>
	{:else}
		<!-- Counts, not a score: no invented denominator. -->
		<div
			class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-surface-alt/40 px-4 py-3 text-xs"
		>
			<span class="font-semibold text-ink">{findings.length} areas reviewed</span>
			<span class="flex items-center gap-1.5 text-ink-soft">
				<span class="h-1.5 w-1.5 rounded-full" style="background: var(--color-clear)"></span>
				{counts.clear} clear
			</span>
			<span class="flex items-center gap-1.5 text-ink-soft">
				<span class="h-1.5 w-1.5 rounded-full" style="background: var(--color-attention)"></span>
				{counts.needsAttention} to resolve
			</span>
			<span class="flex items-center gap-1.5 text-ink-soft">
				<span class="h-1.5 w-1.5 rounded-full" style="background: var(--color-accent)"></span>
				{counts.locked} locked
			</span>
		</div>

		{#if sortedOpen.length > 0}
			<div class="space-y-3">
				{#each sortedOpen as finding, i (finding.id)}
					<FindingCard {finding} index={i} />
				{/each}
			</div>
		{/if}

		{#if locked.length > 0}
			<div class="space-y-3">
				<h3 class="text-[0.72rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">
					Locked decisions
				</h3>
				{#each locked as finding, i (finding.id)}
					<FindingCard {finding} index={i} />
				{/each}
			</div>
		{/if}

		{#if sortedOpen.length === 0 && locked.length > 0}
			<p class="text-center text-sm text-clear">
				Everything raised has been settled. This brief is ready to export.
			</p>
		{/if}
	{/if}
</div>
