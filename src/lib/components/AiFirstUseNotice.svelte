<script lang="ts">
	import { aiConsent } from '$lib/stores/aiConsent.svelte';
	import { modal } from '$lib/actions/modal';
	import { Check } from '@lucide/svelte';

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

		<!--
			max-height plus an internal scroll region: at 375x560 — a real phone once
			browser chrome is accounted for — the card ran past the viewport and its
			heading sat above the fold. The action bar is pinned outside the scroll
			area so the primary button is never what gets scrolled away.
		-->
		<div
			class="rise safe-bottom elevated relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-[1.75rem] bg-surface"
		>
			<div class="min-h-0 flex-1 overflow-y-auto">
				<!--
					The animation is the hero, so it gets a full-width plate of its own and
					real breathing room. White rather than sand: the shield's gradients
					resolve to violet, and a warm ground muddies them.
				-->
				<div
					class="relative flex justify-center overflow-hidden bg-white px-6 pt-7 pb-4"
				>
					<!-- A soft violet bloom behind the mark, so it sits on the plate
					     rather than floating on flat white. -->
					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-x-0 top-0 h-full"
						style="background: radial-gradient(58% 62% at 50% 42%, var(--c-accent-wash), transparent 72%)"
					></div>
					{#await import('$lib/components/ShieldAnim.svelte') then { default: ShieldAnim }}
						<div class="relative [&>svg]:h-[13rem] [&>svg]:w-[13rem] sm:[&>svg]:h-[16.5rem] sm:[&>svg]:w-[16.5rem]">
							<ShieldAnim size={264} />
						</div>
					{/await}
				</div>

				<div class="flex flex-col gap-3.5 px-7 pt-6 pb-6">
					<div class="flex flex-col gap-2">
						<p class="text-[0.68rem] font-semibold tracking-[0.16em] text-accent uppercase">
							One-time notice
						</p>
						<h2
							id="ai-notice-title"
							class="font-display text-[1.4rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink"
						>
							Your words stay yours
						</h2>
					</div>

					<p class="text-[0.94rem] leading-relaxed text-ink-soft">
						Everything you've written so far has stayed on this device. To do this, the text of
						your brief is sent to <span class="font-medium text-ink">Claude</span> — only when you
						ask, like now.
					</p>

					<ul class="flex flex-col gap-2 border-t border-border pt-3.5">
						<li class="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
							<Check size={15} class="mt-[3px] shrink-0 text-accent" />
							<span>We never receive a copy. Nothing is stored on our servers.</span>
						</li>
						<li class="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
							<Check size={15} class="mt-[3px] shrink-0 text-accent" />
							<span>It isn't used to train any model.</span>
						</li>
						<li class="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
							<Check size={15} class="mt-[3px] shrink-0 text-accent" />
							<span>
								You decide what goes in — roles work as well as names, and
								<span class="text-ink">"the marketing director"</span> surveys just as well.
							</span>
						</li>
					</ul>
				</div>
			</div>

			<div
				class="flex shrink-0 flex-col gap-2.5 border-t border-border bg-surface-alt/50 px-7 py-4"
			>
				<button
					type="button"
					onclick={() => aiConsent.acknowledge()}
					class="flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition hover:opacity-90 active:scale-[0.99]"
				>
					Got it — continue
				</button>
				<div class="flex items-center justify-between gap-4">
					<button
						type="button"
						onclick={() => aiConsent.cancel()}
						class="text-xs font-medium text-ink-faint transition hover:text-ink-soft"
					>
						Not now
					</button>
					<a href="/privacy" class="text-xs font-medium text-ink-faint transition hover:text-accent">
						Read the privacy policy →
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
