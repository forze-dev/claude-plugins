/**
 * The request modal.
 *
 * The markup lives in RequestModal.astro; this script only opens and closes it.
 * Any element with [data-modal-open] is a trigger — no ids, so a page can have
 * as many as it likes.
 */

import { initForm } from './form.js';

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lastTrigger = null;

function trapFocus(overlay, event) {
	const focusable = [...overlay.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
	if (!focusable.length) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

export function initModal() {
	const overlay = document.querySelector('[data-modal]');
	if (!overlay) return;

	// The form inside the modal is initialized once, on first open.
	let formReady = false;

	const close = () => {
		overlay.classList.remove('is-visible');
		document.body.classList.remove('is-scroll-locked');

		const hide = () => { overlay.hidden = true; };
		// transitionend may not fire (reduced motion, a hidden tab) — hence the timer too.
		const fallback = setTimeout(hide, 400);
		overlay.addEventListener('transitionend', () => { clearTimeout(fallback); hide(); }, { once: true });

		lastTrigger?.focus();
		lastTrigger = null;
	};

	const open = (trigger) => {
		if (!overlay.hidden) return;
		lastTrigger = trigger;

		// No scrollbar compensation here on purpose: `scrollbar-gutter: stable` in
		// base/reset.css keeps the space reserved, so locking the page shifts
		// nothing — including the fixed header.
		overlay.hidden = false;
		document.body.classList.add('is-scroll-locked');

		if (!formReady) {
			initForm(overlay.querySelector('[data-form]'));
			formReady = true;
		}

		requestAnimationFrame(() => {
			overlay.classList.add('is-visible');
			overlay.querySelector('[name="username"]')?.focus({ preventScroll: true });
		});
	};

	document.addEventListener('click', (event) => {
		const trigger = event.target.closest('[data-modal-open]');
		if (trigger) {
			event.preventDefault();
			open(trigger);
			return;
		}

		if (event.target.closest('[data-modal-close]') || event.target === overlay) close();
	});

	document.addEventListener('keydown', (event) => {
		if (overlay.hidden) return;
		if (event.key === 'Escape') close();
		if (event.key === 'Tab') trapFocus(overlay, event);
	});
}

export default initModal;
