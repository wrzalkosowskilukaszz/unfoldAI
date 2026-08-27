<script lang="ts">
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	// Cookieless, no personal data. Disabled in dev so local clicks never
	// pollute the numbers.
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
