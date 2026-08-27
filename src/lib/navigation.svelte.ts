import { browser } from '$app/environment';
import { pushState, replaceState } from '$app/navigation';
import { briefStore } from '$lib/stores/brief.svelte';

/**
 * Puts the app's position in the URL.
 *
 * Query params rather than real routes (`/brief/[id]/[step]`) on purpose: brief
 * ids are local UUIDs that exist only in one browser, so a "shareable" path
 * would be a link nobody else can open. What the URL is actually worth here is
 * a back button that means something and a refresh that lands where you were —
 * both of which params give without restructuring every route.
 *
 * The URL is the source of truth for navigation. Explicit moves push to it, and
 * one reader applies whatever the URL says — which is what makes the browser's
 * own back and forward work for free.
 */

export type View = 'gallery' | 'wizard' | 'import';

export interface Position {
	view: View;
	briefId: string | null;
	step: number | null;
}

/** Parse a position out of a URL, ignoring anything that no longer exists. */
export function readPosition(url: URL): Position {
	if (url.searchParams.get('new') === 'doc') {
		return { view: 'import', briefId: null, step: null };
	}

	const briefId = url.searchParams.get('b');
	if (!briefId || !briefStore.briefs[briefId]) {
		// A stale or hand-edited link must land somewhere sensible, not on a
		// blank wizard bound to a brief that was deleted.
		return { view: 'gallery', briefId: null, step: null };
	}

	const raw = Number(url.searchParams.get('s'));
	const step = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
	return { view: 'wizard', briefId, step };
}

function toUrl(p: Position): string {
	if (p.view === 'import') return '?new=doc';
	if (p.view === 'wizard' && p.briefId) return `?b=${encodeURIComponent(p.briefId)}&s=${p.step ?? 1}`;
	return '/';
}

/** A new entry, so Back returns to where they were. */
export function go(p: Position) {
	if (!browser) return;
	pushState(toUrl(p), {});
}

/** Same entry — for step changes that should not each be a history stop. */
export function replace(p: Position) {
	if (!browser) return;
	replaceState(toUrl(p), {});
}
