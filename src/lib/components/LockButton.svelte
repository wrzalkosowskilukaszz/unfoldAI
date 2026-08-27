<script lang="ts">
	import { Lock } from '@lucide/svelte';

	/**
	 * Re-locks this browser. A shared password with no way out meant a borrowed
	 * or公 machine stayed open for the full thirty-day cookie life.
	 */
	let { compact = false }: { compact?: boolean } = $props();
</script>

<form method="POST" action="/unlock?/lock" class="contents">
	<button
		type="submit"
		title="Lock this browser"
		aria-label="Lock this browser"
		class="flex items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-hover hover:text-accent {compact
			? 'h-11 w-11'
			: 'h-11 w-11 lg:h-8 lg:w-8'}"
	>
		<Lock size={compact ? 17 : 14} />
	</button>
</form>
