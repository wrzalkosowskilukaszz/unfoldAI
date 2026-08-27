import type { LayoutServerLoad } from './$types';
import { isAuthConfigured } from '$lib/server/auth';

/**
 * The lock control only makes sense when there is a gate to re-engage — locally
 * there is no password, so showing it would offer an action that does nothing.
 */
export const load: LayoutServerLoad = () => ({ gated: isAuthConfigured() });
