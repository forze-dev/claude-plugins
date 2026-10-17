/**
 * A contact sheet of every icon in public/assets/icons/: `npm run icons:preview`.
 *
 * Writes `temp/icons-preview.png`: each icon at 96px and at 24px (the size the
 * site actually uses), black on white, in alphabetical order. Open it and LOOK
 * — a broken path, a lopsided shape or a mushy glyph at 24px is invisible in
 * the SVG source and obvious in the picture.
 *
 * Brand icons (WhatsApp, Telegram, Viber, Instagram…) come from Simple Icons
 * (https://simpleicons.org, CC0) — never drawn by hand.
 */

import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('sharp is not installed. Run `npm ci` first — Astro brings sharp with it.');
	process.exit(1);
}

const DIR = 'public/assets/icons';
const OUT = join('temp', 'icons-preview.png');
const files = readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort();

const CELL = 150;
const PER_ROW = 5;
const tiles = [];

for (const [index, file] of files.entries()) {
	const svg = readFileSync(join(DIR, file), 'utf8').replace(/currentColor/g, '#111111');
	const left = 20 + (index % PER_ROW) * CELL;
	const top = 20 + Math.floor(index / PER_ROW) * CELL;
	tiles.push({ input: await sharp(Buffer.from(svg), { density: 600 }).resize(96, 96).png().toBuffer(), left, top });
	tiles.push({ input: await sharp(Buffer.from(svg), { density: 300 }).resize(24, 24).png().toBuffer(), left: left + 104, top: top + 72 });
}

const rows = Math.ceil(files.length / PER_ROW);
mkdirSync('temp', { recursive: true });
await sharp({ create: { width: 40 + PER_ROW * CELL, height: 40 + rows * CELL, channels: 4, background: '#ffffff' } })
	.composite(tiles)
	.png()
	.toFile(OUT);

console.log(`Wrote ${OUT}. Order (left to right, top to bottom):`);
files.forEach((file, index) => console.log(`  ${index + 1}. ${file}`));
