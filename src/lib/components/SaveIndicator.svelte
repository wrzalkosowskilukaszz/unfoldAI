<script lang="ts">
	import { Check, CloudOff, HardDriveDownload } from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';

	/**
	 * Everything is stored on this device only, which people reasonably distrust
	 * until something tells them otherwise. The write itself is synchronous, so
	 * there is no "saving" moment worth showing — the useful signal is proof it
	 * happened, and a loud, persistent warning if it ever didn't.
	 */
	let { compact = false }: { compact?: boolean } = $props();

	// Fades to a quieter resting state a few seconds after the last edit.
	let fresh = $state(false);
	$effect(() => {
		void briefStore.savedAt;
		if (briefStore.saveState !== 'saved') return;
		fresh = true;
		const t = setTimeout(() => (fresh = false), 2600);
		return () => clearTimeout(t);
	});
</script>

{#if briefStore.saveState !== 'error' && briefStore.activeNeedsBackup && !fresh}
	<!--
		Saved is not the same as safe here: everything lives in one localStorage
		key, so a cleared browser is permanent loss. Stated once, quietly, rather
		than as a banner — it is a standing fact, not an alarm.
	-->
	<p class="flex items-center gap-1.5 text-[0.72rem] font-medium text-ink-faint">
		<HardDriveDownload size={12} />
		Saved here only — <span class="text-ink-soft">not exported yet</span>
	</p>
{:else if briefStore.saveState === 'error'}
	<p
		role="alert"
		class="flex items-center gap-1.5 text-[0.72rem] font-medium text-contradiction"
	>
		<CloudOff size={12} />
		{compact ? 'Not saved' : "Couldn't save — copy your work out"}
	</p>
{:else if briefStore.saveState === 'saved'}
	<p
		class="flex items-center gap-1.5 text-[0.72rem] font-medium transition-colors duration-700
			{fresh ? 'text-clear' : 'text-ink-faint'}"
	>
		<Check size={12} />
		{fresh ? 'Saved' : 'Saved on this device'}
	</p>
{/if}
