import { browser } from '$app/environment';
import { track as vercelTrack } from '@vercel/analytics';

/**
 * Product analytics.
 *
 * Vercel Web Analytics rather than a new vendor, for one reason that matters
 * here: Vercel is already a sub-processor for hosting, so this adds no third
 * party to the privacy policy. It is cookieless and stores no personal data,
 * which keeps the "no cookie banner" claim true.
 *
 * THE RULE: events describe *shape*, never *content*. A brief carries client
 * budgets and strategy; none of it may reach an analytics vendor. Every payload
 * below is a count, an enum, or a boolean — check any new event against that
 * before adding it.
 */

type Props = Record<string, string | number | boolean | null>;

function send(event: string, props?: Props) {
	if (!browser) return;
	try {
		vercelTrack(event, props);
	} catch {
		// Analytics must never be able to break the app.
	}
}

export const analytics = {
	briefCreated: (source: 'scratch' | 'import') => send('brief_created', { source }),

	/** Which templates people actually pick — the roadmap question. */
	templateChosen: (template: string) => send('template_chosen', { template }),

	roleChosen: (role: string) => send('role_chosen', { role }),

	/** The core action. Counts only — never the findings themselves. */
	surveyRun: (result: { template: string | null; findings: number; sections: number }) =>
		send('survey_run', {
			template: result.template ?? 'none',
			findings: result.findings,
			sections: result.sections
		}),

	/**
	 * Resolved vs dismissed is the honest measure of whether the survey is
	 * useful or merely noisy — the single most valuable thing to know.
	 */
	findingSettled: (how: 'resolved' | 'dismissed', kind: string) =>
		send('finding_settled', { how, kind }),

	briefExported: (how: 'download' | 'copy' | 'print', hadOpenItems: boolean) =>
		send('brief_exported', { how, hadOpenItems }),

	/** Fired where someone abandons, so drop-off is visible. */
	stepReached: (step: number, label: string) => send('step_reached', { step, label })
};
