<script lang="ts">
	import { BLADE, BLADE_FILL, DISC, DISC_FILL, LETTERS, LOCKUP_RATIO, LOCKUP_VIEWBOX } from '$lib/logo-paths';

	/**
	 * The lockup, and the way home. Signet colours are fixed because a mark
	 * should not shift with the UI theme; the wordmark takes the ink token so it
	 * reads on both grounds. `size` is the signet height in px.
	 *
	 * `data-logo-home` is what the intro animation flies into and hides until
	 * the handoff — see Intro.svelte.
	 */
	let { size = 32 }: { size?: number } = $props();
</script>

<a
	href="/"
	aria-label="Surveyvor — back to your briefs"
	data-logo-home
	class="flex min-h-11 shrink-0 items-center rounded-md text-ink transition-opacity hover:opacity-80"
>
	<svg
		height={size}
		width={Math.round(size * LOCKUP_RATIO)}
		viewBox={LOCKUP_VIEWBOX}
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path fill={DISC_FILL} d={DISC} />
		<path fill={BLADE_FILL} d={BLADE} />
		<g fill="currentColor">
			{#each LETTERS as d}
				<path {d} />
			{/each}
		</g>
	</svg>
</a>
