#!/usr/bin/env node
/**
 * Перевірка середовища перед створенням лендингу.
 *
 *   node doctor.mjs
 *
 * Нічого не встановлює і нічого не змінює — лише повідомляє, що є і чого
 * бракує, рядком JSON (для агента) і таблицею (для людини). Рішення про
 * встановлення ухвалює людина: скіл показує їй список і чекає підтвердження.
 *
 * Код виходу: 0 — усе обовʼязкове є; 1 — бракує обовʼязкового (Node 22.12+, npm).
 * PHP і git — бажані, не обовʼязкові: без PHP не перевірити форму локально,
 * без git проєкт ведеться без комітів.
 */

import { spawnSync } from 'node:child_process';
import { platform, release } from 'node:os';

const run = (command, args) => {
	// shell потрібен на Windows для npm (це npm.cmd, а не exe).
	const result = spawnSync(command, args, { encoding: 'utf8', shell: process.platform === 'win32' });
	if (result.status !== 0) return null;
	return (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0];
};

const parse = (text) => {
	const match = /(\d+)\.(\d+)\.(\d+)/.exec(text ?? '');
	return match ? match.slice(1).map(Number) : null;
};

const atLeast = (version, [major, minor]) =>
	Boolean(version) && (version[0] > major || (version[0] === major && version[1] >= minor));

const nodeVersion = parse(process.version);
const npmText = run('npm', ['-v']);
const phpText = run('php', ['-v']);
const gitText = run('git', ['--version']);
const phpVersion = parse(phpText);

const report = {
	os: { platform: platform(), release: release() },
	node: { found: process.version, ok: atLeast(nodeVersion, [22, 12]), required: '>=22.12', mandatory: true },
	npm: { found: npmText, ok: Boolean(npmText), mandatory: true },
	php: { found: phpText, ok: atLeast(phpVersion, [8, 1]), required: '>=8.1', mandatory: false, why: 'перевірка форми локально' },
	git: { found: gitText, ok: Boolean(gitText), mandatory: false, why: 'коміти після кожного етапу' },
};

const missingMandatory = Object.entries(report).filter(([, v]) => v.mandatory && !v.ok).map(([k]) => k);
const missingOptional = Object.entries(report).filter(([, v]) => v.mandatory === false && !v.ok).map(([k]) => k);

console.log(JSON.stringify({ ...report, missingMandatory, missingOptional }));
console.log('');
for (const [name, info] of Object.entries(report)) {
	if (name === 'os') continue;
	const mark = info.ok ? 'ok  ' : info.mandatory ? 'НЕМА' : 'нема';
	console.log(`  ${mark}  ${name.padEnd(4)} ${info.found ?? '—'}${info.required ? `   (потрібно ${info.required})` : ''}`);
}

process.exit(missingMandatory.length ? 1 : 0);
