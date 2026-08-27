/**
 * Stands in for SvelteKit's $app/navigation. readPosition is pure and is what
 * the tests exercise; the push/replace side is verified in the browser, since
 * it only means anything against a real history stack.
 */
export function pushState(_url: string, _state: unknown) {}
export function replaceState(_url: string, _state: unknown) {}
export function goto(_url: string) {
	return Promise.resolve();
}
