#!/usr/bin/env node
/**
 * Environment check before creating a landing.
 *
 *   node doctor.mjs
 *
 * Installs nothing and changes nothing — it only reports what is present and
 * what is missing, as a JSON line (for the agent) and a table (for the person).
 * The decision to install is the person's: the skill shows the list and waits
 * for confirmation.
 *
 * Exit code: 0 — everything required is present; 1 — something required is
 * missing (Node 22.12+, npm). PHP and git are recommended, not required:
 * without PHP the form can't be tested locally, without git the project is
 * kept without commits.
 */

import { spawnSync } from 'node:child_process';
import { platform, release } from 'node:os';

const run = (command, args) => {
	// A shell is needed on Windows for npm (it is npm.cmd, not an exe).
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
	php: { found: phpText, ok: atLeast(phpVersion, [8, 1]), required: '>=8.1', mandatory: false, why: 'testing the form locally' },
	git: { found: gitText, ok: Boolean(gitText), mandatory: false, why: 'a commit after every stage' },
};

const missingMandatory = Object.entries(report).filter(([, v]) => v.mandatory && !v.ok).map(([k]) => k);
const missingOptional = Object.entries(report).filter(([, v]) => v.mandatory === false && !v.ok).map(([k]) => k);

console.log(JSON.stringify({ ...report, missingMandatory, missingOptional }));
console.log('');
for (const [name, info] of Object.entries(report)) {
	if (name === 'os') continue;
	const mark = info.ok ? 'ok  ' : info.mandatory ? 'MISS' : 'miss';
	console.log(`  ${mark}  ${name.padEnd(4)} ${info.found ?? '—'}${info.required ? `   (needs ${info.required})` : ''}`);
}

process.exit(missingMandatory.length ? 1 : 0);
