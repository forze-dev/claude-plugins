/**
 * The archive to upload to the hosting: `npm run pack`.
 *
 * Packs the CONTENTS of `dist/` (not the folder itself) into
 * `release/<domain>.zip` — it is extracted straight into public_html. Run it
 * AFTER `npm run build` and `npm run check`.
 *
 * No dependencies: the zip is assembled by hand with node:zlib. The archive is
 * deterministic — the same dist/ gives a byte-identical zip: files go in sorted
 * order and the date inside the archive is fixed. Otherwise two archives of the
 * same build would differ and couldn't be compared (rule 4).
 *
 * `.env` never goes into the archive — even if someone put it in dist/.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

import { SITE } from '../src/site.config.js';

const DIST = 'dist';
const OUT_DIR = 'release';

/** 1 January 2020, 00:00 in DOS format: the time and date inside the archive are fixed. */
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

if (!existsSync(DIST)) {
	console.error('There is no dist/ folder. Run `npm run build`, then `npm run check`, then `npm run pack`.');
	process.exit(1);
}

function walk(dir, base = dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full, base));
		else out.push(full.slice(base.length + 1).split('\\').join('/'));
	}
	return out;
}

const files = walk(DIST)
	.filter((path) => !/(^|\/)\.env(\..*)?$/.test(path))
	.sort();

const locals = [];
const centrals = [];
let offset = 0;

for (const path of files) {
	const data = readFileSync(join(DIST, path));
	const name = Buffer.from(path, 'utf8');
	const packed = deflateRawSync(data, { level: 9 });
	const crc = crc32(data);

	const local = Buffer.alloc(30);
	local.writeUInt32LE(0x04034b50, 0);
	local.writeUInt16LE(20, 4); // version needed to extract
	local.writeUInt16LE(0x0800, 6); // UTF-8 file names
	local.writeUInt16LE(8, 8); // deflate
	local.writeUInt16LE(DOS_TIME, 10);
	local.writeUInt16LE(DOS_DATE, 12);
	local.writeUInt32LE(crc, 14);
	local.writeUInt32LE(packed.length, 18);
	local.writeUInt32LE(data.length, 22);
	local.writeUInt16LE(name.length, 26);
	local.writeUInt16LE(0, 28);
	locals.push(local, name, packed);

	const central = Buffer.alloc(46);
	central.writeUInt32LE(0x02014b50, 0);
	central.writeUInt16LE(20, 4);
	central.writeUInt16LE(20, 6);
	central.writeUInt16LE(0x0800, 8);
	central.writeUInt16LE(8, 10);
	central.writeUInt16LE(DOS_TIME, 12);
	central.writeUInt16LE(DOS_DATE, 14);
	central.writeUInt32LE(crc, 16);
	central.writeUInt32LE(packed.length, 20);
	central.writeUInt32LE(data.length, 24);
	central.writeUInt16LE(name.length, 28);
	central.writeUInt32LE(offset, 42);
	centrals.push(central, name);

	offset += local.length + name.length + packed.length;
}

const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);

const host = new URL(SITE.url).hostname;
mkdirSync(OUT_DIR, { recursive: true });
const target = join(OUT_DIR, `${host}.zip`);
writeFileSync(target, Buffer.concat([...locals, ...centrals, end]));

console.log(`\nArchive ready: ${target} (${files.length} files)`);
console.log(`  Extract its CONTENTS into public_html — without an intermediate folder.`);
console.log(`  .env is not in the archive and must not be: put it one level above public_html.`);
