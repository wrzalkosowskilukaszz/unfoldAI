<script lang="ts">
	import { ArrowLeft, ArrowRight, ChevronLeft, Moon, Sun } from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import StepNav from '$lib/components/StepNav.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import BriefsList from '$lib/components/BriefsList.svelte';
	import AiFirstUseNotice from '$lib/components/AiFirstUseNotice.svelte';
	import LockButton from '$lib/components/LockButton.svelte';
	import SaveIndicator from '$lib/components/SaveIndicator.svelte';
	import ImportDocument from '$lib/components/ImportDocument.svelte';
	import Step1Metadata from '$lib/components/steps/Step1Metadata.svelte';
	import StepSection from '$lib/components/steps/StepSection.svelte';
	import Step6Diagnose from '$lib/components/steps/Step6Diagnose.svelte';
	import Step7Export from '$lib/components/steps/Step7Export.svelte';
	import { briefStore } from '$lib/stores/brief.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Intro from '$lib/components/Intro.svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { untrack } from 'svelte';
	import { go, replace, readPosition } from '$lib/navigation.svelte';

	/**
	 * Nothing below the <Seo> renders on the server. The page is built from
	 * localStorage, which the server cannot see — but the server still has to
	 * send the title, description and social card, because link previews on
	 * LinkedIn, Slack and iMessage never run JavaScript. So: real head tags,
	 * empty body, and the app mounts into it exactly as it did when the route
	 * was client-only.
	 *
	 * `ready` also gates every pushState/replaceState below. afterNavigate
	 * fires for the initial load too, one synchronous step before the router
	 * marks itself started, so the flag is set a microtask later — calling
	 * replaceState from an effect during mount throws in dev and, worse, the
	 * throw tears the component down.
	 */
	let ready = $state(false);
	afterNavigate(() => queueMicrotask(() => (ready = true)));

	/**
	 * The wizard's shape comes from the brief's template: Basics, one step per
	 * section, Survey, Export. A template with an extra section simply has an
	 * extra step — nothing here needs to know which.
	 */
	let totalSteps = $derived(briefStore.totalSteps);
	let stepLabels = $derived(briefStore.stepLabels);
	let sectionKey = $derived(briefStore.sectionAtStep(briefStore.step));

	let { data }: { data: { gated: boolean } } = $props();

	let view = $state<'gallery' | 'wizard' | 'import'>('gallery');

	/**
	 * The full hero is for someone who has never seen the product. Someone with
	 * briefs, or who has just come to import one, is here to work — for them
	 * the same headline shrinks to a masthead so their briefs sit above the
	 * fold, and the illustration steps aside: at a small size beside a small
	 * line it read as a sticker, not a companion.
	 */
	let compactHero = $derived(view === 'import' || !briefStore.isEmpty);

	/**
	 * The URL drives the view, not the other way round — which is what makes the
	 * browser's back and forward buttons work without any handling of our own,
	 * and what lets a refresh land where you were.
	 */
	/**
	 * Applies whatever the URL says. This exists for navigation the app did not
	 * initiate — back, forward, and a fresh load on a deep link. Explicit actions
	 * below set the view themselves rather than relying on this, because
	 * pushState updates the URL without re-running the effect; only popstate and
	 * a real load do.
	 */
	$effect(() => {
		const url = page.url;
		untrack(() => {
			const pos = readPosition(url);
			if (pos.view !== view) view = pos.view;
			if (pos.view === 'wizard' && pos.briefId) {
				if (briefStore.activeBriefId !== pos.briefId) briefStore.openBrief(pos.briefId);
				const step = Math.min(pos.step ?? 1, briefStore.totalSteps);
				if (briefStore.step !== step) briefStore.goToStep(step);
			}
		});
	});

	/**
	 * Steps replace rather than push: Back should leave the brief, not crawl
	 * through every step someone clicked on the way in. Done here, from the
	 * store, rather than at each call site — a step change made deep inside a
	 * component (Export's "Review it first") must update the URL too, or a
	 * refresh lands somewhere else.
	 */
	$effect(() => {
		const step = briefStore.step;
		const briefId = briefStore.activeBriefId;
		if (!ready || view !== 'wizard' || !briefId) return;
		untrack(() => {
			if (readPosition(page.url).step !== step) replace({ view: 'wizard', briefId, step });
		});
	});

	function openBrief(id: string) {
		briefStore.openBrief(id);
		view = 'wizard';
		go({ view: 'wizard', briefId: id, step: briefStore.step });
	}

	function jumpToStep(step: number) {
		briefStore.goToStep(step);
	}

	function toGallery() {
		view = 'gallery';
		go({ view: 'gallery', briefId: null, step: null });
	}

	function toImport() {
		view = 'import';
		go({ view: 'import', briefId: null, step: null });
	}
</script>

<Seo
	title="Surveyvor — Survey the project before you build it"
	description="An AI briefing tool for creative teams. Surveyvor uncovers the assumptions, contradictions and unresolved decisions hiding in a brief — before they become expensive problems."
/>

{#if ready}
	<!-- Once per session. Renders over the page, never instead of it. -->
	<Intro />
{/if}

{#if !ready}
	<!-- Server render and the first client frame: head tags only. -->
{:else if view === 'gallery' || view === 'import'}
	<!-- Gallery: full-bleed editorial opening, no chrome competing with the headline. -->
	<div class="relative min-h-screen">
		<div
			class="pointer-events-none absolute inset-x-0 top-0 h-[380px]"
			style="background:
				radial-gradient(90% 60% at 82% 0%, var(--c-accent-wash), transparent 70%),
				radial-gradient(70% 55% at 18% 0%, var(--c-warm-wash), transparent 72%)"
		></div>

		<!-- <main> so screen-reader users can jump straight to content; the gallery
		     previously had no landmark at all. -->
		<main class="relative mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
			<div class="flex items-center justify-between">
				<Logo />
				<div class="flex items-center gap-1.5">
					{#if data.gated}
						<LockButton />
					{/if}
				<button
					type="button"
					onclick={() => themeStore.toggle()}
					aria-label="Switch to {themeStore.current === 'light' ? 'dark' : 'light'} mode"
					class="flex h-11 w-11 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-accent/40 hover:text-accent lg:h-9 lg:w-9"
				>
					{#if themeStore.current === 'light'}
						<Moon size={15} />
					{:else}
						<Sun size={15} />
					{/if}
				</button>
				</div>
			</div>

			<header
				class="grid items-center md:grid-cols-[1fr_auto] {compactHero
					? 'mt-8 gap-6 md:mt-10 md:gap-10'
					: 'mt-12 gap-10 md:mt-16 md:gap-14'}"
			>
				<div>
					<h1
						class="font-display leading-[1.06] font-semibold tracking-[-0.03em] text-ink sm:leading-[1.04] sm:tracking-[-0.035em] {compactHero
							? 'text-[1.6rem] sm:text-[1.9rem] lg:text-[2.1rem]'
							: 'text-[2.05rem] sm:text-[2.9rem] lg:text-[3.4rem]'}"
					>
						Survey the project<br class={compactHero ? '' : 'hidden sm:block'} /> before you build it
					</h1>
					{#if !compactHero}
						<p class="mt-4 max-w-lg text-[0.98rem] leading-relaxed text-ink-soft sm:mt-5 sm:text-[1.02rem]">
							Surveyvor uncovers assumptions, contradictions, missing information and
							unresolved decisions — before they become expensive problems.
						</p>
					{/if}
				</div>

				{#if !compactHero}
					<!-- Supplied brand animation. SMIL loops on its own inside an <img>,
					     which keeps 120KB of markup out of the JS bundle. -->
					<div class="flex justify-center md:justify-end">
						<div class="anim-plate">
							<img
								src="/hero-anim.svg"
								alt=""
								aria-hidden="true"
								width="360"
								height="360"
								class="w-[240px] max-w-full sm:w-[300px] lg:w-[360px]"
							/>
						</div>
					</div>
				{/if}
			</header>

			<div class="border-t border-border {compactHero ? 'mt-8 pt-8 md:mt-10' : 'mt-16 pt-10'}">
				{#if view === 'import'}
					<ImportDocument oncancel={toGallery} onopen={openBrief} />
				{:else}
					<BriefsList onopen={openBrief} onuploaddoc={toImport} />
				{/if}
			</div>
		</main>
	</div>
{:else}
	<!-- Wizard: app shell. Persistent rail on the left, work on the right. -->
	<div class="min-h-screen lg:grid lg:grid-cols-[268px_1fr]">
		<aside
			class="sticky top-0 z-20 border-b border-border bg-surface-alt/85 backdrop-blur-xl lg:h-screen lg:border-r lg:border-b-0 lg:bg-surface-alt/40 lg:backdrop-blur-none print:hidden"
		>
			<!-- Mobile: a compact app bar. Vertical space is scarce, so back / title /
			     theme share one row and the rail sits directly beneath. -->
			<div class="px-4 pt-3 pb-2.5 lg:hidden">
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={toGallery}
						aria-label="All briefs"
						class="-ml-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft active:bg-ink/[0.06]"
					>
						<ChevronLeft size={20} />
					</button>

					<h2
						class="min-w-0 flex-1 truncate font-display text-[1.02rem] font-semibold tracking-[-0.015em] text-ink"
					>
						{briefStore.name}
					</h2>

					<button
						type="button"
						onclick={() => themeStore.toggle()}
						aria-label="Switch to {themeStore.current === 'light' ? 'dark' : 'light'} mode"
						class="-mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint active:bg-ink/[0.06]"
					>
						{#if themeStore.current === 'light'}
							<Moon size={17} />
						{:else}
							<Sun size={17} />
						{/if}
					</button>
				</div>

				<div class="mt-3">
					<Stepper current={briefStore.step} onjump={jumpToStep} />
					<div class="mt-1 flex justify-center">
						<SaveIndicator compact />
					</div>
				</div>
			</div>

			<!-- Desktop: the full rail. -->
			<div class="hidden h-full flex-col px-6 py-7 lg:flex">
				<div class="flex items-center justify-between">
					<Logo size={26} />
					<button
						type="button"
						onclick={() => themeStore.toggle()}
						aria-label="Switch to {themeStore.current === 'light' ? 'dark' : 'light'} mode"
						class="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-hover hover:text-accent"
					>
						{#if themeStore.current === 'light'}
							<Moon size={14} />
						{:else}
							<Sun size={14} />
						{/if}
					</button>
				</div>

				<button
					type="button"
					onclick={toGallery}
					class="mt-7 flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
				>
					<ChevronLeft size={13} />
					All briefs
				</button>

				<h2
					class="mt-2 font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.015em] text-ink"
				>
					{briefStore.name}
				</h2>

				<div class="mt-7">
					<StepNav current={briefStore.step} onjump={jumpToStep} />
				</div>

				<div class="mt-auto space-y-2 pt-8">
					<SaveIndicator />
					<p class="text-[0.66rem] font-medium tracking-[0.14em] text-ink-faint uppercase">
						Step {briefStore.step} of {totalSteps}
					</p>
				</div>
			</div>
		</aside>

		<main class="min-w-0">
			<!-- Extra bottom padding on small screens so the sticky bar never covers content. -->
			<div class="mx-auto max-w-3xl px-5 pt-8 pb-32 sm:px-10 sm:pt-12 lg:pb-14">
				{#key briefStore.step}
					<div class="rise">
						{#if briefStore.step === 1}
							<Step1Metadata />
						{:else if sectionKey}
							<StepSection {sectionKey} />
						{:else if briefStore.step === briefStore.surveyStep}
							<Step6Diagnose />
						{:else}
							<Step7Export />
						{/if}
					</div>
				{/key}

				<!-- Desktop: inline at the end of the flow. -->
				<nav
					class="mt-12 hidden items-center justify-between border-t border-border pt-6 lg:flex print:hidden"
				>
					<button
						type="button"
						onclick={() => jumpToStep(briefStore.step - 1)}
						disabled={briefStore.step === 1}
						class="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ArrowLeft size={16} />
						Back
					</button>

					{#if briefStore.step < totalSteps}
						<button
							type="button"
							onclick={() => jumpToStep(briefStore.step + 1)}
							class="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
						>
							{stepLabels[briefStore.step]}
							<ArrowRight size={16} />
						</button>
					{/if}
				</nav>
			</div>

			<!-- Mobile: pinned to the bottom, in thumb reach, clear of the home indicator. -->
			<nav class="safe-bottom fixed inset-x-0 bottom-0 z-30 lg:hidden print:hidden">
				<div
					class="flex items-center justify-between gap-3 border-t border-border bg-surface/85 px-5 py-3 backdrop-blur-xl"
				>
					<button
						type="button"
						onclick={() => jumpToStep(briefStore.step - 1)}
						disabled={briefStore.step === 1}
						class="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-ink-soft transition-colors active:bg-ink/[0.06] disabled:opacity-30"
					>
						<ArrowLeft size={17} />
						Back
					</button>

					{#if briefStore.step < totalSteps}
						<button
							type="button"
							onclick={() => jumpToStep(briefStore.step + 1)}
							class="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
						>
							{stepLabels[briefStore.step]}
							<ArrowRight size={17} />
						</button>
					{/if}
				</div>
			</nav>
		</main>
	</div>
{/if}

<!-- One instance for the whole app: any AI action awaits aiConsent.ensure(). -->
<AiFirstUseNotice />
