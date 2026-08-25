import { ROLE_COPY, PROJECT_TYPES, type BriefRole, type ProjectType } from '$lib/types';

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

/**
 * Same contract as roleFraming: the discipline arrives from the browser, so an
 * unrecognised value must never reach a prompt.
 */
export function projectLens(value: unknown): string {
	if (typeof value !== 'string') return PROJECT_TYPES.other.lens;
	if (!(value in PROJECT_TYPES)) return PROJECT_TYPES.other.lens;
	return PROJECT_TYPES[value as ProjectType].lens;
}
