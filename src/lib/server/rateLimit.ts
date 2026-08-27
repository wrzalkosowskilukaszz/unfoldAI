import { env } from '$env/dynamic/private';

/**
 * Rate limiter for the AI routes.
 *
 * Every one of these endpoints spends real money per call, so an unprotected
 * public deployment is an open tab on the Anthropic account.
 *
 * The counter lives in Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, because an in-process counter is worthless
 * on serverless: Vercel runs many function instances, each with its own memory
 * and each recycled constantly, so a local Map enforces the limit *per
 * instance* rather than per person. Concurrency multiplies it and a cold start
 * resets it.
 *
 * Without those variables it falls back to the in-process map, which is correct
 * for local development and for a single long-running server, and is announced
 * loudly in production so the gap is never silent.
 */

/** Requests allowed per IP inside the window. */
const LIMIT = 25;
const WINDOW_MS = 10 * 60 * 1000;
/** Stop the fallback map growing without bound on a long-lived process. */
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
	ok: boolean;
	retryAfterSeconds: number;
	/** False when the durable store was unreachable and the fallback was used. */
	durable: boolean;
}

// ---------------------------------------------------------------- in-process

interface Bucket {
	hits: number[];
}
const buckets = new Map<string, Bucket>();

function checkInMemory(key: string, now: number): RateLimitResult {
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
			retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
			durable: false
		};
	}

	bucket.hits.push(now);
	buckets.set(key, bucket);
	return { ok: true, retryAfterSeconds: 0, durable: false };
}

// -------------------------------------------------------------------- shared

type RedisLike = {
	incr(key: string): Promise<number>;
	expire(key: string, seconds: number): Promise<unknown>;
	get(key: string): Promise<unknown>;
};

let redis: RedisLike | null = null;
let redisChecked = false;
let warnedNoStore = false;

async function getRedis(): Promise<RedisLike | null> {
	if (redisChecked) return redis;
	redisChecked = true;

	const url = env.UPSTASH_REDIS_REST_URL;
	const token = env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) return null;

	try {
		const { Redis } = await import('@upstash/redis');
		redis = new Redis({ url, token }) as unknown as RedisLike;
	} catch (err) {
		console.error('[rateLimit] could not initialise Redis; falling back', err);
		redis = null;
	}
	return redis;
}

/**
 * Two fixed buckets, weighted by how far into the current one we are. A single
 * fixed window lets someone spend twice the limit across a boundary; weighting
 * the previous window by its remaining overlap removes that without needing a
 * sorted set and the extra round trips it costs.
 */
async function checkRedis(client: RedisLike, key: string, now: number): Promise<RateLimitResult> {
	const windowId = Math.floor(now / WINDOW_MS);
	const elapsed = now - windowId * WINDOW_MS;
	const currentKey = `rl:${key}:${windowId}`;
	const previousKey = `rl:${key}:${windowId - 1}`;

	const [current, previousRaw] = await Promise.all([
		client.incr(currentKey),
		client.get(previousKey)
	]);

	// Expire a little past two windows so the previous bucket is still readable.
	if (current === 1) {
		await client.expire(currentKey, Math.ceil((WINDOW_MS * 2) / 1000));
	}

	const previous = Number(previousRaw ?? 0) || 0;
	const weighted = previous * (1 - elapsed / WINDOW_MS) + current;

	if (weighted > LIMIT) {
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000)),
			durable: true
		};
	}
	return { ok: true, retryAfterSeconds: 0, durable: true };
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
	const now = Date.now();
	const client = await getRedis();

	if (!client) {
		if (!warnedNoStore && env.NODE_ENV === 'production') {
			warnedNoStore = true;
			console.warn(
				'[rateLimit] no Redis configured — the limit is per function instance, ' +
					'not per user. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
			);
		}
		return checkInMemory(key, now);
	}

	try {
		return await checkRedis(client, key, now);
	} catch (err) {
		// A Redis blip must not lock every user out, but it must not remove the
		// ceiling either — drop to the in-process limiter and say so.
		console.error('[rateLimit] Redis unavailable; using in-process fallback', err);
		return checkInMemory(key, now);
	}
}

/** Test seam: forget any cached client so env changes take effect. */
export function __resetRateLimiter(): void {
	redis = null;
	redisChecked = false;
	warnedNoStore = false;
	buckets.clear();
}

/**
 * Hard ceiling on what we will forward to the model. Without this a single
 * pasted novel turns into a very expensive request.
 */
export const MAX_INPUT_CHARS = 20_000;

export function tooLong(...values: (string | undefined)[]): boolean {
	return values.reduce((n, v) => n + (v?.length ?? 0), 0) > MAX_INPUT_CHARS;
}
