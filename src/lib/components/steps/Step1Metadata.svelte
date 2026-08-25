<script lang="ts">
	import { briefStore } from '$lib/stores/brief.svelte';
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Project Metadata & Basics</h2>
		<p class="mt-1 text-sm text-ink-soft">Set the fundamentals before diving into the brief.</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<label for="project-name" class="text-sm font-medium text-ink">Project Name</label>
			<input
				id="project-name"
				type="text"
				value={briefStore.meta.projectName}
				oninput={(e) => briefStore.updateMeta({ projectName: e.currentTarget.value })}
				placeholder="e.g. Q1 Homepage Refresh"
				class="w-full rounded-xl border border-border bg-surface-alt/60 p-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-accent"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="client-name" class="text-sm font-medium text-ink">Client / Brand</label>
			<input
				id="client-name"
				type="text"
				value={briefStore.meta.clientName}
				oninput={(e) => briefStore.updateMeta({ clientName: e.currentTarget.value })}
				placeholder="e.g. Acme Corp"
				class="w-full rounded-xl border border-border bg-surface-alt/60 p-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-accent"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="brief-date" class="text-sm font-medium text-ink">Date</label>
			<input
				id="brief-date"
				type="date"
				value={briefStore.meta.briefDate}
				oninput={(e) => briefStore.updateMeta({ briefDate: e.currentTarget.value })}
				class="w-full rounded-xl border border-border bg-surface-alt/60 p-2.5 text-sm text-ink outline-none focus:border-accent"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="launch-date" class="text-sm font-medium text-ink">Target Launch Date</label>
			<input
				id="launch-date"
				type="date"
				value={briefStore.meta.launchDate}
				oninput={(e) => briefStore.updateMeta({ launchDate: e.currentTarget.value })}
				class="w-full rounded-xl border border-border bg-surface-alt/60 p-2.5 text-sm text-ink outline-none focus:border-accent"
			/>
		</div>
	</div>
</div>
