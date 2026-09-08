<script lang="ts">
	import { Check, PencilLine, Lock, RotateCcw, ArrowRight, ArrowUpRight, X } from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { analytics } from '$lib/analytics';
	import { FINDING_META, SECTION_DEFS, type Finding } from '$lib/types';

	let {
		finding,
		index,
		onresolved
	}: { finding: Finding; index: number; onresolved?: (finding: Finding) => void } = $props();

	let meta = $derived(FINDING_META[finding.kind]);
	/** Where this finding's fix belongs, when it belongs somewhere specific. */
	let fixStep = $derived(briefStore.stepForSection(finding.section));
	let fixLabel = $derived(
		finding.section === 'basics' ? 'Basics' : (SECTION_DEFS[finding.section ?? '']?.label ?? null)
	);
	let customMode = $state(false);
	let customValue = $state('');

	/** Grows with the answer so long text stays visible instead of scrolling away. */
	function autoGrow(node: HTMLTextAreaElement) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};
		node.focus();
		resize();
		node.addEventListener('input', resize);
		return { destroy: () => node.removeEventListener('input', resize) };
	}

	function confirm(answer: string) {
		briefStore.resolveFinding(finding.id, answer);
		analytics.findingSettled('resolved', finding.kind);
		customMode = false;
		customValue = '';
		onresolved?.(finding);
	}

	function submitCustom() {
		if (!customValue.trim()) return;
		confirm(customValue.trim());
	}
</script>

<article
	class="rise relative overflow-hidden rounded-2xl border border-border bg-surface"
	style="animation-delay: {index * 45}ms"
>
	<!-- state-keyed hairline: the card's status is readable before a word is read -->
	<span class="absolute inset-y-0 left-0 w-[3px]" style="background: {meta.tone}"></span>

	<div class="space-y-3 py-4 pr-4 pl-5">
		<div class="flex flex-wrap items-center gap-2">
			<span
				class="rounded-full px-2 py-0.5 text-[0.66rem] font-semibold tracking-wide uppercase"
				style="color: {meta.tone}; background: {meta.wash}"
			>
				{meta.label}
			</span>
			<span class="text-[0.66rem] font-medium tracking-[0.12em] text-ink-faint uppercase">
				{finding.dimension}
			</span>
			{#if finding.status === 'confirmed'}
				<span class="ml-auto flex items-center gap-1 text-[0.66rem] font-semibold text-clear uppercase">
					<Lock size={10} />
					Locked
				</span>
			{:else if finding.status === 'dismissed'}
				<span class="ml-auto text-[0.66rem] font-semibold tracking-wide text-ink-faint uppercase">
					Set aside
				</span>
			{/if}
		</div>

		<div class="space-y-1">
			<h4 class="font-display text-base leading-snug font-semibold text-ink">{finding.title}</h4>
			<p class="text-sm leading-relaxed text-ink-soft">{finding.detail}</p>
			{#if finding.evidence && finding.evidence.length > 0}
				<!-- The words this rests on, verified against the brief before they got here. -->
				<p class="pt-1 text-xs leading-relaxed text-ink-faint">
					From the brief:
					{#each finding.evidence.slice(0, 2) as quote, i}
						{#if i > 0}<span aria-hidden="true"> · </span>{/if}<q class="text-ink-soft">{quote}</q>
					{/each}
				</p>
			{/if}
		</div>

		{#if finding.status === 'dismissed'}
			<div class="flex items-start justify-between gap-3 rounded-xl bg-surface-alt/70 px-3 py-2">
				{#if finding.retiredBy}
					<p class="text-sm text-ink-soft">
						<span class="font-medium text-ink">Settled by your answer on {finding.retiredBy}.</span>
						{#if finding.retiredReason}{finding.retiredReason}{/if}
					</p>
				{:else}
					<p class="text-sm text-ink-soft">Set aside — you decided this one doesn't apply.</p>
				{/if}
				<button
					type="button"
					onclick={() => briefStore.reopenFinding(finding.id)}
					class="flex shrink-0 items-center gap-1 text-[0.72rem] font-medium text-ink-faint transition hover:text-ink-soft"
				>
					<RotateCcw size={11} />
					Bring back
				</button>
			</div>
		{:else if finding.status === 'confirmed'}
			<div class="flex items-start justify-between gap-3 rounded-xl bg-clear-wash px-3 py-2">
				<p class="text-sm font-medium text-ink">
					<span class="text-clear">→</span>
					{finding.resolution}
				</p>
				<button
					type="button"
					onclick={() => briefStore.reopenFinding(finding.id)}
					class="flex shrink-0 items-center gap-1 text-[0.72rem] font-medium text-ink-faint transition hover:text-ink-soft"
				>
					<RotateCcw size={11} />
					Reopen
				</button>
			</div>
		{:else if meta.actionable && finding.question}
			<div class="space-y-2.5 border-t border-border pt-3">
				<p class="text-sm font-medium text-ink">{finding.question}</p>

				{#if customMode}
					<div class="space-y-2">
						<textarea
							bind:value={customValue}
							use:autoGrow
							rows="2"
							onkeydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									submitCustom();
								}
							}}
							placeholder="Answer in your own words — Enter to confirm, Shift+Enter for a new line"
							class="max-h-56 w-full resize-none overflow-y-auto rounded-lg border border-border bg-surface-alt/50 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-accent"
						></textarea>
						<div class="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onclick={submitCustom}
								disabled={!customValue.trim()}
								class="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
							>
								Confirm
								<ArrowRight size={13} />
							</button>
							<button
								type="button"
								onclick={() => (customMode = false)}
								class="text-[0.72rem] text-ink-faint hover:text-ink-soft"
							>
								Back to the suggestions
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap gap-1.5">
						{#each finding.options ?? [] as option}
							<button
								type="button"
								onclick={() => confirm(option)}
								class="rounded-full border border-border bg-surface-alt/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:-translate-y-px hover:border-accent hover:text-accent"
							>
								{option}
							</button>
						{/each}
						<button
							type="button"
							onclick={() => (customMode = true)}
							class="flex items-center gap-1 rounded-full border border-dashed border-accent/50 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent-wash"
						>
							<PencilLine size={11} />
							My own answer
						</button>
					</div>

					<!--
						The escape hatch. Without it the review is a verdict you cannot
						argue with, and a tool that only ever tells you what's wrong is
						one you stop opening.
					-->
					<div class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
						<button
							type="button"
							onclick={() => {
								briefStore.dismissFinding(finding.id);
								analytics.findingSettled('dismissed', finding.kind);
							}}
							class="flex items-center gap-1 text-[0.72rem] font-medium text-ink-faint transition hover:text-ink-soft"
						>
							<X size={11} />
							This doesn't apply
						</button>
						{#if fixStep !== null && fixLabel}
							<!-- The finding knows which section it belongs to; take them there. -->
							<button
								type="button"
								onclick={() => briefStore.goToStep(fixStep)}
								class="flex items-center gap-1 text-[0.72rem] font-medium text-accent transition hover:underline"
							>
								Fix it in {fixLabel}
								<ArrowUpRight size={11} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-1.5 text-xs font-medium text-clear">
				<Check size={13} />
				Nothing to resolve here
			</div>
		{/if}
	</div>
</article>
