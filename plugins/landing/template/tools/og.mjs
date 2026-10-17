/**
 * A simple OG image when the client has none: `npm run og`.
 *
 * 1200×630, the accent color from variables.css, the business name and
 * description from site.config.js. Only with the client's consent — a real
 * branded image is always better.
 *
 * Uses `sharp`, which Astro already installs, so nothing new is downloaded.
 * The text is rendered with the machine's system fonts (SVG rasterizers don't
 * load web fonts), so the picture can differ slightly between machines — the
 * result is committed, so the build itself stays deterministic.
 *
 * Refuses to overwrite an existing og.jpg unless run with `-- --force`.
 */

import { existsSync, readFileSync } from 'node:fs';

import { SITE } from '../src/site.config.js';

const OUT = 'public/assets/seo/og.jpg';

if (existsSync(OUT) && !process.argv.includes('--force')) {
	console.log(`${OUT} already exists — not overwritten. Use: npm run og -- --force`);
	process.exit(0);
}

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('sharp is not installed. Run `npm ci` first — Astro brings sharp with it.');
	process.exit(1);
}

const tokens = readFileSync('src/styles/base/variables.css', 'utf8');
const accent = tokens.match(/--accent:\s*(#[0-9a-fA-F]{6})/)?.[1] ?? '#14532d';

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Greedy wrap by character count — good enough for a two-line description. */
const wrap = (text, width, maxLines) => {
	const lines = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		if ((line + ' ' + word).trim().length > width) {
			lines.push(line);
			line = word;
		} else {
			line = (line + ' ' + word).trim();
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		lines.length = maxLines;
		lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
	}
	return lines;
};

const description = wrap(SITE.description, 52, 3)
	.map((line, i) => `<tspan x="96" dy="${i === 0 ? 0 : 52}">${escape(line)}</tspan>`)
	.join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<rect width="1200" height="630" fill="${accent}"/>
	<rect x="96" y="96" width="72" height="72" rx="20" fill="#ffffff" fill-opacity="0.16"/>
	<text x="96" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${escape(SITE.name)}</text>
	<text x="96" y="390" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="38" fill="#ffffff" fill-opacity="0.85">${description}</text>
	<text x="96" y="560" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" fill="#ffffff" fill-opacity="0.7">${escape(new URL(SITE.url).hostname)}</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(OUT);
console.log(`Created ${OUT} (1200×630). Look at it before committing — the text must fit.`);
