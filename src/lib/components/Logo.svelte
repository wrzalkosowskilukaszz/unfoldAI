<script lang="ts">
	/*
	 * Measured against peers: Vercel 18-21px, Linear 22px, Stripe 25px lockups.
	 * We sit deliberately above that range because those are horizontal
	 * wordmark-dominant lockups, while ours is a disc — a circle carries less
	 * optical mass than its bounding box, so matching their pixel height reads
	 * noticeably smaller on the page.
	 */
	let { size = 30, showWordmark = true }: { size?: number; showWordmark?: boolean } = $props();
</script>

<div class="flex items-center gap-2.5">
	<!--
		Supplied brand signet, used as authored. Both colours are fixed rather than
		tokenised: a logo should not shift with the UI theme, and the pale disc is
		part of the mark, not a surface.
	-->
	<svg
		width={size}
		height={size}
		viewBox="0 0 260 260"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Surveyvor"
		class="shrink-0"
	>
		<rect x="0" y="0.8" width="260" height="258.4" rx="129.2" ry="129.2" fill="#efeeff" />
		<path fill="#7d6bff" d="M239.6,144.8c-2.7,20-13.7,39.7-29.3,55.4-15.6,15.7-35.7,27.3-56.8,31.3L.6,260l81.3-71.6,110-20.5,20.3-17.9-110,20.5h0s-15.6,2.9-15.6,2.9c-42.1,7.9-71.7-18.2-66.3-58.2s13.7-39.7,29.3-55.4c15.6-15.7,35.7-27.3,56.8-31.3L259.4,0l-81.3,71.6-109.9,20.5-20.3,17.9,125.5-23.4c42.1-7.9,71.7,18.2,66.3,58.2Z" />
	</svg>

	{#if showWordmark}
		<span class="font-display text-xl font-semibold tracking-[-0.02em] text-ink"> Surveyvor </span>
	{/if}
</div>
