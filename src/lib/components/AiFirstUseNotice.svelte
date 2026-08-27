<script lang="ts">
	import { aiConsent } from '$lib/stores/aiConsent.svelte';
	import { modal } from '$lib/actions/modal';

	/**
	 * Appears once, at the moment the first request would send text to the model
	 * — not on arrival. Mounted once at the app root; any AI action awaits
	 * aiConsent.ensure() and this is what resolves it.
	 *
	 * The animation is lazy: it is a one-time moment, so there is no reason for
	 * every session to carry it in the route chunk.
	 */
</script>

{#if aiConsent.pending}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="ai-notice-title"
		use:modal={() => aiConsent.cancel()}
	>
		<button
			type="button"
			aria-label="Not now"
			onclick={() => aiConsent.cancel()}
			class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
		></button>

		<div
			class="rise safe-bottom elevated relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface"
		>
			<div class="flex flex-col items-center gap-1 bg-sand px-6 pt-6 pb-2 text-center">
				{#await import('$lib/components/ShieldAnim.svelte') then { default: ShieldAnim }}
					<ShieldAnim size={128} />
				{/await}
			</div>

			<div class="flex flex-col gap-3 p-6 sm:p-7">
				<h2 id="ai-notice-title" class="font-display text-lg leading-tight font-semibold text-ink">
					Before the AI reads this
				</h2>

				<p class="text-sm leading-relaxed text-ink-soft">
					Everything you've written so far has stayed on this device. To do this, the text of your
					brief is sent to <span class="font-medium text-ink">Claude</span> — and only when you ask,
					like now.
				</p>

				<ul class="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
					<li class="flex gap-2">
						<span aria-hidden="true" class="text-accent">—</span>
						<span>We never receive a copy. Nothing is stored on our servers.</span>
					</li>
					<li class="flex gap-2">
						<span aria-hidden="true" class="text-accent">—</span>
						<span>It isn't used to train any model.</span>
					</li>
					<li class="flex gap-2">
						<span aria-hidden="true" class="text-accent">—</span>
						<span>
							You decide what goes in. Roles work as well as names — "the marketing director"
							surveys just as well.
						</span>
					</li>
				</ul>

				<p class="text-xs text-ink-faint">
					You'll only see this once. The full detail is in the
					<a href="/privacy" class="font-medium text-accent hover:underline">privacy policy</a>.
				</p>
			</div>

			<div
				class="flex flex-col-reverse gap-2.5 border-t border-border bg-surface-alt/40 px-6 py-4 sm:flex-row sm:justify-end sm:px-7"
			>
				<button
					type="button"
					onclick={() => aiConsent.cancel()}
					class="flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-ink-soft transition hover:bg-surface-hover"
				>
					Not now
				</button>
				<button
					type="button"
					onclick={() => aiConsent.acknowledge()}
					class="flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition hover:opacity-90 active:scale-[0.98]"
				>
					Got it — continue
				</button>
			</div>
		</div>
	</div>
{/if}
