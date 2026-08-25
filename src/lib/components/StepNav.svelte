<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { STEP_LABELS } from '$lib/types';
	import { briefStore } from '$lib/stores/brief.svelte';

	let { current, onjump }: { current: number; onjump: (step: number) => void } = $props();
</script>

<nav aria-label="Progress">
	<ol class="space-y-0.5">
		{#each STEP_LABELS as label, i}
			{@const step = i + 1}
			{@const done = briefStore.isStepComplete(step)}
			{@const active = step === current}
			<li>
				<button
					type="button"
					onclick={() => onjump(step)}
					aria-current={active ? 'step' : undefined}
					class="group flex w-full items-center gap-3 rounded-lg py-2 pr-2 pl-2.5 text-left transition-colors
						{active ? 'bg-ink/[0.045]' : 'hover:bg-ink/[0.025]'}"
				>
					<span
						class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[0.66rem] font-semibold transition-colors
							{active
							? 'bg-accent text-on-accent'
							: done
								? 'bg-ink text-background'
								: 'border border-border-strong text-ink-faint'}"
					>
						{#if done}
							<Check size={12} strokeWidth={3} />
						{:else}
							{step}
						{/if}
					</span>
					<span
						class="truncate text-[0.82rem] font-medium transition-colors
							{active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-faint'}"
					>
						{label}
					</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>
