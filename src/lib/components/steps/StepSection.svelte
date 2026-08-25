<script lang="ts">
	import RefineField from '$lib/components/RefineField.svelte';
	import { SECTION_DEFS, type SectionKey } from '$lib/types';

	/**
	 * One component for every section step. Which section it shows comes from the
	 * brief's template, so adding a template-specific section is a data change in
	 * SECTION_DEFS rather than a new component.
	 */
	let { sectionKey }: { sectionKey: SectionKey } = $props();

	let def = $derived(SECTION_DEFS[sectionKey]);
</script>

{#if def}
	<div class="space-y-6">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">{def.heading}</h2>
			<p class="mt-1 text-sm text-ink-soft">{def.blurb}</p>
		</div>

		{#key sectionKey}
			<RefineField {sectionKey} label={def.heading} placeholder={def.placeholder} />
		{/key}
	</div>
{/if}
