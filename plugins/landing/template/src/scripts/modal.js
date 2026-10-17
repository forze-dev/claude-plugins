/**
 * Модалка заявки.
 *
 * Розмітка живе в RequestModal.astro; цей скрипт лише відкриває й закриває її.
 * Тригером є будь-який елемент із [data-modal-open] — жодних id, тож на
 * сторінці їх може бути скільки завгодно.
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

	// Форма всередині модалки ініціалізується один раз, при першому відкритті.
	let formReady = false;

	const close = () => {
		overlay.classList.remove('is-visible');
		document.body.classList.remove('is-scroll-locked');

		const hide = () => { overlay.hidden = true; };
		// transitionend може не спрацювати (reduced motion, прихована вкладка) — тому ще й таймер.
		const fallback = setTimeout(hide, 400);
		overlay.addEventListener('transitionend', () => { clearTimeout(fallback); hide(); }, { once: true });

		lastTrigger?.focus();
		lastTrigger = null;
	};

	const open = (trigger) => {
		if (!overlay.hidden) return;
		lastTrigger = trigger;

		// Компенсації смуги прокрутки тут свідомо немає: `scrollbar-gutter: stable`
		// у base/reset.css тримає місце зарезервованим, тож блокування сторінки
		// нічого не зсуває — зокрема й фіксований хедер.
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
