<script lang="ts">
	import { briefStore } from '$lib/stores/brief.svelte';

	/**
	 * The one piece of data a Surveyvor brief has that no other brief does: what
	 * the survey found, and what was done about it. Rendered as a proportion bar
	 * plus counts rather than a chart, because four integers do not need axes —
	 * and because a bar someone can read in a printed PDF at a glance is worth
	 * more than a graph they have to decode.
	 *
	 * Deliberately shows "set aside" alongside "settled": hiding the findings the
	 * team chose to dismiss would make the summary a sales pitch rather than a
	 * record.
	 */
	let findings = $derived(briefStore.findings);

	let counts = $derived({
		markers: findings.filter((f) => f.kind === 'clear').length,
		settled: findings.filter((f) => f.status === 'confirmed').length,
		setAside: findings.filter((f) => f.status === 'dismissed').length,
		open: findings.filter((f) => f.status === 'open' && f.kind !== 'clear').length
	});

	let total = $derived(counts.markers + counts.settled + counts.setAside + counts.open);

	let segments = $derived(
		[
			{ key: 'markers', label: 'Established', n: counts.markers, color: 'var(--c-clear)' },
			{ key: 'settled', label: 'Settled', n: counts.settled, color: 'var(--c-accent)' },
			{ key: 'setAside', label: 'Set aside', n: counts.setAside, color: 'var(--c-unknown)' },
			{ key: 'open', label: 'Still open', n: counts.open, color: 'var(--c-attention)' }
		].filter((s) => s.n > 0)
	);

	let surveyedOn = $derived(
		briefStore.reviewedAt
			? new Date(briefStore.reviewedAt).toLocaleDateString(undefined, {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: null
	);
</script>

{#if surveyedOn && total > 0}
	<section class="survey-summary" aria-label="Survey summary">
		<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
			<h2 class="text-[0.66rem] font-semibold tracking-[0.18em] text-ink-faint uppercase">
				Survey summary
			</h2>
			<p class="text-[0.72rem] text-ink-faint">
				{total} area{total === 1 ? '' : 's'} examined · {surveyedOn}
			</p>
		</div>

		<!-- Proportion, not a chart: the widths are the data. -->
		<div class="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-alt" role="img"
			aria-label={segments.map((s) => `${s.n} ${s.label}`).join(', ')}>
			{#each segments as s}
				<div style="width: {(s.n / total) * 100}%; background: {s.color}"></div>
			{/each}
		</div>

		<dl class="mt-3.5 flex flex-wrap gap-x-7 gap-y-2">
			{#each segments as s}
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 shrink-0 rounded-full" style="background: {s.color}"></span>
					<dt class="text-xs text-ink-soft">{s.label}</dt>
					<dd class="text-xs font-semibold text-ink tabular-nums">{s.n}</dd>
				</div>
			{/each}
		</dl>

		{#if counts.open > 0}
			<p class="mt-3 text-xs leading-relaxed text-ink-soft">
				<span class="font-semibold text-attention">{counts.open} still open.</span>
				These are listed at the end of this document — they were raised during the survey and have
				not been settled.
			</p>
		{/if}
	</section>
{/if}

<style>
	.survey-summary {
		border: 1px solid var(--c-border);
		border-radius: 1rem;
		background: var(--c-surface-alt);
		padding: 1.1rem 1.25rem;
	}
	/* Printed briefs get sent to clients — keep the band, drop the fill. */
	@media print {
		.survey-summary {
			background: transparent;
			border-color: #ddd;
			break-inside: avoid;
		}
	}
</style>
