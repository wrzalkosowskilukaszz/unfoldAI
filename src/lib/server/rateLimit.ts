/**
 * Sliding-window rate limiter for the AI routes.
 *
 * Every one of these endpoints spends real money per call, so an unprotected
 * public deployment is an open tab on the Anthropic account. This is the
 * minimum viable guard.
 *
 * NOTE: state is in-process. That is correct for a single long-running server
 * (Node adapter, a container, a VM). On serverless/edge, each instance keeps its
 * own counter, so the effective limit is per-instance rather than global — move
 * to Redis/Upstash or the platform's own rate limiting before relying on it there.
 */

interface Window {
	hits: number[];
}

const buckets = new Map<string, Window>();

/** Requests allowed per IP inside the window. */
const LIMIT = 25;
const WINDOW_MS = 10 * 60 * 1000;
/** Stop the map growing without bound on a long-lived process. */
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
	ok: boolean;
	retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
	const now = Date.now();
	const cutoff = now - WINDOW_MS;

	if (buckets.size > MAX_BUCKETS) {
		for (const [k, v] of buckets) {
			if (v.hits.every((t) => t < cutoff)) buckets.delete(k);
		}
		// Still oversized after pruning: drop everything rather than leak memory.
		if (buckets.size > MAX_BUCKETS) buckets.clear();
	}

	const bucket = buckets.get(key) ?? { hits: [] };
	bucket.hits = bucket.hits.filter((t) => t >= cutoff);

	if (bucket.hits.length >= LIMIT) {
		buckets.set(key, bucket);
		const oldest = bucket.hits[0];
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000))
		};
	}

	bucket.hits.push(now);
	buckets.set(key, bucket);
	return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Hard ceiling on what we will forward to the model. Without this a single
 * pasted novel turns into a very expensive request.
 */
export const MAX_INPUT_CHARS = 20_000;

export function tooLong(...values: (string | undefined)[]): boolean {
	return values.reduce((n, v) => n + (v?.length ?? 0), 0) > MAX_INPUT_CHARS;
}
