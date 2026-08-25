<script lang="ts">
	import RefineField from '$lib/components/RefineField.svelte';
	import { SECTION_LABELS, SECTION_PLACEHOLDERS } from '$lib/types';
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Aesthetics, Tone & Deliverables</h2>
		<p class="mt-1 text-sm text-ink-soft">
			Look and feel, tone of voice, references, and exactly what needs to be produced.
		</p>
	</div>

	<RefineField
		sectionKey="deliverables"
		label={SECTION_LABELS.deliverables}
		placeholder={SECTION_PLACEHOLDERS.deliverables}
	/>
</div>
