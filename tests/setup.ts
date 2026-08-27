/**
 * A real Storage implementation for the tests.
 *
 * Two things conspire against the ambient one: Node 26 exposes its own
 * experimental `localStorage` global that is inert without --localstorage-file,
 * and the jsdom environment here does not install one on `window` either. Since
 * the store only needs the Storage contract, owning it outright is simpler than
 * fighting both — and it makes failure injectable, which the quota test needs.
 */
class MemoryStorage implements Storage {
	#map = new Map<string, string>();
	/** Set by tests to make the next writes throw, as a full disk would. */
	failWrites = false;

	get length() {
		return this.#map.size;
	}
	key(i: number) {
		return [...this.#map.keys()][i] ?? null;
	}
	getItem(k: string) {
		return this.#map.has(k) ? this.#map.get(k)! : null;
	}
	setItem(k: string, v: string) {
		if (this.failWrites) {
			const err = new Error('QuotaExceededError');
			err.name = 'QuotaExceededError';
			throw err;
		}
		this.#map.set(k, String(v));
	}
	removeItem(k: string) {
		this.#map.delete(k);
	}
	clear() {
		this.#map.clear();
		this.failWrites = false;
	}
}

const storage = new MemoryStorage();
for (const target of [globalThis, globalThis.window].filter(Boolean)) {
	Object.defineProperty(target, 'localStorage', {
		value: storage,
		configurable: true,
		writable: true
	});
}

/** Exposed so a test can simulate a device that has run out of room. */
export const testStorage = storage;
