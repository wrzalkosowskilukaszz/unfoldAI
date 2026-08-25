<script lang="ts">
	import { Plus, Upload, PenLine, ScanSearch, FileCheck } from '@lucide/svelte';

	let { onstart, onimport }: { onstart: () => void; onimport: () => void } = $props();

	/**
	 * The one thing a first-time user cannot see anywhere else: that this is not
	 * a form. Three lines, not a marketing page — enough to set the expectation
	 * that the tool will interrogate the brief, then get out of the way.
	 */
	const HOW = [
		{
			icon: PenLine,
			title: 'Dump what you have',
			body: 'Messy notes are fine. Stuck on a section? The AI interviews you one question at a time.'
		},
		{
			icon: ScanSearch,
			title: 'It finds what you missed',
			body: 'Reads the whole project and flags contradictions, vague statements and what it had to assume.'
		},
		{
			icon: FileCheck,
			title: 'Leave with both',
			body: 'A brief your team can act on — and an honest list of what nobody has settled yet.'
		}
	];
</script>

<section class="space-y-10">
	<div class="space-y-5">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">Start your first brief</h2>
			<!-- max-w-xl, not max-w-md: the sentence fits one line on desktop instead
			     of orphaning its last word onto a second. -->
			<p class="mt-1 max-w-xl text-sm text-ink-soft">
				Nothing here yet. Begin from scratch, or bring a brief you've already written.
			</p>
		</div>

		<div class="flex flex-wrap gap-2.5">
			<button
				type="button"
				onclick={onstart}
				class="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 active:scale-[0.98]"
			>
				<Plus size={17} />
				New brief
			</button>
			<button
				type="button"
				onclick={onimport}
				class="flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
			>
				<Upload size={16} class="text-accent" />
				I already have one
			</button>
		</div>
	</div>

	<div class="grid gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-3">
		{#each HOW as item, i}
			<div class="rise" style="animation-delay: {i * 70}ms">
				<div class="flex items-center gap-2.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent"
					>
						<item.icon size={15} />
					</span>
					<h3 class="font-display text-sm font-semibold text-ink">{item.title}</h3>
				</div>
				<!-- Indented to the title's text edge (icon 28px + 10px gap), so the
				     body reads as one column rather than stepping back under the icon. -->
				<p class="mt-2 pl-[2.375rem] text-sm leading-relaxed text-ink-soft">{item.body}</p>
			</div>
		{/each}
	</div>
</section>
