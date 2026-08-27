import { env } from '$env/dynamic/private';

/**
 * Structured error reporting.
 *
 * Two jobs. First, every unhandled error gets a short id that is shown to the
 * user and written to the log, so "it broke" becomes a reference you can grep
 * for — without that, a bug report is unactionable. Second, if SENTRY_DSN is
 * configured the same error is forwarded so someone is actually told, rather
 * than it sitting unread in Vercel's log viewer.
 *
 * Works with no configuration at all: the ids and structured logs are useful on
 * their own, and Sentry layers on when the DSN exists.
 */

export function errorId(): string {
	// Short, unambiguous when read aloud or pasted into a message.
	return Math.random().toString(36).slice(2, 8).toUpperCase();
}

interface ReportContext {
	id: string;
	where: 'server' | 'client';
	route?: string;
	method?: string;
	status?: number;
}

/** Never log anything that could carry brief content. */
function safeMessage(error: unknown): string {
	if (error instanceof Error) return error.message.slice(0, 300);
	if (typeof error === 'string') return error.slice(0, 300);
	return 'Non-error thrown';
}

export function reportError(error: unknown, ctx: ReportContext): void {
	const payload = {
		type: 'error',
		id: ctx.id,
		where: ctx.where,
		route: ctx.route,
		method: ctx.method,
		status: ctx.status,
		message: safeMessage(error),
		stack: error instanceof Error ? error.stack?.split('\n').slice(0, 6).join('\n') : undefined
	};

	console.error(JSON.stringify(payload));

	const dsn = env.SENTRY_DSN;
	if (!dsn) return;

	// Fire-and-forget: an error reporter that can itself break the request is
	// worse than no error reporter.
	void forwardToSentry(dsn, payload).catch(() => {});
}

async function forwardToSentry(dsn: string, payload: Record<string, unknown>): Promise<void> {
	// Minimal Sentry envelope over fetch rather than the full SDK: the SDK adds
	// weight to every serverless cold start for one call we make rarely.
	const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
	if (!match) return;
	const [, key, host, projectId] = match;

	const body =
		JSON.stringify({ event_id: crypto.randomUUID().replace(/-/g, ''), sent_at: new Date().toISOString() }) +
		'\n' +
		JSON.stringify({ type: 'event' }) +
		'\n' +
		JSON.stringify({
			level: 'error',
			platform: 'javascript',
			logger: 'surveyvor',
			message: { formatted: String(payload.message) },
			tags: { errorId: payload.id, where: payload.where, route: payload.route },
			extra: payload
		});

	await fetch(`https://${host}/api/${projectId}/envelope/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-sentry-envelope',
			'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=surveyvor/1.0`
		},
		body,
		signal: AbortSignal.timeout(3000)
	});
}
