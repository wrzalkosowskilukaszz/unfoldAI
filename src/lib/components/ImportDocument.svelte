<script lang="ts">
	import {
		Upload,
		FileText,
		Loader2,
		AlertTriangle,
		ArrowLeft,
		ArrowRight,
		Check,
		Pencil
	} from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { SECTION_LABELS, SECTION_ORDER, type SectionKey } from '$lib/types';

	let { oncancel, onopen }: { oncancel: () => void; onopen: (id: string) => void } = $props();

	type Stage = 'input' | 'reading' | 'mapping' | 'error';

	let stage = $state<Stage>('input');
	let errorMsg = $state<string | null>(null);
	let pasted = $state('');
	let fileName = $state('');
	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	/** The AI's proposed mapping — editable before anything is committed. */
	let mapped = $state<Record<SectionKey, string>>({
		objectives: '',
		audience: '',
		deliverables: '',
		constraints: ''
	});
	let projectName = $state('');
	let clientName = $state('');
	let unplaced = $state('');
	let editing = $state<SectionKey | null>(null);

	let filledCount = $derived(SECTION_ORDER.filter((k) => mapped[k].trim()).length);

	async function readFile(file: File): Promise<string> {
		const name = file.name.toLowerCase();

		if (name.endsWith('.docx')) {
			// Loaded on demand — the parser is large and most imports are plain text.
			const mammoth = await import('mammoth/mammoth.browser.js');
			const buf = await file.arrayBuffer();
			const res = await mammoth.extractRawText({ arrayBuffer: buf });
			return res.value;
		}

		if (name.endsWith('.doc')) {
			throw new Error(
				'Old .doc files can\'t be read directly. Open it in Word and "Save As" .docx, or paste the text instead.'
			);
		}

		if (name.endsWith('.pdf')) {
			throw new Error('PDF support is coming. For now, copy the text and paste it below.');
		}

		return file.text();
	}

	async function handleFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		(e.target as HTMLInputElement).value = '';
		if (!file) return;

		fileName = file.name;
		stage = 'reading';
		errorMsg = null;
		try {
			const text = await readFile(file);
			await sortDocument(text);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : "That file couldn't be read.";
			stage = 'error';
		}
	}

	async function handlePaste() {
		if (!pasted.trim()) return;
		fileName = 'Pasted text';
		stage = 'reading';
		errorMsg = null;
		await sortDocument(pasted);
	}

	async function sortDocument(text: string) {
		try {
			const res = await fetch('/api/parse-document', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (!res.ok) {
				let message = `Request failed (${res.status})`;
				try {
					const data = await res.json();
					if (data?.message) message = data.message;
				} catch {
					// non-JSON body — keep the generic message
				}
				throw new Error(message);
			}
			const data = await res.json();
			mapped = data.sections;
			projectName = data.projectName || '';
			clientName = data.clientName || '';
			unplaced = data.unplaced || '';
			stage = 'mapping';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong.';
			stage = 'error';
		}
	}

	/** Only now is anything written — the user has seen where everything landed. */
	function confirmMapping() {
		const id = briefStore.createBrief();
		briefStore.updateMeta({
			projectName: projectName || fileName.replace(/\.[^.]+$/, ''),
			clientName
		});
		for (const key of SECTION_ORDER) {
			if (mapped[key].trim()) briefStore.setRaw(key, mapped[key].trim());
		}
		// They already have a brief; what they came for is the diagnosis.
		briefStore.goToStep(6);
		onopen(id);
	}
</script>

<section class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h2 class="font-display text-xl font-semibold text-ink">Bring an existing brief</h2>
			<p class="mt-1 max-w-lg text-sm text-ink-soft">
				Upload the document you already wrote. It gets sorted into the four sections, then reviewed
				for what it hasn't settled.
			</p>
		</div>
		<button
			type="button"
			onclick={oncancel}
			class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-soft hover:bg-ink/[0.04] lg:min-h-0 lg:py-2"
		>
			<ArrowLeft size={15} />
			Back
		</button>
	</div>

	{#if stage === 'input' || stage === 'error'}
		{#if errorMsg}
			<p class="flex items-start gap-2 rounded-xl bg-contradiction-wash px-4 py-3 text-sm text-contradiction">
				<AlertTriangle size={16} class="mt-0.5 shrink-0" />
				{errorMsg}
			</p>
		{/if}

		<button
			type="button"
			onclick={() => fileInput?.click()}
			class="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface-alt/40 px-6 py-10 text-center transition hover:border-accent/50 hover:bg-surface-alt/70"
		>
			<span class="flex h-11 w-11 items-center justify-center rounded-full bg-accent-wash text-accent">
				<Upload size={19} />
			</span>
			<span class="mt-1 text-sm font-semibold text-ink">Choose a document</span>
			<span class="text-xs text-ink-soft">Word (.docx), plain text, or Markdown</span>
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept=".docx,.txt,.md,.markdown,.rtf,text/plain"
			class="hidden"
			onchange={handleFile}
		/>

		<div class="flex items-center gap-3">
			<span class="h-px flex-1 bg-border"></span>
			<span class="text-xs text-ink-faint">or paste it</span>
			<span class="h-px flex-1 bg-border"></span>
		</div>

		<div class="space-y-2.5">
			<textarea
				bind:value={pasted}
				rows="6"
				placeholder="Paste the brief here — emails, meeting notes, a half-written doc, anything."
				class="w-full resize-y rounded-xl border border-border bg-surface-alt/60 p-3.5 text-sm leading-relaxed text-ink placeholder-ink-faint outline-none focus:border-accent"
			></textarea>
			<button
				type="button"
				onclick={handlePaste}
				disabled={!pasted.trim()}
				class="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Sort this into a brief
				<ArrowRight size={16} />
			</button>
		</div>
	{:else if stage === 'reading'}
		<div
			class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-alt/30 px-6 py-14 text-center"
		>
			<Loader2 size={26} class="animate-spin text-accent" />
			<p class="text-sm font-medium text-ink">Reading {fileName}...</p>
			<p class="max-w-sm text-xs text-ink-soft">
				Working out what belongs in which section. Nothing is saved until you approve it.
			</p>
		</div>
	{:else if stage === 'mapping'}
		<div class="space-y-4">
			<div class="flex flex-wrap items-center gap-2 rounded-xl bg-clear-wash px-4 py-3">
				<Check size={16} class="shrink-0 text-clear" />
				<p class="text-sm text-ink">
					Sorted <span class="font-semibold">{fileName}</span> into {filledCount} of 4 sections. Check
					it before continuing.
				</p>
			</div>

			{#if projectName || clientName}
				<div class="flex flex-wrap gap-x-8 gap-y-2 px-1">
					{#if projectName}
						<div>
							<p class="text-[0.66rem] font-medium tracking-[0.14em] text-ink-faint uppercase">
								Project
							</p>
							<p class="text-sm font-medium text-ink">{projectName}</p>
						</div>
					{/if}
					{#if clientName}
						<div>
							<p class="text-[0.66rem] font-medium tracking-[0.14em] text-ink-faint uppercase">
								Client
							</p>
							<p class="text-sm font-medium text-ink">{clientName}</p>
						</div>
					{/if}
				</div>
			{/if}

			{#each SECTION_ORDER as key}
				<div class="rounded-2xl border border-border bg-surface p-4">
					<div class="flex items-center justify-between gap-3">
						<h3 class="text-sm font-semibold text-ink">{SECTION_LABELS[key]}</h3>
						{#if mapped[key].trim()}
							<button
								type="button"
								onclick={() => (editing = editing === key ? null : key)}
								class="flex min-h-11 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-ink-faint hover:text-accent lg:min-h-0 lg:py-1.5"
							>
								<Pencil size={13} />
								{editing === key ? 'Done' : 'Edit'}
							</button>
						{/if}
					</div>

					{#if editing === key}
						<textarea
							bind:value={mapped[key]}
							rows="6"
							class="mt-2.5 w-full resize-y rounded-lg border border-accent bg-surface-alt/50 p-3 text-sm leading-relaxed text-ink outline-none"
						></textarea>
					{:else if mapped[key].trim()}
						<p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
							{mapped[key]}
						</p>
					{:else}
						<p class="mt-2 text-sm text-ink-faint italic">
							Nothing in the document covered this — the review will flag it.
						</p>
					{/if}
				</div>
			{/each}

			{#if unplaced}
				<div class="rounded-2xl border border-dashed border-border-strong bg-surface-alt/30 p-4">
					<h3 class="flex items-center gap-1.5 text-sm font-semibold text-ink">
						<FileText size={14} class="text-ink-faint" />
						Left out
					</h3>
					<p class="mt-1.5 text-xs text-ink-soft">
						This didn't fit any section, so it wasn't imported:
					</p>
					<p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">{unplaced}</p>
				</div>
			{/if}

			<div class="flex flex-wrap gap-2.5 pt-1">
				<button
					type="button"
					onclick={confirmMapping}
					class="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 active:scale-[0.98]"
				>
					Looks right — review it
					<ArrowRight size={16} />
				</button>
				<button
					type="button"
					onclick={() => {
						stage = 'input';
						pasted = '';
					}}
					class="flex min-h-12 items-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-ink-soft transition hover:bg-surface-hover"
				>
					Start over
				</button>
			</div>
		</div>
	{/if}
</section>
