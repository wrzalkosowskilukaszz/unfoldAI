import { ROLE_COPY, type BriefRole } from '$lib/types';

/**
 * The role arrives from the browser, so it is untrusted input — anything that
 * isn't one of the two known values is treated as "not answered" rather than
 * being interpolated into a prompt.
 */
export function roleFraming(value: unknown): string {
	if (typeof value !== 'string') return NEUTRAL;
	if (!(value in ROLE_COPY)) return NEUTRAL;
	return ROLE_COPY[value as BriefRole].promptFraming;
}

const NEUTRAL =
	'It is not stated whether the person writing this is commissioning the work or delivering it. Stay neutral: avoid phrasing that assumes either, and do not assume they know design vocabulary.';
