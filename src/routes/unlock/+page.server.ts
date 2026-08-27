import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	AUTH_COOKIE,
	isAuthConfigured,
	isCorrectPassword,
	isValidSession,
	sessionToken
} from '$lib/server/auth';
import { checkRateLimit } from '$lib/server/rateLimit';

export const load: PageServerLoad = ({ cookies }) => {
	// Nothing to unlock if no password is configured, or they're already in.
	if (!isAuthConfigured()) redirect(303, '/');
	if (isValidSession(cookies.get(AUTH_COOKIE))) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		// Rate limit the gate itself, or it becomes a brute-force target.
		let key = 'unlock';
		try {
			key = `unlock:${getClientAddress()}`;
		} catch {
			// fall through to the shared bucket
		}
		if (!(await checkRateLimit(key)).ok) {
			return fail(429, { error: 'Too many attempts. Wait a few minutes and try again.' });
		}

		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (!isCorrectPassword(password)) {
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
