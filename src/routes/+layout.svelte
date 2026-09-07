<script lang="ts">
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	// Cookieless, no personal data. Not injected at all in dev: the debug
	// build loads from a third-party host the CSP rightly blocks, and local
	// clicks should never reach the numbers anyway.
	if (!dev) injectAnalytics();

	import './layout.css';

	let { children } = $props();
</script>

{@render children()}
