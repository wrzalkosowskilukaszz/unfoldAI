import { browser } from '$app/environment';

const STORAGE_KEY = 'surveyvor-theme';
const LEGACY_THEME_KEY = 'unfold-ai-theme';

export type Theme = 'light' | 'dark';

class ThemeStore {
	current = $state<Theme>('light');

	constructor() {
		if (!browser) return;
		const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
		if (saved === 'light' || saved === 'dark') {
			this.current = saved;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			this.current = 'dark';
		}
		this.apply();
	}

	private apply() {
		if (!browser) return;
		document.documentElement.dataset.theme = this.current;
	}

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
		if (browser) localStorage.setItem(STORAGE_KEY, this.current);
		this.apply();
	}
}

export const themeStore = new ThemeStore();
