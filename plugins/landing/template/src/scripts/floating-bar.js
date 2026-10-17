/**
 * The messenger bar, mobile only.
 *
 * Rendered from SITE.messengers, so adding a channel is a config change. It
 * slides in once scrolling starts and stays out of the way at the top, where
 * the hero already has a request button.
 */

import { SITE } from '../site.config.js';

const REVEAL_AFTER = 120;

export function initFloatingBar() {
	if (!SITE.messengers?.length) return;
	if (document.querySelector('.floating-bar')) return;

	const bar = document.createElement('div');
	bar.className = 'floating-bar';
	bar.setAttribute('role', 'complementary');
	bar.setAttribute('aria-label', SITE.ui.chatWithUs);

	bar.innerHTML = SITE.messengers
		.map((messenger) => {
			const color = messenger.brand || 'var(--accent)';
			// viber:// links must not open with target=_blank — that breaks the hand-off to the app.
			const isWebLink = messenger.href.startsWith('http');
			const linkAttrs = isWebLink ? ' target="_blank" rel="noopener nofollow"' : '';

			return `
				<a class="floating-bar__link" href="${messenger.href}" style="--brand:${color}"${linkAttrs} aria-label="${SITE.ui.messageOn} ${messenger.name}">
					<img class="floating-bar__icon" src="${messenger.icon}" alt="" width="24" height="24" aria-hidden="true">
					<span class="floating-bar__text">
						<span>${SITE.ui.messageOn}</span>
						<strong>${messenger.name}</strong>
					</span>
				</a>`;
		})
		.join('');

	document.body.appendChild(bar);

	let visible = false;
	let ticking = false;

	const update = () => {
		const shouldShow = window.scrollY > REVEAL_AFTER;
		if (shouldShow !== visible) {
			visible = shouldShow;
			bar.classList.toggle('is-visible', shouldShow);
		}
		ticking = false;
	};

	window.addEventListener(
		'scroll',
		() => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(update);
		},
		{ passive: true }
	);

	update();
}

export default initFloatingBar;
