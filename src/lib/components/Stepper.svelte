<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { STEP_LABELS } from '$lib/types';
	import { briefStore } from '$lib/stores/brief.svelte';

	let { current, onjump }: { current: number; onjump: (step: number) => void } = $props();
</script>

<nav class="w-full" aria-label="Progress">
	<ol class="flex items-start">
		{#each STEP_LABELS as label, i}
			{@const step = i + 1}
			{@const done = briefStore.isStepComplete(step)}
			{@const active = step === current}
			<li class="flex min-w-0 flex-1 flex-col items-center">
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
						STEP_LABELS.length - 1
							? 'opacity-0'
							: done
								? 'bg-accent'
								: 'bg-border-strong'}"
					></span>

					<span
						class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold transition-all duration-300
							{done ? 'bg-ink text-background group-hover:scale-110' : ''}
							{active ? 'bg-accent text-on-accent' : ''}
							{!done && !active ? 'border border-border-strong bg-surface text-ink-faint' : ''}"
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
		{STEP_LABELS[current - 1]}
	</p>
</nav>
