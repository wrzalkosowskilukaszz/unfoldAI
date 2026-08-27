<script lang="ts">
	import { page } from '$app/state';

	/**
	 * One place for page metadata, so a new route cannot ship without a
	 * description or a social card. Absolute URLs are required by Open Graph —
	 * relative ones are silently ignored by most scrapers.
	 */
	let {
		title,
		description,
		/** Set false on pages that should never be indexed. */
		index = true
	}: { title: string; description: string; index?: boolean } = $props();

	const SITE = 'https://surveyvor.app';
	let canonical = $derived(SITE + page.url.pathname.replace(/\/$/, '') || SITE);
	let ogImage = `${SITE}/og-image.png`;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if !index}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Surveyvor" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Surveyvor — survey the project before you build it" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>
