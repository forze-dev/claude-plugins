/**
 * Normalizes a path to the address people and crawlers actually see.
 *
 * With `build.format: 'file'`, Astro.url.pathname during the build is
 * `/privacy-policy.html`, while the site is served at `/privacy-policy`. The
 * canonical, the sitemap and current-page checks must agree — so they all go
 * through this function.
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
