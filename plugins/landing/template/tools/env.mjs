/**
 * Credentials template for the hosting: `npm run env`.
 *
 * Writes `.env.<domain>` (e.g. `.env.promo.abect.com`) at the project root,
 * with every variable the back end reads left EMPTY and a note on where to get
 * each value. The developer fills it in and uploads it to the `secrets/` folder
 * one level above public_html — never into public_html, never into dist/.
 *
 * Never overwrites an existing file: it may already hold real credentials.
 *
 * Adding a lead receiver (email/SMTP, a CRM, a webhook) means adding its
 * variables to RECEIVERS below and reading them in server/form.php — both from
 * the receiver's current documentation, never from memory.
 */

import { existsSync, writeFileSync } from 'node:fs';

import { SITE } from '../src/site.config.js';

/** Variables per receiver: name, where to get the value. */
const RECEIVERS = {
	telegram: [
		{
			name: 'TELEGRAM_BOT_TOKEN',
			how: [
				'Telegram → @BotFather → /newbot → choose a name and a username ending in "bot".',
				'BotFather replies with a token like 123456789:AA… — paste it here.',
			],
		},
		{
			name: 'CHAT_ID',
			how: [
				'Add the bot to the group that should receive requests and post any message there.',
				'Open https://api.telegram.org/bot<TOKEN>/getUpdates and copy "chat":{"id":…}.',
				'Group ids start with -100. Empty getUpdates → BotFather → /setprivacy → Disable.',
			],
		},
	],
};

const host = new URL(SITE.url).hostname;
const file = `.env.${host}`;
const receivers = SITE.form.receivers ?? ['telegram'];

if (existsSync(file)) {
	console.log(`\n${file} already exists — not overwritten (it may hold real credentials).`);
	process.exit(0);
}

const unknown = receivers.filter((id) => !RECEIVERS[id]);
if (unknown.length) {
	console.error(`Unknown receiver(s) in SITE.form.receivers: ${unknown.join(', ')}. Add their variables to tools/env.mjs.`);
	process.exit(1);
}

const lines = [
	`# Credentials for ${host} — the request form back end (scripts/form.php).`,
	'#',
	'# Fill in the empty values, then upload this file to the hosting:',
	'#',
	'#   /home/<user>/secrets/.env.' + host + '   ← here (create the secrets folder)',
	'#   /home/<user>/public_html/              ← the site; this file must NEVER be here',
	'#',
	'# It must never be inside public_html or in the dist/ folder: anything there',
	'# can be downloaded by anyone. Never commit it to git.',
	'',
];

for (const id of receivers) {
	for (const variable of RECEIVERS[id]) {
		lines.push(...variable.how.map((line) => `# ${line}`), `${variable.name}=`, '');
	}
}

writeFileSync(file, lines.join('\n'));
console.log(`\nCreated ${file} with empty values.`);
console.log(`  Fill it in and upload it to /home/<user>/secrets/ on the hosting — one level above public_html.`);
