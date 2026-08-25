<script lang="ts">
	import { enhance } from '$app/forms';
	import { Lock, ArrowRight } from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);

	/** Where access requests land. Change this to your own address. */
	const ACCESS_EMAIL = 'wrzalkosowski.lukasz@gmail.com';

	function focusInput(node: HTMLInputElement) {
		node.focus();
	}
</script>

<svelte:head>
	<title>Unfold AI</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center px-6">
	<div class="w-full max-w-sm">
		<Logo />

		<h1 class="mt-9 font-display text-2xl font-semibold tracking-tight text-ink">
			This one's private
		</h1>
		<p class="mt-2 text-sm leading-relaxed text-ink-soft">
			Enter the password to continue.
		</p>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="mt-7 space-y-3"
		>
			<div class="relative">
				<span
					class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
				>
					<Lock size={16} />
				</span>
				<input
					type="password"
					name="password"
					autocomplete="current-password"
					required
					use:focusInput
					placeholder="Password"
					class="min-h-12 w-full rounded-xl border border-border bg-surface-alt/60 pr-4 pl-11 text-sm text-ink placeholder-ink-faint outline-none focus:border-accent"
				/>
			</div>

			{#if form?.error}
				<p class="text-sm text-contradiction">{form.error}</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent transition hover:-translate-y-0.5 disabled:opacity-60"
			>
				{submitting ? 'Checking...' : 'Unlock'}
				{#if !submitting}<ArrowRight size={16} />{/if}
			</button>
		</form>

		<!--
			Access requests go to a mailto for now: it works the moment this deploys,
			with no email service or database to stand up. Swap the href for a real
			capture endpoint when there's enough demand to justify one.
		-->
		<p class="mt-6 border-t border-border pt-5 text-sm text-ink-soft">
			Don't have access yet?
			<a
				href="mailto:{ACCESS_EMAIL}?subject=Unfold%20AI%20—%20early%20access&body=Hi%2C%20I%27d%20like%20early%20access%20to%20Unfold%20AI.%0A%0AWhat%20I%27d%20use%20it%20for%3A"
				class="font-semibold text-accent underline-offset-2 hover:underline"
			>
				Request early access
			</a>
		</p>
	</div>
</div>
