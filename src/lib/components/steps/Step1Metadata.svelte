<script lang="ts">
	import { Briefcase, PenTool, Check } from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { analytics } from '$lib/analytics';
	import { ROLE_COPY, PROJECT_TYPES, type BriefRole, type ProjectType } from '$lib/types';

	/**
	 * The role question comes first because everything after it reads differently
	 * depending on the answer — most visibly the organisation field, which means
	 * "someone else's company" to a designer and "my own" to a client.
	 */
	let role = $derived(briefStore.meta.role);
	let copy = $derived(role ? ROLE_COPY[role] : null);

	const ROLES: { key: BriefRole; icon: typeof Briefcase }[] = [
		{ key: 'commissioning', icon: Briefcase },
		{ key: 'delivering', icon: PenTool }
	];

	const TYPE_KEYS = Object.keys(PROJECT_TYPES) as ProjectType[];
	let projectType = $derived(briefStore.meta.projectType);
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-display text-xl font-semibold text-ink">Project Metadata &amp; Basics</h2>
		<p class="mt-1 text-sm text-ink-soft">Set the fundamentals before diving into the brief.</p>
	</div>

	<fieldset class="space-y-2.5">
		<legend class="text-sm font-medium text-ink">Which side of this brief are you on?</legend>
		<p class="text-xs text-ink-faint">
			This changes the questions you'll be asked — you can switch it any time.
		</p>

		<div class="grid gap-2.5 sm:grid-cols-2">
			{#each ROLES as { key, icon: Icon }}
				{@const active = role === key}
				<button
					type="button"
					aria-pressed={active}
					onclick={() => {
						briefStore.updateMeta({ role: key });
						analytics.roleChosen(key);
					}}
					class="flex items-start gap-3 rounded-xl border p-3.5 text-left transition
						{active
						? 'border-accent bg-accent-wash/60'
						: 'border-border bg-surface-alt/40 hover:border-accent/40'}"
				>
					<span
						class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition
							{active ? 'bg-accent text-on-accent' : 'bg-surface text-ink-faint'}"
					>
						{#if active}
							<Check size={14} strokeWidth={2.75} />
						{:else}
							<Icon size={14} />
						{/if}
					</span>
					<span class="min-w-0">
						<span class="block text-sm font-semibold text-ink">{ROLE_COPY[key].label}</span>
						<span class="mt-0.5 block text-xs leading-relaxed text-ink-soft"
							>{ROLE_COPY[key].hint}</span
						>
					</span>
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset class="space-y-2.5">
		<legend class="text-sm font-medium text-ink">What kind of brief is this?</legend>
		<p class="text-xs text-ink-faint">
			Each template carries a knowledge model: what this kind of brief must establish,
			and which of its parts have to agree with each other.
		</p>

		<div class="flex flex-wrap gap-2">
			{#each TYPE_KEYS as key}
				{@const on = projectType === key}
				<button
					type="button"
					aria-pressed={on}
					onclick={() => {
						briefStore.updateMeta({ projectType: on ? null : key });
						if (!on) analytics.templateChosen(key);
					}}
					class="rounded-full border px-3.5 py-2 text-xs font-medium transition
						{on
						? 'border-accent bg-accent text-on-accent'
						: 'border-border bg-surface-alt/40 text-ink-soft hover:border-accent/40 hover:text-accent'}"
				>
					{PROJECT_TYPES[key].label}
				</button>
			{/each}
		</div>
	</fieldset>

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
			<!-- Reads "Client / Brand" to a designer, "Your company or brand" to the
			     person commissioning the work. Same field, opposite meaning. -->
			<label for="client-name" class="text-sm font-medium text-ink">
				{copy ? copy.orgLabel : 'Company or brand'}
			</label>
			<input
				id="client-name"
				type="text"
				value={briefStore.meta.clientName}
				oninput={(e) => briefStore.updateMeta({ clientName: e.currentTarget.value })}
				placeholder={copy ? copy.orgPlaceholder : 'e.g. Acme Corp'}
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
