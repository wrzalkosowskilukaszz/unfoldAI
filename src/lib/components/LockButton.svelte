<script lang="ts">
	import { LogOut, Lock } from '@lucide/svelte';
	import { modal } from '$lib/actions/modal';
	import { briefStore } from '$lib/stores/brief.svelte';

	/**
	 * Re-locks this browser, for a shared or borrowed machine — without it, once
	 * unlocked a browser stayed open for the full thirty-day cookie life.
	 *
	 * It confirms first, and the confirmation leads with what does NOT happen.
	 * An unlabelled control that drops you on a password screen reads as
	 * destructive even though it isn't: briefs live in this browser's storage and
	 * locking never touches them. Saying so is the whole point of the dialog.
	 */
	let { compact = false }: { compact?: boolean } = $props();

	let confirming = $state(false);

	let unexported = $derived(
		briefStore.listBriefs().filter((b) => briefStore.needsBackup(b)).length
	);
</script>

<button
	type="button"
	onclick={() => (confirming = true)}
	aria-label="Lock this browser"
	class="flex items-center gap-1.5 rounded-full border border-border text-ink-soft transition-colors hover:border-accent/40 hover:text-accent {compact
		? 'h-11 w-11 justify-center'
		: 'h-11 px-3 lg:h-9'}"
>
	<LogOut size={15} />
	{#if !compact}
		<span class="hidden text-xs font-medium sm:inline">Lock</span>
	{/if}
</button>

{#if confirming}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="lock-dialog-title"
		use:modal={() => (confirming = false)}
	>
		<button
			type="button"
			aria-label="Cancel"
			onclick={() => (confirming = false)}
			class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
		></button>

		<div
			class="rise safe-bottom elevated relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface"
		>
			<div class="p-6 sm:p-7">
				<div class="flex items-center gap-3.5">
					<span
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent"
					>
						<Lock size={19} />
					</span>
					<h2
						id="lock-dialog-title"
						class="font-display text-[1.05rem] leading-tight font-semibold text-ink"
					>
						Lock this browser?
					</h2>
				</div>

				<div class="mt-4 flex flex-col gap-2 sm:pl-[3.625rem]">
					<p class="text-sm leading-relaxed text-ink-soft">
						<span class="font-medium text-ink">Your briefs stay exactly where they are.</span>
						They're saved on this device and locking doesn't touch them — you'll just need the
						password to get back in.
					</p>
					{#if unexported > 0}
						<p class="text-sm leading-relaxed text-ink-soft">
							{unexported === 1 ? 'One brief has' : `${unexported} briefs have`} never been exported.
							{unexported === 1 ? 'It' : 'They'} will still be here, but clearing this browser's data
							would remove {unexported === 1 ? 'it' : 'them'} permanently.
						</p>
					{/if}
				</div>
			</div>

			<div
				class="flex flex-col-reverse gap-2.5 border-t border-border bg-surface-alt/40 px-6 py-4 sm:flex-row sm:justify-end sm:px-7"
			>
				<button
					type="button"
					onclick={() => (confirming = false)}
					class="flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-ink-soft transition hover:bg-surface-hover"
				>
					Stay signed in
				</button>
				<form method="POST" action="/unlock?/lock" class="contents">
					<button
						type="submit"
						class="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition hover:opacity-90 active:scale-[0.98]"
					>
						<Lock size={14} />
						Lock it
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
