import { browser } from '$app/environment';

const KEY = 'surveyvor-ai-notice-seen-v1';

/**
 * Shown once, the first time someone actually sends text to the AI.
 *
 * Deliberately not an arrival popup. A modal on load is the most-dismissed
 * pattern on the web, and using the visual language of a cookie banner to say
 * "we don't track you" undermines the message. Telling someone at the moment
 * their text leaves the device is both more credible and closer to what
 * "informed" is supposed to mean.
 */
class AiConsent {
	seen = $state(false);
	/** True while the notice is on screen waiting to be acknowledged. */
	pending = $state(false);

	private resolver: ((proceed: boolean) => void) | null = null;

	constructor() {
		if (!browser) return;
		try {
			this.seen = localStorage.getItem(KEY) === '1';
		} catch {
			// Storage blocked: show the notice rather than assume it was seen.
			this.seen = false;
		}
	}

	/**
	 * Call before any request that sends brief text to the model. Resolves true
	 * once the person has acknowledged, or immediately if they already have.
	 */
	async ensure(): Promise<boolean> {
		if (!browser || this.seen) return true;
		this.pending = true;
		return new Promise<boolean>((resolve) => {
			this.resolver = resolve;
		});
	}

	acknowledge() {
		this.seen = true;
		this.pending = false;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// Not being able to remember is a nuisance, not a failure — the notice
			// simply appears again next time.
		}
		this.resolver?.(true);
		this.resolver = null;
	}

	cancel() {
		this.pending = false;
		this.resolver?.(false);
		this.resolver = null;
	}
}

export const aiConsent = new AiConsent();
