/**
 * Нормалізує шлях до тієї адреси, яку реально бачать люди й пошукові роботи.
 *
 * З `build.format: 'file'` під час збірки Astro.url.pathname дорівнює
 * `/about.html`, тоді як сайт обслуговується за `/about`. Canonical, sitemap і
 * перевірка поточної сторінки мусять збігатися — тож усі йдуть через цю функцію.
 */
export function cleanPath(pathname) {
	return (
		pathname
			.replace(/index\.html$/, '')
			.replace(/\.html$/, '')
			.replace(/\/+$/, '') || '/'
	);
}

export default cleanPath;
