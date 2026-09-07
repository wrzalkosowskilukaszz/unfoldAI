/**
 * The one way the browser talks to /api/*. Every route answers JSON, and every
 * failure carries a `message` written for the person reading it, so this turns
 * a non-2xx response into an Error with that message and nothing else.
 */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		let message = `Request failed (${res.status})`;
		try {
			const data = await res.json();
			if (data?.message) message = data.message;
		} catch {
			// non-JSON error body — keep the generic message
		}
		throw new Error(message);
	}
	return res.json() as Promise<T>;
}
