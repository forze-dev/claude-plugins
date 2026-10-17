/**
 * Site build: `npm run build`.
 *
 * The landing is built for Apache / cPanel, so on top of `astro build` this
 * script adds to `dist/` everything PHP hosting needs:
 *
 *   dist/scripts/form.php          ← server/form.php
 *   dist/scripts/form.limits.json  ← limits from SITE.form
 *   dist/.htaccess                 ← server/htaccess.template + limits from SITE.form
 *
 * PHP and .htaccess live outside `public/` on purpose: that way they enter the
 * build only through this script, and their limits are substituted from the
 * config rather than retyped by hand.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { build } from 'astro';

import { SITE } from '../src/site.config.js';
import { writeFormLimits } from './limits.mjs';

const OUT_DIR = join('dist', 'scripts');

// Astro's JavaScript API, not `npx astro build`: it runs exactly the pinned
// version from node_modules, with no package launcher in between.
await build({});

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(join('server', 'form.php'), join(OUT_DIR, 'form.php'));
writeFormLimits(OUT_DIR);

/**
 * post_max_size must be slightly larger than upload_max_filesize: the request
 * body is the file plus the text fields and the multipart boundaries.
 */
const htaccess = readFileSync(join('server', 'htaccess.template'), 'utf8')
	.replaceAll('__UPLOAD_MAX__', `${SITE.form.maxFileMb}M`)
	.replaceAll('__POST_MAX__', `${SITE.form.maxFileMb + 1}M`);
writeFileSync(join('dist', '.htaccess'), htaccess);

console.log(`\nBuild for Apache / cPanel is ready.`);
console.log(`  dist/scripts/form.php, form.limits.json, .htaccess — added`);
console.log(`\n  Next: npm run check, then npm run pack — the archive to upload.`);
console.log(`  Put .env ONE LEVEL ABOVE public_html — never inside it.`);
