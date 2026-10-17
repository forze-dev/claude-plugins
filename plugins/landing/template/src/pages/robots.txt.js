/**
 * robots.txt, згенерований із site.config.js — тож адреса sitemap завжди вказує
 * на правильний домен. Під час збірки потрапляє у dist/robots.txt.
 */
import { SITE } from '../site.config.js';

export function GET() {
	const body = `User-agent: *
Allow: /

# The confirmation page is only reachable right after a submit.
Disallow: /thank-you

Sitemap: ${new URL('/sitemap-index.xml', SITE.url).href}
`;

	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
