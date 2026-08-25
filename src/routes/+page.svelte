<script lang="ts">
	import { ArrowLeft, ArrowRight, ChevronLeft, Moon, Sun } from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import StepNav from '$lib/components/StepNav.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import BriefsList from '$lib/components/BriefsList.svelte';
	import ImportDocument from '$lib/components/ImportDocument.svelte';
	import Step1Metadata from '$lib/components/steps/Step1Metadata.svelte';
	import Step2Objectives from '$lib/components/steps/Step2Objectives.svelte';
	import Step3Audience from '$lib/components/steps/Step3Audience.svelte';
	import Step4Deliverables from '$lib/components/steps/Step4Deliverables.svelte';
	import Step5Constraints from '$lib/components/steps/Step5Constraints.svelte';
	import Step6Diagnose from '$lib/components/steps/Step6Diagnose.svelte';
	import Step7Export from '$lib/components/steps/Step7Export.svelte';
	import { briefStore, TOTAL_STEPS } from '$lib/stores/brief.svelte';
	import { STEP_LABELS } from '$lib/types';

	const steps = [
		Step1Metadata,
		Step2Objectives,
		Step3Audience,
		Step4Deliverables,
		Step5Constraints,
		Step6Diagnose,
		Step7Export
	];

	let view = $state<'gallery' | 'wizard' | 'import'>('gallery');

	let CurrentStep = $derived(steps[briefStore.step - 1]);

	function openBrief(id: string) {
		briefStore.openBrief(id);
		view = 'wizard';
	}
</script>

<svelte:head>
	<title>Unfold AI</title>
</svelte:head>

{#if view === 'gallery' || view === 'import'}
	<!-- Gallery: full-bleed editorial opening, no chrome competing with the headline. -->
	<div class="relative min-h-screen">
		<div
			class="pointer-events-none absolute inset-x-0 top-0 h-[380px]"
			style="background: radial-gradient(120% 70% at 78% 0%, var(--c-accent-wash), transparent 70%)"
		></div>

		<!-- <main> so screen-reader users can jump straight to content; the gallery
		     previously had no landmark at all. -->
		<main class="relative mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
			<div class="flex items-center justify-between">
				<Logo />
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

			<header class="mt-12 grid items-center gap-10 md:mt-16 md:grid-cols-[1fr_auto] md:gap-14">
				<div>
					<h1
						class="font-display text-[2.05rem] leading-[1.06] font-semibold tracking-[-0.03em] text-ink sm:text-[2.9rem] sm:leading-[1.04] sm:tracking-[-0.035em] lg:text-[3.4rem]"
					>
						Figure out what the<br class="hidden sm:block" /> project actually is
					</h1>
					<p class="mt-4 max-w-lg text-[0.98rem] leading-relaxed text-ink-soft sm:mt-5 sm:text-[1.02rem]">
						Turn a messy client conversation into a brief everyone agrees on — surfacing what's
						vague, contradictory or still unknown before anyone starts designing.
					</p>
				</div>

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
			</header>

			<div class="mt-16 border-t border-border pt-10">
				{#if view === 'import'}
					<ImportDocument oncancel={() => (view = 'gallery')} onopen={openBrief} />
				{:else}
					<BriefsList onopen={openBrief} onuploaddoc={() => (view = 'import')} />
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
						onclick={() => (view = 'gallery')}
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
					<Stepper current={briefStore.step} onjump={(step) => briefStore.goToStep(step)} />
				</div>
			</div>

			<!-- Desktop: the full rail. -->
			<div class="hidden h-full flex-col px-6 py-7 lg:flex">
				<div class="flex items-center justify-between">
					<Logo size={30} />
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
					onclick={() => (view = 'gallery')}
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
					<StepNav current={briefStore.step} onjump={(step) => briefStore.goToStep(step)} />
				</div>

				<div class="mt-auto pt-8">
					<p class="text-[0.66rem] font-medium tracking-[0.14em] text-ink-faint uppercase">
						Step {briefStore.step} of {TOTAL_STEPS}
					</p>
				</div>
			</div>
		</aside>

		<main class="min-w-0">
			<!-- Extra bottom padding on small screens so the sticky bar never covers content. -->
			<div class="mx-auto max-w-3xl px-5 pt-8 pb-32 sm:px-10 sm:pt-12 lg:pb-14">
				{#key briefStore.step}
					<div class="rise">
						<CurrentStep />
					</div>
				{/key}

				<!-- Desktop: inline at the end of the flow. -->
				<nav
					class="mt-12 hidden items-center justify-between border-t border-border pt-6 lg:flex print:hidden"
				>
					<button
						type="button"
						onclick={() => briefStore.back()}
						disabled={briefStore.step === 1}
						class="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ArrowLeft size={16} />
						Back
					</button>

					{#if briefStore.step < TOTAL_STEPS}
						<button
							type="button"
							onclick={() => briefStore.next()}
							class="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
						>
							{STEP_LABELS[briefStore.step]}
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
						onclick={() => briefStore.back()}
						disabled={briefStore.step === 1}
						class="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-ink-soft transition-colors active:bg-ink/[0.06] disabled:opacity-30"
					>
						<ArrowLeft size={17} />
						Back
					</button>

					{#if briefStore.step < TOTAL_STEPS}
						<button
							type="button"
							onclick={() => briefStore.next()}
							class="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
						>
							{STEP_LABELS[briefStore.step]}
							<ArrowRight size={17} />
						</button>
					{/if}
				</div>
			</nav>
		</main>
	</div>
{/if}
