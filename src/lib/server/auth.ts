import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * A single shared password protecting the whole deployment.
 *
 * This is not user accounts — it is the minimum needed to put the app on a
 * public URL without handing strangers a spend button on the Anthropic account.
 * Every AI route costs real money per call, so an open deployment is an open tab.
 *
 * Set APP_PASSWORD to enable. Leave it unset and the app stays open, which is
 * what you want locally.
 */
export const AUTH_COOKIE = 'unfold_access';

export function isAuthConfigured(): boolean {
	return Boolean(env.APP_PASSWORD?.trim());
}

/**
 * The cookie value is derived from the password, so it cannot be forged without
 * knowing it — and rotating APP_PASSWORD invalidates every existing session.
 */
export function sessionToken(): string {
	return createHash('sha256')
		.update(`unfold-access-v1:${env.APP_PASSWORD ?? ''}`)
		.digest('hex');
}

export function isValidSession(cookieValue: string | undefined): boolean {
	if (!isAuthConfigured()) return true;
	if (!cookieValue) return false;
	return safeEqual(cookieValue, sessionToken());
}

export function isCorrectPassword(candidate: string): boolean {
	const expected = env.APP_PASSWORD ?? '';
	if (!expected) return false;
	// Hash both sides first so the comparison length never leaks the real length.
	const a = createHash('sha256').update(candidate).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}

function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}
