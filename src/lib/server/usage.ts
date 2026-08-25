/**
 * Per-call token accounting.
 *
 * Every Anthropic response carries a `usage` object. Logging it turns "roughly
 * a few cents a brief" into an actual number you can read off the Vercel
 * runtime logs (Project → Logs, filter for `"type":"usage"`).
 *
 * Deliberately logs **counts only** — never prompt or brief content. Briefs
 * contain client information and must not end up in a log aggregator.
 */

/**
 * USD per million tokens for claude-sonnet-4-6.
 *
 * These are for local estimation only — the Anthropic Console is the source of
 * truth for billing. If the numbers here drift from the pricing page, the token
 * counts above them are still correct; only `estUsd` goes stale.
 */
const USD_PER_MTOK_INPUT = 3;
const USD_PER_MTOK_OUTPUT = 15;

/** Structurally typed so this doesn't break when the SDK adds usage fields. */
type UsageLike = {
	input_tokens?: number | null;
	output_tokens?: number | null;
	cache_creation_input_tokens?: number | null;
	cache_read_input_tokens?: number | null;
};

export function logUsage(route: string, usage: UsageLike | null | undefined): void {
	if (!usage) return;

	const input = usage.input_tokens ?? 0;
	const output = usage.output_tokens ?? 0;
	const cacheRead = usage.cache_read_input_tokens ?? 0;
	const cacheWrite = usage.cache_creation_input_tokens ?? 0;

	const estUsd = (input / 1e6) * USD_PER_MTOK_INPUT + (output / 1e6) * USD_PER_MTOK_OUTPUT;

	// One line of JSON per call, so the logs can be grepped or piped into jq.
	console.log(
		JSON.stringify({
			type: 'usage',
			route,
			input,
			output,
			cacheRead,
			cacheWrite,
			estUsd: Number(estUsd.toFixed(5))
		})
	);
}
