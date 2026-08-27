<script lang="ts">
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	// Cookieless, no personal data. Disabled in dev so local clicks never
	// pollute the numbers.
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	import './layout.css';

	let { children } = $props();
</script>

{@render children()}
