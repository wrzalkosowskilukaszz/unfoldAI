import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	AUTH_COOKIE,
	isAuthConfigured,
	isCorrectPassword,
	isValidSession,
	sessionToken
} from '$lib/server/auth';
import { AUTH_ATTEMPT_LIMIT, checkRateLimit } from '$lib/server/rateLimit';

export const load: PageServerLoad = ({ cookies }) => {
	// Nothing to unlock if no password is configured, or they're already in.
	if (!isAuthConfigured()) redirect(303, '/');
	if (isValidSession(cookies.get(AUTH_COOKIE))) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	/**
	 * Re-locks this browser. Without it, unlocking a borrowed or shared machine
	 * left it open for the full thirty-day cookie life with no way back.
	 */
	lock: async ({ cookies }) => {
		cookies.delete(AUTH_COOKIE, { path: '/' });
		redirect(303, '/unlock');
	},

	// Named, not default: SvelteKit forbids a default action alongside named
	// ones, and adding `lock` beside a default silently 500s every login.
	unlock: async ({ request, cookies, getClientAddress, url }) => {
		// Rate limit the gate itself, or it becomes a brute-force target.
		let key = 'unlock';
		try {
			key = `unlock:${getClientAddress()}`;
		} catch {
			// fall through to the shared bucket
		}
		if (!(await checkRateLimit(key, AUTH_ATTEMPT_LIMIT)).ok) {
			return fail(429, { error: 'Too many attempts. Wait a few minutes and try again.' });
		}

		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (!isCorrectPassword(password)) {
			// Logged so a burst of these is visible. No password material, ever —
			// not even its length, which would narrow a guess.
			console.warn(JSON.stringify({ type: 'auth', event: 'failed_attempt', key }));
			return fail(401, { error: 'That password is not right.' });
		}

		cookies.set(AUTH_COOKIE, sessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, '/');
	}
};
