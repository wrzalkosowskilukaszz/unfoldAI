import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { errorId, reportError } from '$lib/server/observability';
import { checkRateLimit } from '$lib/server/rateLimit';
import { AUTH_COOKIE, isAuthConfigured, isValidSession } from '$lib/server/auth';

const UNLOCK_PATH = '/unlock';
/**
 * Reachable without the beta password. The legal pages have to be public — a
 * privacy policy nobody can read is not a privacy policy — and the unlock page
 * is what a visitor from LinkedIn or a portfolio link lands on.
 */
const PUBLIC_PATHS = new Set([UNLOCK_PATH, '/privacy', '/terms']);

/**
 * Guards every request in one place, so a new route can't accidentally ship
 * without protection.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isApi = pathname.startsWith('/api/');

	// 1. Access gate. Only active when APP_PASSWORD is set.
	if (isAuthConfigured() && !PUBLIC_PATHS.has(pathname)) {
		if (!isValidSession(event.cookies.get(AUTH_COOKIE))) {
			if (isApi) {
				return new Response(JSON.stringify({ message: 'Session expired. Please unlock again.' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			redirect(303, UNLOCK_PATH);
		}
	}

	// 2. Spend protection on the AI routes.
	if (isApi) {
		let key = 'unknown';
		try {
			key = event.getClientAddress();
		} catch {
			// Some adapters can't resolve an address; fall through to the shared bucket.
		}

		const { ok, retryAfterSeconds } = await checkRateLimit(key);
		if (!ok) {
			return new Response(
				JSON.stringify({
					message: `That's a lot of requests. Please wait about ${Math.ceil(
						retryAfterSeconds / 60
					)} minute(s) and try again.`
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': String(retryAfterSeconds)
					}
				}
			);
		}
	}

	const response = await resolve(event);

	// Headers CSP doesn't cover. Sent on every response, including API errors.
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);
	if (isApi) {
		response.headers.set('Cache-Control', 'no-store');
	}

	return response;
};

/**
 * Every unhandled server error gets an id that is both logged and shown to the
 * user, so a bug report carries something greppable instead of "it broke".
 */
export const handleError: HandleServerError = ({ error, event, status }) => {
	const id = errorId();
	reportError(error, {
		id,
		where: 'server',
		route: event.url.pathname,
		method: event.request.method,
		status
	});

	return {
		message:
			status === 404
				? 'That page does not exist.'
				: 'Something went wrong on our side. Your briefs are safe in this browser.',
		id
	};
};
