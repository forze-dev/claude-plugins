/**
 * Архів для заливання на хостинг: `npm run pack`.
 *
 * Пакує ВМІСТ `dist/` (не саму теку) у `release/<домен>.zip` — його
 * розпаковують прямо в public_html. Запускається ПІСЛЯ `npm run build` і
 * `npm run check`.
 *
 * Без залежностей: zip збирається вручну через node:zlib. Архів детермінований —
 * однаковий dist/ дає байт-у-байт однаковий zip: файли йдуть у відсортованому
 * порядку, а дата всередині архіву фіксована. Інакше два архіви тієї самої
 * збірки відрізнялися б і порівнювати їх було б неможливо (правило 4).
 *
 * `.env` у архів не потрапляє ніколи — навіть якщо хтось поклав його в dist/.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

import { SITE } from '../src/site.config.js';

const DIST = 'dist';
const OUT_DIR = 'release';

/** 1 січня 2020, 00:00 у форматі DOS: час і дата в архіві фіксовані. */
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

if (!existsSync(DIST)) {
	console.error('Теки dist/ немає. Спершу `npm run build`, потім `npm run check`, потім `npm run pack`.');
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
	local.writeUInt16LE(20, 4); // версія для розпакування
	local.writeUInt16LE(0x0800, 6); // імена в UTF-8
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

console.log(`\nАрхів готовий: ${target} (${files.length} файлів)`);
console.log(`  Розпакуй його ВМІСТ у public_html — без проміжної теки.`);
console.log(`  .env у архіві немає і бути не повинно: поклади його на рівень вище за public_html.`);
