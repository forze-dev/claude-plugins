/**
 * Ліміти форми для PHP-бекенда — одна функція на двох споживачів: збірку
 * (`tools/build.mjs` кладе файл у dist/scripts/) і dev-сервер (`astro.config.mjs`
 * кладе його поруч із server/form.php). Так PHP у dev і в проді читає рівно
 * те саме, що й браузер, — з `SITE.form`.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/site.config.js';

/**
 * Рівно ті поля, які читає `server/form.php`. Навмисно не весь `SITE.form`:
 * маска телефону й successUrl бекенду не потрібні, а зайві дані в теці, що
 * лежить під вебсервером, — зайві.
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

/** Пише `form.limits.json` у вказану теку. Формат стабільний — збірка детермінована. */
export function writeFormLimits(dir) {
	const file = join(dir, 'form.limits.json');
	writeFileSync(file, JSON.stringify(formLimits(), null, '\t') + '\n');
	return file;
}
