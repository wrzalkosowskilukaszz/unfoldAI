<script lang="ts">
	import RefineField from '$lib/components/RefineField.svelte';
	import { SECTION_LABELS, SECTION_PLACEHOLDERS } from '$lib/types';
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Context & Objectives</h2>
		<p class="mt-1 text-sm text-ink-soft">
			What's the background, and what does this project need to achieve?
		</p>
	</div>

	<RefineField
		sectionKey="objectives"
		label={SECTION_LABELS.objectives}
		placeholder={SECTION_PLACEHOLDERS.objectives}
	/>
</div>
