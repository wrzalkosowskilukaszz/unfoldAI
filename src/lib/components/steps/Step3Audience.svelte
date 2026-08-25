<script lang="ts">
	import RefineField from '$lib/components/RefineField.svelte';
	import { SECTION_LABELS, SECTION_PLACEHOLDERS } from '$lib/types';
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Target Audience & Key Message</h2>
		<p class="mt-1 text-sm text-ink-soft">
			Who is this for, and what's the one thing they need to walk away knowing?
		</p>
	</div>

	<RefineField
		sectionKey="audience"
		label={SECTION_LABELS.audience}
		placeholder={SECTION_PLACEHOLDERS.audience}
	/>
</div>
