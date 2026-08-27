import type { HandleClientError } from '@sveltejs/kit';

/**
 * Client-side crashes are the ones a user actually sees, and until now they
 * left no trace at all. Give them the same reference id as server errors so a
 * screenshot is enough to find the event.
 */
export const handleError: HandleClientError = ({ error, event, status }) => {
	const id = Math.random().toString(36).slice(2, 8).toUpperCase();

	console.error(
		JSON.stringify({
			type: 'error',
			id,
			where: 'client',
			route: event.url.pathname,
			status,
			message: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300)
		})
	);

	return {
		message: 'Something went wrong. Your briefs are saved in this browser and are not affected.',
		id
	};
};
