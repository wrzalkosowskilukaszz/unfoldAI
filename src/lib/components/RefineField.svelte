<script lang="ts">
	import { Sparkles, Loader2, Check, Pencil, RefreshCw, AlertTriangle, MessagesSquare } from '@lucide/svelte';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import { briefStore } from '$lib/stores/brief.svelte';
	import type { HelpAnswer, SectionKey } from '$lib/types';
	import QuestionFlow from '$lib/components/QuestionFlow.svelte';

	let {
		sectionKey,
		label,
		placeholder
	}: { sectionKey: SectionKey; label: string; placeholder: string } = $props();

	let section = $derived(briefStore.sections[sectionKey]);
	let editing = $state(false);
	let editValue = $state('');

	let helpState = $state<'idle' | 'asking'>('idle');

	let renderedProposal = $derived(
		section.refined ? DOMPurify.sanitize(marked.parse(section.refined, { async: false })) : ''
	);

	async function refine(regenerate: boolean) {
		briefStore.setStatus(sectionKey, 'loading');
		try {
			const res = await fetch('/api/refine-section', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sectionName: sectionKey,
					rawInput: briefStore.sections[sectionKey]?.raw ?? '',
					role: briefStore.meta.role,
					projectType: briefStore.meta.projectType,
					regenerate
				})
			});
			if (!res.ok) {
				let message = `Request failed (${res.status})`;
				try {
					const data = await res.json();
					if (data?.message) message = data.message;
				} catch {
					// non-JSON error body — keep the generic message
				}
				throw new Error(message);
			}
			const data = await res.json();
			briefStore.setRefined(sectionKey, data.refined);
		} catch (err) {
			briefStore.setStatus(
				sectionKey,
				'error',
				err instanceof Error ? err.message : 'Something went wrong.'
			);
		}
	}

	function startEdit() {
		editValue = section.refined ?? '';
		editing = true;
	}

	function saveEdit() {
		briefStore.setEdited(sectionKey, editValue);
		editing = false;
	}

	function cancelEdit() {
		editing = false;
	}

	function startHelp() {
		helpState = 'asking';
	}

	function cancelHelp() {
		helpState = 'idle';
	}

	async function completeHelp(answers: HelpAnswer[]) {
		helpState = 'idle';
		if (answers.length === 0) return;

		// Remembered across sections so later interviews build on what we already learned.
		briefStore.appendHelpHistory(
			sectionKey,
			answers.map((a) => ({ question: a.question, answer: a.answer }))
		);

		// Markdown, not "Q:/A:" — if this ever reaches the export unrefined it still reads
		// as a document rather than a raw interview log.
		const transcript = answers.map((a) => `**${a.question}**\n${a.answer}`).join('\n\n');
		briefStore.setRaw(sectionKey, transcript);
		await refine(false);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-end gap-2">
		<!-- The step heading above already names this field; repeating it visually
		     was redundant. Kept for screen readers so the textarea stays labelled. -->
		<label for="{sectionKey}-input" class="sr-only">{label}</label>
		{#if !section.refined && helpState === 'idle'}
			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onclick={startHelp}
					class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md lg:min-h-0 lg:py-1.5"
				>
					<MessagesSquare size={14} class="text-accent" />
					<span>Help me figure this out</span>
				</button>
				<button
					type="button"
					onclick={() => refine(false)}
					disabled={!section.raw.trim() || section.status === 'loading'}
					class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-alt/60 px-3.5 text-xs font-medium text-accent transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-0 lg:py-1.5"
				>
					{#if section.status === 'loading'}
						<Loader2 size={14} class="animate-spin" />
						<span>Status: Refining with AI...</span>
					{:else}
						<Sparkles size={14} />
						<span>Improve with AI</span>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if helpState === 'asking'}
		<QuestionFlow {sectionKey} oncomplete={completeHelp} oncancel={cancelHelp} />
	{:else if !section.refined}
		<textarea
			id="{sectionKey}-input"
			rows="6"
			{placeholder}
			value={section.raw}
			oninput={(e) => briefStore.setRaw(sectionKey, e.currentTarget.value)}
			disabled={section.status === 'loading'}
			class="w-full resize-y rounded-xl border border-border bg-surface-alt/60 p-3 text-sm text-ink placeholder-ink-faint outline-none focus:border-accent disabled:opacity-60"
		></textarea>

		{#if section.status === 'error' && section.error}
			<p class="flex items-center gap-1.5 text-xs text-contradiction">
				<AlertTriangle size={13} />
				{section.error}
			</p>
		{/if}

		{#if section.accepted}
			<p class="flex items-center gap-1.5 text-xs text-clear">
				<Check size={13} />
				AI-structured version applied
			</p>
		{/if}
	{/if}

	{#if section.refined}
		<div class="grid gap-3 md:grid-cols-2">
			<div class="rounded-2xl border border-border bg-surface-alt/50 p-4">
				<p class="mb-2.5 text-[0.72rem] font-semibold tracking-wide text-ink-faint uppercase">
					Original Raw Input
				</p>
				<p class="text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">{section.raw}</p>
			</div>
			<div class="rounded-2xl border border-accent/30 bg-surface-alt/50 p-4">
				<p class="mb-2.5 text-[0.72rem] font-semibold tracking-wide text-accent uppercase">
					AI Structured Proposal
				</p>
				{#if section.status === 'loading'}
					<div class="flex items-center gap-2 text-sm text-ink-soft">
						<Loader2 size={14} class="animate-spin" />
						Status: Refining with AI...
					</div>
				{:else if editing}
					<textarea
						rows="10"
						bind:value={editValue}
						class="w-full resize-y rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-ink outline-none focus:border-accent"
					></textarea>
				{:else}
					<!-- Rendered, not raw: the proposal should read the way it will in the export. -->
					<div class="prose-brief prose prose-sm max-w-none">
						{@html renderedProposal}
					</div>
				{/if}
			</div>
		</div>

		{#if section.status === 'error' && section.error}
			<p class="flex items-center gap-1.5 text-xs text-contradiction">
				<AlertTriangle size={13} />
				{section.error}
			</p>
		{/if}

		<div class="flex flex-wrap gap-2">
			{#if editing}
				<button
					type="button"
					onclick={saveEdit}
					class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-ink text-background transition hover:opacity-90"
				>
					<Check size={14} />
					Save Changes
				</button>
				<button
					type="button"
					onclick={cancelEdit}
					class="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-hover"
				>
					Cancel
				</button>
			{:else}
				<button
					type="button"
					onclick={() => briefStore.acceptRefined(sectionKey)}
					disabled={section.status === 'loading'}
					class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-ink text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Check size={14} />
					Accept & Apply
				</button>
				<button
					type="button"
					onclick={startEdit}
					disabled={section.status === 'loading'}
					class="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Pencil size={14} />
					Edit Manually
				</button>
				<button
					type="button"
					onclick={() => refine(true)}
					disabled={section.status === 'loading'}
					class="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
				>
					<RefreshCw size={14} />
					Regenerate
				</button>
			{/if}
		</div>
	{/if}
</div>
