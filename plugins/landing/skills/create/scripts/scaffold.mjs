#!/usr/bin/env node
/**
 * Розгортає каркас лендингу в нову теку.
 *
 *   node scaffold.mjs --template <шлях до template> --target <нова тека>
 *
 * Копіює каркас без артефактів (node_modules, dist, release, .astro) і нічого
 * більше: залежності, git і конфігурацію робить скіл окремими кроками, щоб
 * кожен з них можна було перевірити й пояснити людині.
 *
 * Відмовляється працювати, якщо цільова тека існує й не порожня: перезаписати
 * чужий проєкт — гірше, ніж зупинитися й перепитати.
 */

import { cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';

const arg = (name) => {
	const index = process.argv.indexOf(`--${name}`);
	return index > -1 ? process.argv[index + 1] : undefined;
};

const template = arg('template');
const target = arg('target');

if (!template || !target) {
	console.error('Використання: node scaffold.mjs --template <шлях до template> --target <нова тека>');
	process.exit(2);
}

const from = resolve(template);
const to = resolve(target);

if (!existsSync(from) || !existsSync(resolve(from, 'src', 'site.config.js'))) {
	console.error(`Каркас не знайдено: ${from}`);
	process.exit(2);
}

if (existsSync(to) && (!statSync(to).isDirectory() || readdirSync(to).length > 0)) {
	console.error(`Тека ${to} уже існує і не порожня. Обери іншу назву або порожню теку — наявні файли не перезаписуються.`);
	process.exit(3);
}

/** Артефакти збірки й локальні файли, які не мають їхати в новий проєкт. */
const SKIP = new Set(['node_modules', 'dist', 'release', '.astro']);
const SKIP_FILES = new Set([['server', 'form.limits.json'].join(sep), '.env']);

cpSync(from, to, {
	recursive: true,
	filter: (source) => {
		const rel = relative(from, source);
		if (rel === '') return true;
		if (rel.split(sep).some((part) => SKIP.has(part))) return false;
		if (SKIP_FILES.has(rel)) return false;
		return true;
	},
});

const count = (dir) =>
	readdirSync(dir).reduce((sum, entry) => {
		const full = resolve(dir, entry);
		return sum + (statSync(full).isDirectory() ? count(full) : 1);
	}, 0);

console.log(JSON.stringify({ ok: true, target: to, project: basename(to), files: count(to) }));
