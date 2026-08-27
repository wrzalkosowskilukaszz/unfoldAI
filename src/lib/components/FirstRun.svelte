<script lang="ts">
	import { Plus, Upload, PenLine, ScanSearch, FileCheck, Lock } from '@lucide/svelte';

	let { onstart, onimport }: { onstart: () => void; onimport: () => void } = $props();

	/**
	 * The one thing a first-time user cannot see anywhere else: that this is not
	 * a form. Three lines, not a marketing page — enough to set the expectation
	 * that the tool will interrogate the brief, then get out of the way.
	 */
	const HOW = [
		{
			icon: PenLine,
			title: 'Give it the mess',
			body: "Meeting notes, client emails, half-formed ideas. Surveyvor doesn't need a finished brief — that's the point."
		},
		{
			icon: ScanSearch,
			title: 'It surveys the terrain',
			body: "It marks what's established, what's assumed, what conflicts and what nobody has decided — instead of quietly filling the gaps."
		},
		{
			icon: FileCheck,
			title: 'Start on solid ground',
			body: 'Answer what matters, lock the decisions, and leave with a brief that is the output of alignment rather than the start of it.'
		}
	];
</script>

<section class="space-y-10">
	<div class="space-y-5">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">Survey your first project</h2>
			<!-- max-w-xl, not max-w-md: the sentence fits one line on desktop instead
			     of orphaning its last word onto a second. -->
			<p class="mt-1 max-w-xl text-sm text-ink-soft">
				Nothing here yet. Start from scratch, or bring the mess you've already got.
			</p>
		</div>

		<div class="flex flex-wrap gap-2.5">
			<button
				type="button"
				onclick={onstart}
				class="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 active:scale-[0.98]"
			>
				<Plus size={17} />
				Survey your project
			</button>
			<button
				type="button"
				onclick={onimport}
				class="flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
			>
				<Upload size={16} class="text-accent" />
				I have a brief already
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

	<!--
		Not a fourth step: the three above are a sequence, and privacy is a standing
		property of the tool rather than a stage in it. It gets its own quieter line.
	-->
	<div class="flex items-start gap-3 rounded-2xl bg-sand px-4 py-3.5 sm:items-center">
		<span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-accent sm:mt-0">
			<Lock size={14} />
		</span>
		<p class="text-sm leading-relaxed text-ink-soft">
			<span class="font-semibold text-ink">Your briefs stay on your device.</span>
			Nothing is uploaded to us and we keep no copy. Text goes to the AI only when you ask for it,
			and it is never used to train a model.
			<a href="/privacy" class="font-medium text-accent hover:underline">How this works</a>
		</p>
	</div>
</section>
