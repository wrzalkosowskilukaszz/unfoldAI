<script lang="ts">
	import RefineField from '$lib/components/RefineField.svelte';
	import { SECTION_LABELS, SECTION_PLACEHOLDERS } from '$lib/types';
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Constraints & Mandatories</h2>
		<p class="mt-1 text-sm text-ink-soft">
			Budget, timeline, brand rules, legal or compliance requirements, and non-negotiables.
		</p>
	</div>

	<RefineField
		sectionKey="constraints"
		label={SECTION_LABELS.constraints}
		placeholder={SECTION_PLACEHOLDERS.constraints}
	/>
</div>
