<script lang="ts">
	import { Check } from '@lucide/svelte';
	
	import { briefStore } from '$lib/stores/brief.svelte';

	let { current, onjump }: { current: number; onjump: (step: number) => void } = $props();

	let list = $state<HTMLOListElement | undefined>(undefined);
	/**
	 * Which edges have content hidden past them. Tracked rather than always-on:
	 * a fade with nothing behind it reads as a rendering bug, and fading the
	 * leading edge while already at the start hides step 1 for no reason.
	 */
	let fadeStart = $state(false);
	let fadeEnd = $state(false);

	function measure() {
		if (!list) return;
		const max = list.scrollWidth - list.clientWidth;
		fadeStart = list.scrollLeft > 1;
		fadeEnd = list.scrollLeft < max - 1;
	}

	/**
	 * With a long template on a 320px screen the row is wider than the viewport,
	 * so keep the current step in view rather than leaving someone scrolled away
	 * from where they actually are.
	 */
	$effect(() => {
		void current;
		const el = list?.querySelector<HTMLElement>('[aria-current="step"]');
		el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
		// Let the smooth scroll land before measuring which edges are clipped.
		const t = setTimeout(measure, 400);
		measure();
		return () => clearTimeout(t);
	});
</script>

<nav class="w-full" aria-label="Progress">
	<!--
		Scrolls rather than compresses. Eight steps across 320px would squeeze each
		cell to 36px wide, under the 44px target from Apple's HIG and WCAG 2.5.5 —
		a row you cannot reliably hit is worse than one you have to nudge sideways.
	-->
	<ol
		bind:this={list}
		class="flex items-start overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		class:fade-start={fadeStart}
		class:fade-end={fadeEnd}
		onscroll={measure}
	>
		{#each briefStore.stepLabels as label, i}
			{@const step = i + 1}
			{@const done = briefStore.isStepComplete(step)}
			{@const active = step === current}
			<li class="flex min-w-11 flex-1 shrink-0 flex-col items-center">
				<!--
					The tap target is the whole 44px-tall cell, not the 28px dot inside it.
					Seven 28px circles in a row is well under the 44px minimum and is
					genuinely hard to hit on a phone.
				-->
				<button
					type="button"
					onclick={() => onjump(step)}
					aria-current={active ? 'step' : undefined}
					aria-label="{label}{done ? ' (completed)' : ''}"
					class="group relative flex h-11 w-full cursor-pointer items-center justify-center"
				>
					<!-- connectors sit behind the dot, spanning the full cell -->
					<span
						class="absolute top-1/2 left-0 h-px w-1/2 -translate-y-1/2 transition-colors duration-500 {i ===
						0
							? 'opacity-0'
							: done || active
								? 'bg-accent'
								: 'bg-border-strong'}"
					></span>
					<span
						class="absolute top-1/2 right-0 h-px w-1/2 -translate-y-1/2 transition-colors duration-500 {i ===
						briefStore.stepLabels.length - 1
							? 'opacity-0'
							: done
								? 'bg-accent'
								: 'bg-border-strong'}"
					></span>

					<span
						class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold transition-all duration-300
							{active
							? 'bg-accent text-on-accent'
							: done
								? 'bg-ink text-background group-hover:scale-110'
								: 'border border-border-strong bg-surface text-ink-faint'}"
					>
						{#if active}
							<span
								class="absolute inset-0 animate-ping rounded-full bg-accent opacity-20"
								style="animation-duration: 2.4s"
							></span>
						{/if}
						{#if done}
							<Check size={13} strokeWidth={2.75} />
						{:else}
							{step}
						{/if}
					</span>
				</button>

				<span
					class="mt-1 hidden truncate px-1 text-[0.66rem] font-medium tracking-wide uppercase transition-colors sm:block
						{active ? 'text-accent' : done ? 'text-ink-soft' : 'text-ink-faint'}"
				>
					{label}
				</span>
			</li>
		{/each}
	</ol>

	<!-- Narrow screens carry numbers only, so name the current step beneath. -->
	<p class="mt-1 text-center text-[0.72rem] font-medium tracking-wide text-accent uppercase sm:hidden">
		{briefStore.stepLabels[current - 1]}
	</p>
</nav>

<style>
	/* Fades whichever edge has hidden content, so a clipped step reads as "more
	   this way" rather than as a cut-off element. Masked rather than overlaid, so
	   it works on any ground and in both themes. */
	.fade-end {
		mask-image: linear-gradient(to right, #000 calc(100% - 2rem), transparent 100%);
	}
	.fade-start {
		mask-image: linear-gradient(to right, transparent 0, #000 2rem);
	}
	.fade-start.fade-end {
		mask-image: linear-gradient(
			to right,
			transparent 0,
			#000 2rem,
			#000 calc(100% - 2rem),
			transparent 100%
		);
	}
</style>
