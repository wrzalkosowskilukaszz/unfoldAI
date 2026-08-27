import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

/**
 * Deliberately does NOT load the SvelteKit plugin. These are unit tests of the
 * store and pure helpers; pulling in the full Kit pipeline would drag in the
 * router and $app/* modules for no benefit and a lot of fragility.
 */
export default defineConfig({
	plugins: [svelte({ compilerOptions: { runes: true } })],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$app/environment': path.resolve('./tests/mocks/app-environment.ts'),
			'$env/dynamic/private': path.resolve('./tests/mocks/env-private.ts'),
			'$app/navigation': path.resolve('./tests/mocks/app-navigation.ts')
		},
		conditions: ['browser']
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/**/*.test.ts'],
		globals: true
	}
});
