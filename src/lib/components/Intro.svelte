<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { BLADE, BLADE_FILL, DISC, DISC_FILL, LETTERS, LOCKUP_VIEWBOX } from '$lib/logo-paths';

	/**
	 * The opening. Built from what the mark is — two blades in rotational
	 * symmetry — so the motion is the mark's own, not a template applied to it.
	 *
	 *   seed      a dot pulses at the centre (anticipation)
	 *   spin-in   the S bursts from the dot, spinning up on a spring and locking,
	 *             an arc trail drawn in its wake chases itself out
	 *   landing   the disc pops in behind it with squash and stretch, and the
	 *             signet wobbles once (follow-through)
	 *   throw     the signet tilts toward the empty space and springs back —
	 *             it is throwing the word
	 *   write-on  the wordmark is written left to right while each letter
	 *             springs up and lands with a little rotation
	 *   departure the lockup flies on a curve into its place in the header, and
	 *             the page blooms open from that exact point
	 *
	 * Nothing here fades. About 2.5 s, once per session, never blocking — the
	 * page renders underneath the whole time. Reduced motion skips it.
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
	// Hide the header's copy before anything paints, so the mark is only ever
	// on screen once. Cleared when the page starts to bloom around it.
	if (browser && playing) document.documentElement.classList.add('intro-running');

	let stage = $state<'play' | 'depart' | 'done'>(playing ? 'play' : 'done');
	let mark = $state<HTMLDivElement | undefined>(undefined);
	let flight = $state('');
	/** Where the page opens from: the header logo's centre, in viewport px. */
	let origin = $state('50% 50%');

	const DEPART_AT = 1620;
	const FLIGHT_MS = 560;
	const BLOOM_AT = DEPART_AT + 380;
	const DONE_AT = BLOOM_AT + 560;

	onMount(() => {
		if (!playing) return;
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {
			// No session storage: it will simply play again next time.
		}

		const timers = [
			setTimeout(() => {
				const target = document.querySelector<HTMLElement>('[data-logo-home] svg');
				if (mark && target) {
					// FLIP: measure the header logo and fly this one onto it.
					const from = mark.getBoundingClientRect();
					const to = target.getBoundingClientRect();
					const scale = to.width / from.width;
					const dx = to.left + to.width / 2 - (from.left + from.width / 2);
					const dy = to.top + to.height / 2 - (from.top + from.height / 2);
					flight = `translate(${dx}px, ${dy}px) scale(${scale})`;
					origin = `${to.left + to.width / 2}px ${to.top + to.height / 2}px`;
				} else if (mark) {
					// No logo on this screen (phone wizard): tuck into the app bar.
					const from = mark.getBoundingClientRect();
					const scale = 26 / from.height;
					flight = `translate(${24 + (from.width * scale) / 2 - (from.left + from.width / 2)}px, ${34 - (from.top + from.height / 2)}px) scale(${scale})`;
					origin = '24px 34px';
				}
				stage = 'depart';
			}, DEPART_AT),
			setTimeout(() => document.documentElement.classList.remove('intro-running'), BLOOM_AT),
			setTimeout(() => (stage = 'done'), DONE_AT)
		];

		return () => {
			timers.forEach(clearTimeout);
			document.documentElement.classList.remove('intro-running');
		};
	});
</script>

{#if stage !== 'done'}
	<div class="intro" class:depart={stage === 'depart'} style:--origin={origin} aria-hidden="true">
		<div class="mark" bind:this={mark} style:transform={stage === 'depart' ? flight : undefined}>
			<svg viewBox={LOCKUP_VIEWBOX} xmlns="http://www.w3.org/2000/svg">
				<defs>
					<!-- The write-on: letters are clipped by a box that opens left to right. -->
					<clipPath id="intro-wipe">
						<rect class="wipe" x="178" y="-20" width="740" height="220" />
					</clipPath>
				</defs>

				<!-- Seed dot, then the disc landing with squash and stretch. -->
				<circle class="seed" cx="85.9" cy="85.96" r="7" fill={BLADE_FILL} />
				<path class="disc" fill={DISC_FILL} d={DISC} />

				<!-- Arc trail drawn in the wake of the spin; it chases itself out. -->
				<circle class="trail" cx="85.9" cy="85.96" r="98" pathLength="1" />

				<!-- The signet: spins up, locks, wobbles, then throws the word. -->
				<g class="signet">
					<path fill={BLADE_FILL} d={BLADE} />
				</g>

				<g class="word" clip-path="url(#intro-wipe)">
					{#each LETTERS as d, i}
						<path {d} style:animation-delay="{900 + i * 52}ms" />
					{/each}
				</g>
			</svg>
		</div>
	</div>
{/if}

<style>
	/* Registered so the bloom radius can be transitioned, not stepped. */
	@property --r {
		syntax: '<length-percentage>';
		inherits: false;
		initial-value: 0px;
	}

	/* Springs, as easing curves: overshoot and settle, never a plain ease. */
	:root {
		--spring: linear(0, 0.26 8.5%, 0.64 18%, 0.94 30%, 1.07 42%, 1.02 56%, 0.985 68%, 1.005 82%, 1);
		--spring-big: linear(0, 0.38 14%, 0.83 30%, 1.06 46%, 0.975 60%, 1.012 76%, 0.997 90%, 1);
	}

	.intro {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		background: var(--c-bg);
		pointer-events: none;
		--r: 0px;
		/* An inverse circle: the page shows through a hole that grows from the
		   point the mark lands on. Transitioned via the registered property. */
		mask-image: radial-gradient(circle at var(--origin), transparent calc(var(--r) - 1px), #000 var(--r));
		-webkit-mask-image: radial-gradient(circle at var(--origin), transparent calc(var(--r) - 1px), #000 var(--r));
	}
	.intro.depart {
		--r: 170vmax;
		transition: --r 0.56s cubic-bezier(0.7, 0, 0.3, 1) 0.38s;
	}

	.mark {
		width: min(74vw, 23rem);
		color: var(--c-ink);
		transform-origin: center center;
		will-change: transform;
	}
	.mark svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	/* The departure flies on a curve: x eases out early, y eases out late. */
	.depart .mark {
		transition: transform 0.56s cubic-bezier(0.3, 0.9, 0.25, 1);
	}

	.seed {
		transform-box: view-box;
		transform-origin: 85.9px 85.96px;
		transform: scale(0);
		animation:
			seed-in 0.16s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
			seed-out 0.18s cubic-bezier(0.6, 0, 0.8, 0.4) 0.18s forwards;
	}

	.signet {
		transform-box: view-box;
		transform-origin: 85.9px 85.96px;
		transform: rotate(-320deg) scale(0.2);
		animation:
			spin-in 0.6s var(--spring-big) 0.14s forwards,
			wobble 0.3s ease-out 0.74s,
			throw 0.4s var(--spring) 0.82s;
	}

	.disc {
		transform-box: view-box;
		transform-origin: 85.9px 85.96px;
		transform: scale(0);
		animation: land 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.58s forwards;
	}

	.trail {
		fill: none;
		stroke: var(--c-accent);
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-dasharray: 0.55 1;
		stroke-dashoffset: 0.55;
		transform-box: view-box;
		transform-origin: 85.9px 85.96px;
		transform: rotate(-130deg);
		/* Drawn by the head advancing, then removed by the tail catching up. */
		animation:
			trail-draw 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards,
			trail-spin 0.6s var(--spring-big) 0.14s forwards,
			trail-out 0.32s cubic-bezier(0.6, 0, 0.8, 0.4) 0.66s forwards;
	}

	.wipe {
		transform-box: fill-box;
		transform-origin: left center;
		transform: scaleX(0);
		animation: wipe 0.6s cubic-bezier(0.55, 0, 0.3, 1) 0.88s forwards;
	}
	.word path {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		transform: translateY(20px) rotate(-7deg) scaleY(0.82);
		animation: land-letter 0.5s var(--spring) forwards;
	}

	@keyframes seed-in {
		to {
			transform: scale(1);
		}
	}
	@keyframes seed-out {
		to {
			transform: scale(0);
		}
	}
	@keyframes spin-in {
		to {
			transform: rotate(0deg) scale(1);
		}
	}
	/* Follow-through: the lock has a little give. */
	@keyframes wobble {
		0% {
			transform: rotate(0deg) scale(1);
		}
		35% {
			transform: rotate(4deg) scale(1.02, 0.98);
		}
		70% {
			transform: rotate(-2deg) scale(0.99, 1.01);
		}
		100% {
			transform: rotate(0deg) scale(1);
		}
	}
	/* The throw: wind up away from the word, then snap toward it. */
	@keyframes throw {
		0% {
			transform: rotate(0deg) scale(1);
		}
		30% {
			transform: rotate(-14deg) scale(0.96, 1.04);
		}
		100% {
			transform: rotate(0deg) scale(1);
		}
	}
	@keyframes land {
		0% {
			transform: scale(0);
		}
		55% {
			transform: scale(1.14, 0.9);
		}
		78% {
			transform: scale(0.96, 1.05);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes trail-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes trail-spin {
		to {
			transform: rotate(0deg);
		}
	}
	@keyframes trail-out {
		to {
			stroke-dashoffset: -0.55;
		}
	}
	@keyframes wipe {
		to {
			transform: scaleX(1);
		}
	}
	@keyframes land-letter {
		to {
			transform: translateY(0) rotate(0deg) scaleY(1);
		}
	}
</style>
