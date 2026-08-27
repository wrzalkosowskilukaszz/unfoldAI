<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';

	let {
		title,
		updated,
		children
	}: { title: string; updated: string; children: import('svelte').Snippet } = $props();
</script>

<div class="min-h-screen">
	<div class="mx-auto max-w-2xl px-6 py-12 sm:py-16">
		<div class="flex items-center justify-between gap-4">
			<Logo />
			<a
				href="/"
				class="flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
			>
				<ChevronLeft size={13} />
				Back to Surveyvor
			</a>
		</div>

		<header class="mt-12 border-b border-border pb-6">
			<h1 class="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
			<p class="mt-2 text-sm text-ink-faint">Last updated {updated}</p>
		</header>

		<div class="legal mt-8">
			{@render children()}
		</div>

		<footer class="mt-16 border-t border-border pt-6 text-xs text-ink-faint">
			<p>
				Surveyvor is operated by <strong class="font-semibold text-ink-soft">Take a Luke Studio</strong>,
				Poland. Questions:
				<a href="mailto:hello@takealuke.studio" class="text-accent">hello@takealuke.studio</a>
			</p>
			<p class="mt-2 flex gap-4">
				<a href="/privacy" class="hover:text-accent">Privacy</a>
				<a href="/terms" class="hover:text-accent">Terms</a>
			</p>
		</footer>
	</div>
</div>

<style>
	.legal :global(h2) {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--c-ink);
		margin: 2.25rem 0 0.75rem;
	}
	.legal :global(h2:first-child) {
		margin-top: 0;
	}
	.legal :global(h3) {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--c-ink);
		margin: 1.5rem 0 0.4rem;
	}
	.legal :global(p) {
		font-size: 0.95rem;
		line-height: 1.7;
		color: var(--c-ink-soft);
		margin: 0 0 0.9rem;
	}
	/* Not flex: flex items lose their list markers, which turns a legal list
	   into loose sentences a reader cannot count. */
	.legal :global(ul) {
		margin: 0 0 1rem;
		padding-left: 1.15rem;
		list-style: disc;
	}
	.legal :global(li) {
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--c-ink-soft);
		margin-bottom: 0.45rem;
	}
	.legal :global(li::marker) {
		color: var(--c-accent);
	}
	.legal :global(strong) {
		color: var(--c-ink);
		font-weight: 600;
	}
	.legal :global(a) {
		color: var(--c-accent);
	}
	/* The plain-language summary that opens each document. */
	.legal :global(.summary) {
		background: var(--c-sand);
		border-radius: 1rem;
		padding: 1.25rem 1.4rem;
		margin-bottom: 2rem;
	}
	.legal :global(.summary p:last-child),
	.legal :global(.summary ul:last-child) {
		margin-bottom: 0;
	}
</style>
