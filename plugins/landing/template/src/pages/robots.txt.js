/**
 * robots.txt generated from site.config.js — so the sitemap address always
 * points to the right domain. Ends up in dist/robots.txt at build time.
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
