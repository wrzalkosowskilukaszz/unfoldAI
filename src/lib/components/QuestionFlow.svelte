<script lang="ts">
	import {
		ArrowRight,
		SkipForward,
		Loader2,
		PencilLine,
		Check,
		AlertTriangle,
		Sparkles,
		CheckCheck
	} from '@lucide/svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import { aiConsent } from '$lib/stores/aiConsent.svelte';
	import {
		MAX_HELP_QUESTIONS,
		type HelpAnswer,
		type HelpQuestion,
		type SectionKey
	} from '$lib/types';

	let {
		sectionKey,
		oncomplete,
		oncancel
	}: {
		sectionKey: SectionKey;
		oncomplete: (answers: HelpAnswer[]) => void;
		oncancel: () => void;
	} = $props();

	let answers = $state<HelpAnswer[]>([]);
	let current = $state<HelpQuestion | null>(null);
	let loading = $state(true);
	let errorMsg = $state<string | null>(null);
	let customMode = $state(false);
	let textValue = $state('');
	/** Options picked so far on the current question — more than one is allowed. */
	let selected = $state<string[]>([]);

	let canFinishEarly = $derived(answers.some((a) => !a.skipped));

	/** Set on teardown so an in-flight request can't write state after unmount. */
	let dead = false;
	$effect(() => () => {
		dead = true;
	});

	/** Grows with the answer so nothing scrolls out of sight while typing. */
	function autoGrow(node: HTMLTextAreaElement) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};
		node.focus();
		resize();
		node.addEventListener('input', resize);
		return { destroy: () => node.removeEventListener('input', resize) };
	}

	function toggle(option: string) {
		selected = selected.includes(option)
			? selected.filter((o) => o !== option)
			: [...selected, option];
	}

	function selectAll() {
		selected = [...(current?.options ?? [])];
	}

	async function fetchNext() {
		// Text is about to leave the device; make sure the person has been told.
		if (!(await aiConsent.ensure())) return;

		loading = true;
		errorMsg = null;
		try {
			const otherSections: Record<string, string> = {};
			for (const key of briefStore.sectionKeys) {
				if (key !== sectionKey) otherSections[key] = briefStore.sections[key]?.raw ?? '';
			}

			const res = await fetch('/api/next-question', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sectionName: sectionKey,
					sectionRaw: briefStore.sections[sectionKey]?.raw ?? '',
					otherSections,
					answered: answers,
					learnedContext: briefStore.helpHistory,
					role: briefStore.meta.role,
					projectType: briefStore.meta.projectType
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
			if (dead) return;
			if (data.done || !data.question) {
				finish();
				return;
			}
			current = data.question;
			loading = false;
		} catch (err) {
			if (dead) return;
			errorMsg = err instanceof Error ? err.message : 'Something went wrong.';
			loading = false;
		}
	}

	function finish() {
		oncomplete(answers.filter((a) => !a.skipped));
	}

	function record(answer: string, skipped = false) {
		if (!current) return;
		answers = [...answers, { question: current.text, answer, skipped }];
		customMode = false;
		textValue = '';
		selected = [];
		current = null;
		if (answers.length >= MAX_HELP_QUESTIONS) {
			finish();
			return;
		}
		fetchNext();
	}

	function submitSelected() {
		if (selected.length === 0) return;
		record(selected.join(' · '));
	}

	function submitText() {
		if (!textValue.trim()) return;
		record(textValue.trim());
	}

	fetchNext();
</script>

<div class="space-y-5 rounded-2xl border border-border bg-surface-alt/50 p-5">
	<div class="flex items-center justify-between">
		<span class="text-[0.72rem] font-semibold tracking-wide text-ink-faint uppercase">
			{loading && answers.length === 0 ? 'Getting started' : `Question ${answers.length + 1}`}
		</span>
		<button
			type="button"
			onclick={oncancel}
			class="text-xs font-medium text-ink-faint underline-offset-2 hover:underline"
		>
			Cancel
		</button>
	</div>

	{#if answers.length > 0}
		<div class="space-y-2 border-b border-border pb-4">
			{#each answers as a}
				<div class="flex items-start gap-2 text-xs">
					<Check size={13} class="mt-0.5 shrink-0 text-clear" />
					<span class="text-ink-faint">{a.question}</span>
					<span class="font-medium text-ink-soft">{a.skipped ? '—' : a.answer}</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if errorMsg}
		<div class="space-y-2">
			<p class="flex items-center gap-1.5 text-xs text-contradiction">
				<AlertTriangle size={14} />
				{errorMsg}
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={fetchNext}
					class="text-xs font-medium text-accent hover:underline">Try again</button
				>
				{#if canFinishEarly}
					<button
						type="button"
						onclick={finish}
						class="text-xs font-medium text-ink-faint hover:underline"
					>
						Use what I've answered so far
					</button>
				{/if}
			</div>
		</div>
	{:else if loading}
		<div class="flex items-center gap-2 text-[0.95rem] text-ink-soft">
			<Loader2 size={15} class="animate-spin" />
			{answers.length === 0
				? 'Thinking of a good first question...'
				: 'Thinking about your answer...'}
		</div>
	{:else if current}
		<p class="text-[0.95rem] leading-snug font-medium text-ink">{current.text}</p>

		{#if current.type === 'choice' && !customMode}
			<div class="space-y-3">
				<div class="flex flex-wrap gap-2">
					{#each current.options ?? [] as option}
						{@const isOn = selected.includes(option)}
						<button
							type="button"
							onclick={() => toggle(option)}
							aria-pressed={isOn}
							class="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition
								{isOn
								? 'border-accent bg-accent text-on-accent shadow-sm'
								: 'border-border bg-surface text-ink hover:-translate-y-px hover:border-accent hover:text-accent'}"
						>
							{#if isOn}<Check size={12} />{/if}
							{option}
						</button>
					{/each}
					<button
						type="button"
						onclick={() => (customMode = true)}
						class="flex items-center gap-1.5 rounded-full border border-dashed border-accent/50 bg-surface px-3.5 py-2 text-xs font-medium text-accent transition hover:bg-accent-wash"
					>
						<PencilLine size={12} />
						My own answer
					</button>
				</div>

				<div class="flex flex-wrap items-center gap-3">
					{#if selected.length > 0}
						<button
							type="button"
							onclick={submitSelected}
							class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-ink text-background transition hover:-translate-y-px"
						>
							Continue with {selected.length} selected
							<ArrowRight size={13} />
						</button>
					{/if}
					{#if (current.options ?? []).length > 1 && selected.length < (current.options ?? []).length}
						<button
							type="button"
							onclick={selectAll}
							class="flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-accent"
						>
							<CheckCheck size={13} />
							All of these apply
						</button>
					{/if}
					{#if selected.length === 0}
						<span class="text-xs text-ink-faint">Pick one or more</span>
					{/if}
				</div>
			</div>
		{:else}
			<div class="space-y-2">
				<textarea
					bind:value={textValue}
					use:autoGrow
					rows="2"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							submitText();
						}
					}}
					placeholder={customMode
						? 'Describe it in your own words...'
						: 'Type your answer — Enter to send, Shift+Enter for a new line'}
					class="max-h-56 w-full resize-none overflow-y-auto rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-ink outline-none focus:border-accent"
				></textarea>
				<div class="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onclick={submitText}
						disabled={!textValue.trim()}
						class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-ink text-background transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
					>
						Continue
						<ArrowRight size={13} />
					</button>
					{#if customMode}
						<button
							type="button"
							onclick={() => {
								customMode = false;
								textValue = '';
							}}
							class="text-xs text-ink-faint hover:text-ink-soft"
						>
							Back to the suggested options
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-4 border-t border-border pt-3">
			<button
				type="button"
				onclick={() => record('', true)}
				class="flex items-center gap-1.5 text-xs text-ink-faint transition hover:text-ink-soft"
			>
				<SkipForward size={13} />
				Skip this one
			</button>
			{#if canFinishEarly}
				<button
					type="button"
					onclick={finish}
					class="flex items-center gap-1.5 text-xs font-medium text-accent transition hover:underline"
				>
					<Sparkles size={13} />
					That's enough — write my answer
				</button>
			{/if}
		</div>
	{/if}
</div>
