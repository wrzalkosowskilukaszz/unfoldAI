/**
 * Makes an element behave as a modal dialog for keyboard and screen-reader users:
 * moves focus in, keeps Tab inside it, closes on Escape, and returns focus to
 * whatever opened it.
 *
 * Without this a keyboard user tabs straight past the dialog into the page
 * behind it, and has no way to dismiss it without a mouse.
 */
export function modal(node: HTMLElement, onClose: () => void) {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	const FOCUSABLE =
		'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

	function focusable(): HTMLElement[] {
		return [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
			(el) => el.offsetParent !== null || el === document.activeElement
		);
	}

	// Move focus to the first meaningful control, not the backdrop.
	queueMicrotask(() => {
		const items = focusable();
		// Skip a leading full-screen backdrop button if present.
		const target = items.find((el) => !el.classList.contains('absolute')) ?? items[0] ?? node;
		target.focus();
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onClose();
			return;
		}
		if (e.key !== 'Tab') return;

		const items = focusable();
		if (items.length === 0) return;
		const first = items[0];
		const last = items[items.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	node.addEventListener('keydown', onKeydown);
	// Escape should work even when focus has drifted outside the node.
	document.addEventListener('keydown', onKeydown);

	// Stop the page behind scrolling under the dialog.
	const prevOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';

	return {
		destroy() {
			node.removeEventListener('keydown', onKeydown);
			document.removeEventListener('keydown', onKeydown);
			document.body.style.overflow = prevOverflow;
			previouslyFocused?.focus?.();
		}
	};
}
