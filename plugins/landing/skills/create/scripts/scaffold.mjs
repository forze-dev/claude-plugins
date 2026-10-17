#!/usr/bin/env node
/**
 * Copies the landing scaffold into a new folder.
 *
 *   node scaffold.mjs --template <path to template> --target <new folder> [--lang <language>]
 *
 * Copies the scaffold without artifacts (node_modules, dist, release, .astro)
 * and nothing more: dependencies, git and configuration are separate skill
 * steps, so each can be checked and explained to the person.
 *
 * `--lang` is the conversation language (in English, e.g. "Ukrainian"). It is
 * written into rule 1 of the new project's CLAUDE.md, between the
 * `forze:lang` markers, so every later session talks to the developer in it —
 * without translating the docs themselves.
 *
 * Refuses if the target exists and is not empty: overwriting someone's project
 * is worse than stopping to ask again.
 */

import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';

const arg = (name) => {
	const index = process.argv.indexOf(`--${name}`);
	return index > -1 ? process.argv[index + 1] : undefined;
};

const template = arg('template');
const target = arg('target');
const language = (arg('lang') ?? 'English').trim();

if (!template || !target) {
	console.error('Usage: node scaffold.mjs --template <path to template> --target <new folder> [--lang <language>]');
	process.exit(2);
}

if (!/^[\p{L} ()-]{2,40}$/u.test(language)) {
	console.error(`--lang must be a language name, e.g. "Ukrainian". Got: ${language}`);
	process.exit(2);
}

const from = resolve(template);
const to = resolve(target);

if (!existsSync(from) || !existsSync(resolve(from, 'src', 'site.config.js'))) {
	console.error(`Scaffold not found: ${from}`);
	process.exit(2);
}

if (existsSync(to) && (!statSync(to).isDirectory() || readdirSync(to).length > 0)) {
	console.error(`Folder ${to} already exists and is not empty. Pick another name or an empty folder — existing files are never overwritten.`);
	process.exit(3);
}

/** Build artifacts and local files that must not travel into a new project. */
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

const claudeMd = resolve(to, 'CLAUDE.md');
const rules = readFileSync(claudeMd, 'utf8');
const marked = /<!-- forze:lang -->[^<]*<!-- \/forze:lang -->/g;
if (!marked.test(rules)) {
	console.error('CLAUDE.md has no forze:lang markers — the scaffold is damaged.');
	process.exit(4);
}
writeFileSync(claudeMd, rules.replace(marked, `<!-- forze:lang -->${language}<!-- /forze:lang -->`));

/** The package takes the project's name, not the scaffold's: npm and editors show it. */
const packageFile = resolve(to, 'package.json');
const pkg = JSON.parse(readFileSync(packageFile, 'utf8'));
pkg.name = basename(to).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || pkg.name;
writeFileSync(packageFile, JSON.stringify(pkg, null, '\t') + '\n');

const count = (dir) =>
	readdirSync(dir).reduce((sum, entry) => {
		const full = resolve(dir, entry);
		return sum + (statSync(full).isDirectory() ? count(full) : 1);
	}, 0);

console.log(JSON.stringify({ ok: true, target: to, project: basename(to), language, files: count(to) }));
