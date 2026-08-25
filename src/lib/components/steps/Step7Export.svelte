<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import {
		Copy,
		Printer,
		Check,
		AlertTriangle,
		Wand2,
		Loader2,
		Lock,
		ScanSearch
	} from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { compileBriefBody, compileBriefMarkdown } from '$lib/markdown';
	import { SECTION_LABELS } from '$lib/types';

	let copied = $state(false);
	let copyError = $state(false);

	let polishState = $state<'idle' | 'loading' | 'error'>('idle');
	let polishError = $state<string | null>(null);

	// Persisted on the brief, so leaving the step doesn't throw away a paid-for rewrite.
	let polishedMarkdown = $derived(briefStore.polishedBrief);
	let view = $state<'structured' | 'polished'>('structured');

	let decisions = $derived(briefStore.decisions);

	/** Include the unresolved items in the exported document. On by default —
	 *  it is the most useful thing this tool produces. */
	let includeOpen = $state(true);

	let openItems = $derived({
		unresolved: briefStore.openFindings,
		empty: briefStore.emptySections
	});
	let hasOpenItems = $derived(
		openItems.unresolved.length > 0 || openItems.empty.length > 0
	);
	let neverReviewed = $derived(briefStore.reviewedAt === null);

	let structuredBody = $derived(
		compileBriefBody(briefStore.sections, decisions, includeOpen ? openItems : undefined)
	);
	let bodyMarkdown = $derived(
		view === 'polished' && polishedMarkdown ? polishedMarkdown : structuredBody
	);
	let renderedHtml = $derived(DOMPurify.sanitize(marked.parse(bodyMarkdown, { async: false })));

	/** Clipboard and print always get the whole document, header included. */
	let fullMarkdown = $derived(
		view === 'polished' && polishedMarkdown
			? `# ${briefStore.meta.projectName || 'Untitled Project'}\n\n${polishedMarkdown}`
			: compileBriefMarkdown(
					briefStore.meta,
					briefStore.sections,
					decisions,
					includeOpen ? openItems : undefined
				)
	);

	let metaRows = $derived(
		[
			{ label: 'Client', value: briefStore.meta.clientName.trim() },
			{ label: 'Prepared', value: briefStore.meta.briefDate },
			{ label: 'Launch', value: briefStore.meta.launchDate }
		].filter((r) => r.value)
	);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(fullMarkdown);
			copied = true;
			copyError = false;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copyError = true;
			setTimeout(() => (copyError = false), 2500);
		}
	}

	function printBrief() {
		window.print();
	}

	async function polishBrief() {
		polishState = 'loading';
		polishError = null;
		try {
			const res = await fetch('/api/compile-brief', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					meta: briefStore.meta,
					sections: {
						objectives: briefStore.sections.objectives.raw,
						audience: briefStore.sections.audience.raw,
						deliverables: briefStore.sections.deliverables.raw,
						constraints: briefStore.sections.constraints.raw
					},
					decisions: decisions.map((d) => ({
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
			briefStore.setPolishedBrief(data.polished);
			view = 'polished';
			polishState = 'idle';
		} catch (err) {
			polishError = err instanceof Error ? err.message : 'Something went wrong.';
			polishState = 'error';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4 print:hidden">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">Export</h2>
			<p class="mt-1 text-sm text-ink-soft">The finished brief, ready to send.</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			{#if polishedMarkdown}
				<!-- Segmented control: two versions of the same document, one tap apart. -->
				<div class="flex rounded-full border border-border bg-surface-alt/60 p-0.5">
					<button
						type="button"
						onclick={() => (view = 'structured')}
						class="min-h-10 rounded-full px-3.5 text-xs font-semibold transition {view === 'structured'
							? 'bg-surface text-ink shadow-sm'
							: 'text-ink-soft hover:text-ink'}"
					>
						Structured
					</button>
					<button
						type="button"
						onclick={() => (view = 'polished')}
						class="min-h-10 rounded-full px-3.5 text-xs font-semibold transition {view === 'polished'
							? 'bg-surface text-ink shadow-sm'
							: 'text-ink-soft hover:text-ink'}"
					>
						Narrative
					</button>
				</div>
			{:else}
				<button
					type="button"
					onclick={polishBrief}
					disabled={polishState === 'loading'}
					class="flex items-center gap-1.5 min-h-11 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-ink shadow-sm lg:min-h-0 lg:py-2 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md disabled:opacity-60"
				>
					{#if polishState === 'loading'}
						<Loader2 size={14} class="animate-spin" />
						Rewriting...
					{:else}
						<Wand2 size={14} class="text-accent" />
						Rewrite as narrative
					{/if}
				</button>
			{/if}

			<button
				type="button"
				onclick={copyToClipboard}
				class="flex items-center gap-1.5 min-h-11 rounded-full border border-border bg-surface px-4 text-xs font-medium text-ink-soft lg:min-h-0 lg:py-2 transition hover:bg-surface-hover"
			>
				{#if copied}
					<Check size={14} class="text-clear" />
					Copied
				{:else if copyError}
					<AlertTriangle size={14} class="text-contradiction" />
					Select & copy manually
				{:else}
					<Copy size={14} />
					Copy
				{/if}
			</button>

			<button
				type="button"
				onclick={printBrief}
				class="flex items-center gap-1.5 min-h-11 rounded-full bg-ink px-4 text-xs font-semibold text-background lg:min-h-0 lg:py-2 transition hover:-translate-y-0.5"
			>
				<Printer size={14} />
				Save as PDF
			</button>
		</div>
	</div>

	{#if polishState === 'error' && polishError}
		<p class="flex items-center gap-1.5 text-xs text-contradiction print:hidden">
			<AlertTriangle size={14} />
			{polishError}
		</p>
	{/if}

	<!--
		The tool's whole value is what the brief has NOT settled. Showing that here,
		before the document, is the last chance to catch it — and it ships inside
		the export by default so the team reading it sees it too.
	-->
	{#if neverReviewed}
		<div
			class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-alt/40 px-4 py-3 print:hidden"
		>
			<ScanSearch size={17} class="shrink-0 text-accent" />
			<p class="min-w-0 flex-1 text-sm text-ink-soft">
				This brief hasn't been reviewed yet — you may be exporting gaps you can't see.
			</p>
			<button
				type="button"
				onclick={() => briefStore.goToStep(6)}
				class="min-h-11 shrink-0 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-ink lg:min-h-0 lg:py-2"
			>
				Review it first
			</button>
		</div>
	{:else if hasOpenItems}
		<section
			class="rounded-xl border border-border bg-surface-alt/40 px-4 py-3.5 print:hidden"
			style="border-left: 3px solid var(--c-attention)"
		>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h3 class="flex items-center gap-2 text-sm font-semibold text-ink">
					<AlertTriangle size={15} class="text-attention" />
					Still open
				</h3>

				<label class="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
					<input type="checkbox" bind:checked={includeOpen} class="accent-accent" />
					Include in the exported brief
				</label>
			</div>

			<ul class="mt-3 space-y-1.5">
				{#each openItems.unresolved as f}
					<li class="flex gap-2 text-sm text-ink-soft">
						<span class="text-attention">•</span>
						<span><span class="font-medium text-ink">{f.dimension}</span> — {f.title}</span>
					</li>
				{/each}
				{#if openItems.empty.length > 0}
					<li class="flex gap-2 text-sm text-ink-soft">
						<span class="text-attention">•</span>
						<span>
							<span class="font-medium text-ink">Nothing written yet</span> in
							{openItems.empty.map((k) => SECTION_LABELS[k]).join(', ')}
						</span>
					</li>
				{/if}
			</ul>

			{#if openItems.unresolved.length > 0}
				<button
					type="button"
					onclick={() => briefStore.goToStep(6)}
					class="mt-3 text-xs font-semibold text-accent hover:underline"
				>
					Go back and settle these →
				</button>
			{/if}
		</section>
	{:else}
		<p class="flex items-center gap-2 text-sm text-clear print:hidden">
			<Check size={15} />
			Everything raised in review has been settled.
		</p>
	{/if}

	<!-- The document itself: a sheet, not a text box. -->
	<article
		id="printable-brief"
		class="overflow-hidden rounded-2xl border border-border bg-surface elevated"
	>
		<header class="border-b border-border px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-7 lg:px-12">
			<p class="text-[0.66rem] font-semibold tracking-[0.2em] text-accent uppercase">
				Creative Brief
			</p>
			<h1 class="mt-3 font-display text-3xl leading-[1.1] font-semibold tracking-[-0.02em] text-ink">
				{briefStore.meta.projectName.trim() || 'Untitled Project'}
			</h1>

			{#if metaRows.length > 0}
				<dl class="mt-6 flex flex-wrap gap-x-10 gap-y-3">
					{#each metaRows as row}
						<div>
							<dt class="text-[0.66rem] font-medium tracking-[0.14em] text-ink-faint uppercase">
								{row.label}
							</dt>
							<dd class="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
						</div>
					{/each}
				</dl>
			{/if}

			{#if decisions.length > 0}
				<div
					class="mt-6 flex w-fit items-center gap-2 rounded-full bg-clear-wash px-3 py-1.5 text-xs font-medium text-clear"
				>
					<Lock size={12} />
					{decisions.length}
					{decisions.length === 1 ? 'decision' : 'decisions'} confirmed with the client
				</div>
			{/if}
		</header>

		<div class="px-5 py-7 sm:px-8 sm:py-9 lg:px-12">
			<div class="prose-brief prose max-w-none">
				{@html renderedHtml}
			</div>
		</div>
	</article>
</div>
