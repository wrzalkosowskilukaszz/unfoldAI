<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { BLADE, BLADE_FILL, DISC, DISC_FILL, LETTERS, LOCKUP_VIEWBOX } from '$lib/logo-paths';

	/**
	 * The opening: a surveyor's sight line draws across the screen, travels the
	 * outline of the mark so the two blades appear from the line itself, the
	 * fill floods in, the wordmark resolves letter by letter, the whole thing
	 * gives one physical settle, then flies into the header and becomes the
	 * real logo. About two seconds, once per session, never blocking — the
	 * page renders underneath the whole time.
	 *
	 * Reduced-motion users and anyone reloading in the same session skip it.
	 */
	const KEY = 'surveyvor-intro-seen';

	function shouldPlay(): boolean {
		if (!browser) return false;
		try {
			if (sessionStorage.getItem(KEY)) return false;
		} catch {
			return false;
		}
		return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const playing = shouldPlay();
	// Hide the real header logo before anything paints, so the mark is only
	// ever on screen once. Cleared at the handoff, or immediately if we skip.
	if (browser && playing) document.documentElement.classList.add('intro-running');

	let stage = $state<'drawing' | 'flying' | 'done'>(playing ? 'drawing' : 'done');
	let mark = $state<HTMLDivElement | undefined>(undefined);
	let flight = $state('');

	/** The moment the settle ends and the flight to the header begins. */
	const HANDOFF_AT = 1550;
	const FLIGHT_MS = 600;

	onMount(() => {
		if (!playing) return;
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {
			// No session storage: it will simply play again next time.
		}

		const t1 = setTimeout(() => {
			const target = document.querySelector<HTMLElement>('[data-logo-home] svg');
			if (mark && target) {
				// FLIP: measure where the header logo sits and animate this one onto it.
				const from = mark.getBoundingClientRect();
				const to = target.getBoundingClientRect();
				const scale = to.width / from.width;
				const dx = to.left + to.width / 2 - (from.left + from.width / 2);
				const dy = to.top + to.height / 2 - (from.top + from.height / 2);
				flight = `translate(${dx}px, ${dy}px) scale(${scale})`;
			} else {
				// No logo on this screen (phone wizard): recede in place instead.
				flight = 'scale(0.92)';
			}
			stage = 'flying';
		}, HANDOFF_AT);

		const t2 = setTimeout(() => {
			stage = 'done';
			document.documentElement.classList.remove('intro-running');
		}, HANDOFF_AT + FLIGHT_MS);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			document.documentElement.classList.remove('intro-running');
		};
	});
</script>

{#if stage !== 'done'}
	<div class="intro" class:flying={stage === 'flying'} aria-hidden="true">
		<div class="line"></div>

		<div class="mark" bind:this={mark} style:transform={stage === 'flying' ? flight : undefined}>
			<svg viewBox={LOCKUP_VIEWBOX} xmlns="http://www.w3.org/2000/svg">
				<path class="disc" fill={DISC_FILL} d={DISC} />
				<path class="fill" fill={BLADE_FILL} d={BLADE} />
				<path class="trace" d={BLADE} pathLength="1" />
				<g class="word">
					{#each LETTERS as d, i}
						<path {d} style:animation-delay="{880 + i * 55}ms" />
					{/each}
				</g>
			</svg>
		</div>
	</div>
{/if}

<style>
	.intro {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		background: var(--c-bg);
		pointer-events: none;
		transition: background-color 0.45s ease 0.1s;
	}
	.intro.flying {
		background-color: transparent;
	}

	/* The sight line: a hairline that extends across the whole screen from the
	   left, then gives way once the mark has taken its fill. */
	.line {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: var(--c-accent);
		opacity: 0.55;
		transform-origin: left center;
		transform: scaleX(0);
		animation:
			sweep 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.05s forwards,
			vanish 0.3s ease-out 0.9s forwards;
	}

	.mark {
		width: min(72vw, 22rem);
		color: var(--c-ink);
		transform-origin: center center;
		will-change: transform;
		animation: settle 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 1.2s both;
	}
	.mark svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.flying .mark {
		animation: none;
		transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* The line travels the outline of the mark: because both blades are one
	   closed path, drawing its stroke is the line bending into the top blade,
	   crossing, and mirroring into the bottom one. */
	.trace {
		fill: none;
		stroke: var(--c-accent);
		stroke-width: 1.6;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation:
			draw 0.65s cubic-bezier(0.65, 0, 0.35, 1) 0.32s forwards,
			vanish 0.35s ease-out 1.05s forwards;
	}
	.fill {
		opacity: 0;
		animation: appear 0.35s ease-out 0.85s forwards;
	}
	.disc {
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		transform: scale(0.88);
		animation: bloom 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.78s forwards;
	}
	.word path {
		opacity: 0;
		transform: translateY(14px);
		animation: rise 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	@keyframes sweep {
		to {
			transform: scaleX(1);
		}
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes appear {
		to {
			opacity: 1;
		}
	}
	@keyframes bloom {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@keyframes rise {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes vanish {
		to {
			opacity: 0;
		}
	}
	/* The settle from direction C: a breath of overshoot as the mark locks. */
	@keyframes settle {
		from {
			transform: scale(0.97);
		}
		to {
			transform: scale(1);
		}
	}
</style>
