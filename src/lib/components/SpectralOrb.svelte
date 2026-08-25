<script lang="ts" module>
	let instanceCount = 0;
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Rings of spacetime under quadrupole gravitational strain.
	 *
	 * Each ring is a circle; a passing wave stretches it along one axis while
	 * compressing the perpendicular one (h → scale(1+h, 1-h)), which is the
	 * actual signature of a gravitational wave rather than a generic pulse.
	 * Strain arrives at outer rings later (phase lags with radius), so the
	 * distortion visibly travels outward, and its amplitude falls off with
	 * distance the way radiation does.
	 *
	 * The chaos comes from superposing two sources whose frequencies sit at an
	 * irrational ratio (golden). They never realign, so the combined pattern has
	 * no loop the eye can catch.
	 *
	 * `chaos: 1` — full two-source interference. The messy conversation.
	 * `chaos: 0` — near-still concentric rings. The resolved brief.
	 */
	let {
		size = 230,
		chaos = 1,
		strokeWidth = 2.4,
		glow = 0.22
	}: { size?: number; chaos?: number; strokeWidth?: number; glow?: number } = $props();

	/**
	 * Baseline geometry: at chaos the rings are already eccentric and off-centre,
	 * which is what gives the tangled look. The wave strain then modulates on top
	 * of that. At chaos 0 they collapse back to true concentric circles.
	 * Radii stay well inside the viewBox so peak strain never clips.
	 */
	const RINGS = [
		{ r: 30, rot: 0, ecc: 0.2, dx: 1.1, dy: -1.4, op: 0.55 },
		{ r: 26.5, rot: 24, ecc: -0.24, dx: -1.7, dy: 1.2, op: 0.64 },
		{ r: 22.5, rot: 52, ecc: 0.28, dx: 1.9, dy: 1.7, op: 0.72 },
		{ r: 18.5, rot: 78, ecc: -0.22, dx: -1.2, dy: -2, op: 0.8 },
		{ r: 14.5, rot: 104, ecc: 0.26, dx: 1.5, dy: 0.8, op: 0.87 },
		{ r: 10.5, rot: 133, ecc: -0.18, dx: -0.9, dy: 1.4, op: 0.93 },
		{ r: 7, rot: 160, ecc: 0.14, dx: 0.7, dy: -1, op: 1 }
	];

	const W1 = 0.42; // primary source, rad/s
	const PHI = 1.618033988749; // irrational ratio → the two never resynchronise
	const W2 = W1 * PHI;
	const K = 0.055; // wavenumber: how much phase lags per unit radius
	const H0 = 0.18; // peak strain — beyond ~0.2 the small inner rings pinch into slivers

	let wrap: HTMLDivElement;
	let group: SVGGElement;
	let nodes: SVGEllipseElement[] = [];

	// SVG gradient ids are document-global. Two orbs sharing one id makes the
	// second resolve against the first — and if the first is display:none, the
	// visible one renders with no stroke at all.
	const gradientId = `orb-spectral-${instanceCount++}`;

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (reduced.matches) return;

		let raf = 0;
		let visible = true;
		const started = performance.now();

		const io = new IntersectionObserver(([e]) => {
			visible = e.isIntersecting;
			if (visible && !raf) raf = requestAnimationFrame(frame);
		});
		io.observe(wrap);

		function frame(now: number) {
			if (!visible) {
				raf = 0;
				return;
			}
			const t = (now - started) / 1000;
			// Props are reactive getters, so this always reads the live value —
			// the meter can resolve mid-flight without restarting the loop.
			const c = chaos;

			for (let i = 0; i < nodes.length; i++) {
				const ring = RINGS[i];
				const el = nodes[i];
				if (!el) continue;

				// Outward-travelling wavefronts from two incommensurate sources.
				const p1 = W1 * t - K * ring.r;
				const p2 = W2 * t - K * 1.37 * ring.r + 1.3;

				// Radiation weakens with distance, but gently — a true 1/r falloff
				// distorts the tiny inner rings far more than the large outer ones,
				// which hides the travelling wave instead of showing it.
				const falloff = Math.pow(12 / ring.r, 0.25);
				const h = c * H0 * falloff * (Math.cos(p1) + 0.68 * Math.cos(p2)) * 0.52;

				// Second polarisation shows up as the strain axis itself rotating.
				const twist = c * 26 * Math.sin(p1 * 0.5 + p2 * 0.23);
				// Slow non-uniform drift — eased, so it never reads as a motor.
				const drift = t * 5.5 + c * 9 * Math.sin(W2 * t * 0.31 + i);

				el.style.transform = `rotate(${ring.rot + twist + drift}deg) scale(${1 + h}, ${1 - h})`;
			}

			raf = requestAnimationFrame(frame);
		}

		raf = requestAnimationFrame(frame);
		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
		};
	});
</script>

<div bind:this={wrap} class="relative" style="width: {size}px; height: {size}px">
	<div
		class="absolute inset-0 rounded-full blur-2xl"
		style="background: radial-gradient(circle, var(--c-accent) 0%, transparent 66%); opacity: {glow}; animation: breathe 6s ease-in-out infinite"
	></div>

	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		class="relative overflow-visible"
	>
		<defs>
			<linearGradient
				id={gradientId}
				x1="4"
				y1="4"
				x2="96"
				y2="96"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0%" stop-color="#5B3DF5" />
				<stop offset="40%" stop-color="#A78BFA" />
				<stop offset="72%" stop-color="#F45BC4" />
				<stop offset="100%" stop-color="#3DD6F5" />
			</linearGradient>
		</defs>

		<g bind:this={group}>
			{#each RINGS as ring, i}
				<!-- Baseline tangle is reactive to `chaos`; the frame loop only ever
				     writes `transform`, so resolving the meter animates smoothly. -->
				<ellipse
					bind:this={nodes[i]}
					cx={50 + ring.dx * chaos * 2}
					cy={50 + ring.dy * chaos * 2}
					rx={ring.r * (1 + ring.ecc * chaos)}
					ry={ring.r * (1 - ring.ecc * chaos)}
					stroke="url(#{gradientId})"
					stroke-width={strokeWidth}
					opacity={ring.op}
					vector-effect="non-scaling-stroke"
					style="transform-origin: 50px 50px; transform: rotate({ring.rot}deg); transition: cx 900ms ease, cy 900ms ease, rx 900ms ease, ry 900ms ease, opacity 900ms ease"
				/>
			{/each}
		</g>
	</svg>
</div>
