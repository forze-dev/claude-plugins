/**
 * Form limits for the PHP back end — one function for two consumers: the build
 * (`tools/build.mjs` writes the file into dist/scripts/) and the dev server
 * (`astro.config.mjs` writes it next to server/form.php). So PHP in dev and in
 * production reads exactly what the browser reads — from `SITE.form`.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/site.config.js';

/**
 * Exactly the fields `server/form.php` reads. Deliberately not the whole
 * `SITE.form`: the back end needs neither the phone mask nor successUrl, and
 * extra data in a folder under the web server is just extra.
 */
export function formLimits() {
	return {
		siteUrl: SITE.url,
		maxFileSize: SITE.form.maxFileSize,
		allowedExtensions: SITE.form.allowedExtensions,
		signatures: SITE.form.signatures,
		minFillSeconds: SITE.form.minFillSeconds,
		rateLimitSeconds: SITE.form.rateLimitSeconds,
		maxFieldLength: SITE.form.maxFieldLength,
		telegramTextLimit: SITE.form.telegramTextLimit,
		telegramCaptionLimit: SITE.form.telegramCaptionLimit,
	};
}

/** Writes `form.limits.json` into the given folder. Stable format — the build is deterministic. */
export function writeFormLimits(dir) {
	const file = join(dir, 'form.limits.json');
	writeFileSync(file, JSON.stringify(formLimits(), null, '\t') + '\n');
	return file;
}
