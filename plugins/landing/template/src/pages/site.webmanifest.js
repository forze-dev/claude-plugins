/**
 * The web manifest, generated from site.config.js. It lives here rather than in
 * public/ so the name and theme color can't drift from the rest of the site.
 */
import { SITE } from '../site.config.js';

export function GET() {
	const manifest = {
		name: SITE.name,
		short_name: SITE.shortName,
		description: SITE.description,
		start_url: '/',
		scope: '/',
		icons: [
			{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
		],
		theme_color: SITE.themeColor,
		background_color: '#ffffff',
		display: 'standalone',
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
	});
}
