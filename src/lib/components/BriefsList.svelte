<script lang="ts">
	import {
		Plus,
		Upload,
		Pencil,
		Check,
		Copy,
		Download,
		Trash2,
		FileText,
		MoreHorizontal,
		AlertTriangle
	} from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { totalStepsFor } from '$lib/types';
	import type { SavedBrief } from '$lib/types';
	import FirstRun from '$lib/components/FirstRun.svelte';
	import { modal } from '$lib/actions/modal';

	let {
		onopen,
		onuploaddoc
	}: { onopen: (id: string) => void; onuploaddoc: () => void } = $props();

	let briefs = $derived(briefStore.listBriefs());
	let needsAttention = $derived(briefStore.briefsNeedingAttention);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let importError = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	/** Which brief's mobile action sheet is open. */
	let sheetFor = $state<string | null>(null);
	let sheet = $derived(sheetFor ? briefStore.briefs[sheetFor] : null);

	function focusAndSelect(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	function relativeTime(iso: string): string {
		const diffMs = Date.now() - new Date(iso).getTime();
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return new Date(iso).toLocaleDateString();
	}

	function stepLabel(brief: SavedBrief): string {
		// Each brief's length depends on its own template, not whichever is open.
		const total = totalStepsFor(brief.meta.projectType);
		return brief.step >= total ? 'Complete' : `Step ${brief.step} of ${total}`;
	}

	function handleNew() {
		const id = briefStore.createBrief();
		onopen(id);
	}

	function startRename(brief: SavedBrief, e: MouseEvent) {
		e.stopPropagation();
		renamingId = brief.id;
		renameValue = brief.name;
	}

	function commitRename() {
		if (renamingId) briefStore.renameBrief(renamingId, renameValue);
		renamingId = null;
	}

	function handleDuplicate(id: string, e: MouseEvent) {
		e.stopPropagation();
		briefStore.duplicateBrief(id);
	}

	/**
	 * Deliberately not window.confirm: browsers suppress it after a few dialogs
	 * (silently returning false, so the delete just appears to do nothing), and
	 * it is unreliable inside a packaged app webview.
	 */
	let pendingDelete = $state<SavedBrief | null>(null);

	function handleDelete(id: string, _name: string, e: MouseEvent) {
		e.stopPropagation();
		pendingDelete = briefStore.briefs[id] ?? null;
	}

	function confirmDelete() {
		if (pendingDelete) briefStore.deleteBrief(pendingDelete.id);
		pendingDelete = null;
	}

	/** Shared by the desktop icon row and the mobile action sheet. */
	function downloadBrief(id: string) {
		const json = briefStore.exportBriefJSON(id);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${briefStore.briefs[id]?.name || 'brief'}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleExport(id: string, e: MouseEvent) {
		e.stopPropagation();
		downloadBrief(id);
	}

	function triggerImport() {
		importError = null;
		fileInput?.click();
	}

	function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				briefStore.importBriefFromJSON(reader.result as string);
				importError = null;
			} catch {
				importError = "That file couldn't be read as a brief. Make sure it's an exported .json file.";
			}
		};
		reader.readAsText(file);
		(e.target as HTMLInputElement).value = '';
	}
</script>

{#if briefStore.isEmpty}
	<FirstRun onstart={handleNew} onimport={onuploaddoc} />
{:else}
<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">Your briefs</h2>
			<p class="mt-1 text-sm text-ink-soft">Pick up where you left off, or survey something new.</p>
		</div>
		<!-- min-h-11 keeps both at the 44px Apple HIG / WCAG 2.5.5 target on touch. -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={triggerImport}
				class="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md lg:min-h-0 lg:py-1.5"
			>
				<Upload size={15} class="text-accent" />
				Import
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept=".json,application/json"
				class="hidden"
				onchange={handleFileChange}
			/>
			<button
				type="button"
				onclick={handleNew}
				class="flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-on-accent transition hover:opacity-90 active:scale-[0.98] lg:min-h-0 lg:py-1.5"
			>
				<Plus size={15} />
				New brief
			</button>
		</div>
	</div>

	{#if importError}
		<p class="text-xs text-contradiction">{importError}</p>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2">
		{#each briefs as brief (brief.id)}
			<div
				role="button"
				tabindex="0"
				onclick={() => onopen(brief.id)}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onopen(brief.id)}
				class="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2 overflow-hidden">
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-accent"
						>
							<FileText size={15} />
						</span>
						{#if renamingId === brief.id}
							<input
								type="text"
								value={renameValue}
								use:focusAndSelect
								oninput={(e) => (renameValue = e.currentTarget.value)}
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => e.key === 'Enter' && commitRename()}
								onblur={commitRename}
								class="min-w-0 flex-1 rounded-md border border-accent bg-surface px-1.5 py-0.5 text-sm font-semibold text-ink outline-none"
							/>
						{:else}
							<span class="truncate text-sm font-semibold text-ink">{brief.name}</span>
						{/if}
					</div>
					<!-- Touch: one 44px target opening a sheet. Four 36px buttons in a row
					     put Delete a thumb-width from Export, which is how briefs get
					     destroyed by accident. -->
					<button
						type="button"
						aria-label="Actions for {brief.name}"
						onclick={(e) => {
							e.stopPropagation();
							sheetFor = brief.id;
						}}
						class="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint active:bg-ink/[0.06] lg:hidden"
					>
						<MoreHorizontal size={19} />
					</button>

					<div class="hidden shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 lg:flex">
						{#if renamingId === brief.id}
							<button
								type="button"
								aria-label="Save name"
								onclick={(e) => {
									e.stopPropagation();
									commitRename();
								}}
								class="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-surface-alt hover:text-accent"
							>
								<Check size={13} />
							</button>
						{:else}
							<button
								type="button"
								aria-label="Rename"
								onclick={(e) => startRename(brief, e)}
								class="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-surface-alt hover:text-accent"
							>
								<Pencil size={13} />
							</button>
						{/if}
						<button
							type="button"
							aria-label="Duplicate"
							onclick={(e) => handleDuplicate(brief.id, e)}
							class="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-surface-alt hover:text-accent"
						>
							<Copy size={13} />
						</button>
						<button
							type="button"
							aria-label="Export as JSON"
							onclick={(e) => handleExport(brief.id, e)}
							class="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-surface-alt hover:text-accent"
						>
							<Download size={13} />
						</button>
						<button
							type="button"
							aria-label="Delete"
							onclick={(e) => handleDelete(brief.id, brief.name, e)}
							class="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-contradiction-wash hover:text-contradiction"
						>
							<Trash2 size={13} />
						</button>
					</div>
				</div>

				<div class="flex items-center justify-between text-xs text-ink-faint">
					<span>{brief.meta.clientName || 'No client set'}</span>
					<span>{relativeTime(brief.updatedAt)}</span>
				</div>

				<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
					<div
						class="h-full rounded-full"
						style="width: {(brief.step / totalStepsFor(brief.meta.projectType)) * 100}%; background: linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))"
					></div>
				</div>
				<span class="text-[0.72rem] font-medium text-ink-faint">{stepLabel(brief)}</span>
			</div>
		{/each}
	</div>

	<!--
		The space under the cards earns its place only when there is something
		actionable to say. Unsettled questions are on-thesis and worth returning
		for; a stats panel would just be decoration.
	-->
	{#if needsAttention.length > 0}
		<div class="rounded-xl border border-border bg-surface-alt/40 px-4 py-3.5">
			<h3 class="flex items-center gap-2 text-sm font-semibold text-ink">
				<AlertTriangle size={15} class="text-attention" />
				Waiting on you
			</h3>
			<ul class="mt-2.5 space-y-1.5">
				{#each needsAttention as brief}
					{@const count = brief.findings.filter(
						(f) => f.status === 'open' && f.kind !== 'clear'
					).length}
					<li>
						<button
							type="button"
							onclick={() => onopen(brief.id)}
							class="group flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm hover:bg-ink/[0.03]"
						>
							<span class="min-w-0 truncate font-medium text-ink">{brief.name}</span>
							<span class="shrink-0 text-xs text-ink-soft group-hover:text-accent">
								{count} unsettled →
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
{/if}

<!-- Mobile action sheet: full-width rows, comfortably spaced, destructive action
     set apart at the bottom so it is never adjacent to a routine one. -->
{#if sheet}
	<div
		class="fixed inset-0 z-50 lg:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Actions for {sheet.name}"
		use:modal={() => (sheetFor = null)}
	>
		<button
			type="button"
			aria-label="Close menu"
			onclick={() => (sheetFor = null)}
			class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
		></button>

		<div
			class="safe-bottom rise absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface px-3 pt-2 pb-3"
		>
			<!-- Grab handle: the usual signal that a sheet is dismissable by dragging. -->
			<div class="mx-auto mb-1 h-1 w-9 rounded-full bg-border-strong"></div>

			<p class="truncate border-b border-border px-3 pt-2 pb-3 text-sm font-semibold text-ink">
				{sheet.name}
			</p>

			<div class="h-1.5"></div>

			<button
				type="button"
				onclick={() => {
					renamingId = sheet.id;
					renameValue = sheet.name;
					sheetFor = null;
				}}
				class="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink active:bg-surface-hover"
			>
				<Pencil size={17} class="text-ink-faint" />
				Rename
			</button>

			<button
				type="button"
				onclick={() => {
					briefStore.duplicateBrief(sheet.id);
					sheetFor = null;
				}}
				class="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink active:bg-surface-hover"
			>
				<Copy size={17} class="text-ink-faint" />
				Duplicate
			</button>

			<button
				type="button"
				onclick={() => {
					downloadBrief(sheet.id);
					sheetFor = null;
				}}
				class="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink active:bg-surface-hover"
			>
				<Download size={17} class="text-ink-faint" />
				Export as file
			</button>

			<div class="my-2 h-px bg-border"></div>

			<button
				type="button"
				onclick={() => {
					const target = sheet;
					sheetFor = null;
					pendingDelete = target;
				}}
				class="flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-contradiction active:bg-contradiction-wash"
			>
				<Trash2 size={17} />
				Delete
			</button>

			<button
				type="button"
				onclick={() => (sheetFor = null)}
				class="mt-2 flex min-h-13 w-full items-center justify-center rounded-xl bg-surface-alt text-sm font-semibold text-ink active:opacity-80"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<!-- Delete confirmation. In-app rather than window.confirm so it can never be
     silently suppressed by the browser, and so it matches the rest of the UI. -->
{#if pendingDelete}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-dialog-title"
		use:modal={() => (pendingDelete = null)}
	>
		<button
			type="button"
			aria-label="Cancel"
			onclick={() => (pendingDelete = null)}
			class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
		></button>

		<!--
			Icon and title share a centred row; the body then aligns to the title's
			text edge rather than hanging under the icon. Equal padding all round,
			with the actions separated by a rule so they read as a distinct region.
		-->
		<div
			class="rise safe-bottom elevated relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface"
		>
			<div class="p-6 sm:p-7">
				<div class="flex items-center gap-3.5">
					<span
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-contradiction-wash text-contradiction"
					>
						<Trash2 size={19} />
					</span>
					<h2
						id="delete-dialog-title"
						class="font-display text-[1.05rem] leading-tight font-semibold text-ink"
					>
						Delete this brief?
					</h2>
				</div>

				<p class="mt-4 text-sm leading-relaxed text-ink-soft sm:pl-[3.625rem]">
					<span class="font-medium text-ink">{pendingDelete.name}</span> and everything in it will be
					removed. This can't be undone.
				</p>
			</div>

			<div
				class="flex flex-col-reverse gap-2.5 border-t border-border bg-surface-alt/40 px-6 py-4 sm:flex-row sm:justify-end sm:px-7"
			>
				<button
					type="button"
					onclick={() => (pendingDelete = null)}
					class="flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-ink-soft transition hover:bg-surface-hover"
				>
					Keep it
				</button>
				<button
					type="button"
					onclick={confirmDelete}
					class="flex min-h-11 items-center justify-center rounded-full bg-contradiction px-5 text-sm font-semibold text-on-contradiction transition hover:opacity-90 active:scale-[0.98]"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
