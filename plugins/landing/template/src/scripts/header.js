/**
 * Поведінка хедера: мобільне меню.
 *
 * Підписи кнопки беруться з data-атрибутів, які рендерить Header.astro з
 * `SITE.ui` — тож мова підписів задається конфігом, а не цим файлом.
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

	// Перехід за якорем усередині меню закриває його — інакше меню лишилося б
	// поверх секції, до якої людина щойно перейшла.
	nav.addEventListener('click', (event) => {
		if (event.target.closest('a')) setOpen(false);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && nav.classList.contains('is-open')) {
			setOpen(false);
			burger.focus();
		}
	});

	// Вихід за мобільний брейкпоінт не має лишити body заблокованим.
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
