#!/usr/bin/env node
/**
 * PreToolUse-хук плагіна landing@forze.
 *
 * Діє ЛИШЕ в проєктах, створених плагіном, — тих, де в корені є
 * `.forze/landing.json`. У будь-якому іншому проєкті хук нічого не робить:
 * плагін увімкнений глобально, і блокувати запис у чужий `dist/` він не має права.
 *
 * Що блокує (exit 2 + пояснення агенту в stderr):
 *   1. запис і правку файлів у `dist/` і `release/` — їх генерує збірка й
 *      перезаписує повністю, тож рука там завжди втрачена робота;
 *   2. `npm audit fix --force` — він міняє мажорні версії й ламає пін (правило 4);
 *   3. `npm install` / `npm i` без аргументів — він має право підтягнути інші
 *      версії, ніж у lock-файлі; для встановлення є `npm ci`.
 *
 * Помилка в самому хуку (зламаний JSON на вході тощо) не блокує роботу:
 * exit 0. Хук — страховка, а не точка відмови.
 */

import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const MARKER = join('.forze', 'landing.json');

/** Найближчий предок (або сама тека), що містить маркер проєкту. */
function projectRoot(start) {
	let dir = resolve(start);
	for (;;) {
		if (existsSync(join(dir, MARKER))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function block(message) {
	process.stderr.write(`[landing@forze] ${message}\n`);
	process.exit(2);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
	let event;
	try {
		event = JSON.parse(input);
	} catch {
		process.exit(0);
	}

	const cwd = event.cwd || process.cwd();
	const tool = event.tool_name;
	const params = event.tool_input || {};

	if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
		const raw = params.file_path || params.notebook_path;
		if (!raw) process.exit(0);
		const file = isAbsolute(raw) ? raw : resolve(cwd, raw);
		const root = projectRoot(dirname(file));
		if (!root) process.exit(0);

		const first = relative(root, file).split(sep)[0];
		if (first === 'dist' || first === 'release') {
			block(
				`${first}/ генерується збіркою і перезаписується повністю — ручна правка зникне. ` +
					`Зміни джерело: src/ (сторінки, компоненти), public/ (статичні файли), ` +
					`server/htaccess.template (.htaccess), server/form.php (бекенд), потім npm run build.`
			);
		}
		process.exit(0);
	}

	if (tool === 'Bash' || tool === 'PowerShell') {
		const root = projectRoot(cwd);
		if (!root) process.exit(0);
		const command = String(params.command || '');

		if (/\bnpm\s+audit\s+fix\b[^\n;&|]*--force/.test(command)) {
			block(
				'npm audit fix --force міняє мажорні версії й ламає пін залежностей (правило 4 у CLAUDE.md). ' +
					'Спершу оціни кожну advisory (правило 6) і обговори оновлення з розробником.'
			);
		}

		// `npm install` / `npm i` без імені пакета — переустановлення з правом
		// змінити версії. Установлення конкретного пакета не блокуємо.
		if (/\bnpm\s+(install|i)\s*($|[;&|])/m.test(command)) {
			block('Для встановлення залежностей у цьому проєкті використовуй `npm ci` — точні версії з lock-файла (правило 4).');
		}
	}

	process.exit(0);
});
