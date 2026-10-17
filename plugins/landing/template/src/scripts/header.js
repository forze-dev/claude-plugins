/**
 * Header behaviour: the mobile menu.
 *
 * The button labels come from data attributes that Header.astro renders from
 * `SITE.ui` — so the label language is set by the config, not by this file.
 */

function initDrawer(header) {
	const burger = header.querySelector('.header__burger');
	const nav = header.querySelector('.header__nav');
	if (!burger || !nav) return;

	const setOpen = (open) => {
		burger.classList.toggle('is-active', open);
		nav.classList.toggle('is-open', open);
		burger.setAttribute('aria-expanded', String(open));
		burger.setAttribute('aria-label', open ? burger.dataset.labelClose : burger.dataset.labelOpen);
		document.body.classList.toggle('is-scroll-locked', open);
	};

	burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

	// Following an anchor inside the menu closes it — otherwise the menu would
	// stay on top of the section the person just jumped to.
	nav.addEventListener('click', (event) => {
		if (event.target.closest('a')) setOpen(false);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && nav.classList.contains('is-open')) {
			setOpen(false);
			burger.focus();
		}
	});

	// Leaving the mobile breakpoint must not leave the body locked.
	window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
		if (event.matches) setOpen(false);
	});
}

export function initHeader() {
	const header = document.querySelector('.header');
	if (!header) return;

	initDrawer(header);
}

export default initHeader;
