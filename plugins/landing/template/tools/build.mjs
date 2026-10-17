/**
 * Збірка сайту: `npm run build`.
 *
 * Лендинг збирається під Apache / cPanel, тож поверх `astro build` збірка
 * додає в `dist/` усе, що потрібно PHP-хостингу:
 *
 *   dist/scripts/form.php          ← server/form.php
 *   dist/scripts/form.limits.json  ← ліміти з SITE.form
 *   dist/.htaccess                 ← server/htaccess.template + ліміти з SITE.form
 *
 * PHP і .htaccess лежать поза `public/` навмисно: тоді вони потрапляють у збірку
 * лише через цей скрипт, а ліміти в них підставляються з конфіга, а не
 * переписуються руками.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/site.config.js';
import { writeFormLimits } from './limits.mjs';

const OUT_DIR = join('dist', 'scripts');

execFileSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(join('server', 'form.php'), join(OUT_DIR, 'form.php'));
writeFormLimits(OUT_DIR);

/**
 * post_max_size має бути трохи більшим за upload_max_filesize: тіло запиту —
 * це файл плюс текстові поля й розділювачі multipart.
 */
const htaccess = readFileSync(join('server', 'htaccess.template'), 'utf8')
	.replaceAll('__UPLOAD_MAX__', `${SITE.form.maxFileMb}M`)
	.replaceAll('__POST_MAX__', `${SITE.form.maxFileMb + 1}M`);
writeFileSync(join('dist', '.htaccess'), htaccess);

console.log(`\nЗбірка для Apache / cPanel готова.`);
console.log(`  dist/scripts/form.php, form.limits.json, .htaccess — додано`);
console.log(`\n  Далі: npm run check, потім npm run pack — архів для заливання.`);
console.log(`  .env клади на рівень ВИЩЕ за public_html — не всередину.`);
