<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
</script>

<svelte:head>
	<title>Something went wrong · Surveyvor</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
	<Logo />

	<h1 class="mt-10 font-display text-2xl font-semibold tracking-tight text-ink">
		{page.status === 404 ? "That page doesn't exist" : 'Something went wrong'}
	</h1>

	<p class="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
		{page.status === 404
			? 'The link may be out of date.'
			: (page.error?.message ?? 'An unexpected error occurred.')}
	</p>

	<p class="mt-6 max-w-sm text-xs text-ink-faint">
		Your briefs are saved in this browser and are not affected.
	</p>

	<a
		href="/"
		class="mt-7 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
	>
		Back to my briefs
	</a>
</div>
