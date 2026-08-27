/**
 * Stands in for SvelteKit's $env/dynamic/private.
 *
 * State lives on globalThis rather than in the module, because tests call
 * vi.resetModules() to force auth.ts to re-read the password — that would
 * otherwise hand the test a fresh, empty env and silently lose what it set.
 */
const KEY = Symbol.for('surveyvor.test.env');
const g = globalThis as Record<symbol, unknown>;
g[KEY] ??= {} as Record<string, string | undefined>;

export const env = g[KEY] as Record<string, string | undefined>;
