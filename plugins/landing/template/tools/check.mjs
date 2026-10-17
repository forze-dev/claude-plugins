/**
 * Pre-launch check of the built site.
 *
 * Runs as `npm run check` AFTER `npm run build` and works on `dist/` — that
 * is, on what actually goes to the hosting, not on the sources. It catches a
 * class of mistakes otherwise found only by a careful human, and visible only
 * after deployment: an OG image that doesn't exist; a placeholder domain left
 * in the canonical; a page without `<title>`; a JSON-LD block that doesn't parse.
 *
 * The script changes NOTHING — it only reads. No dependencies: plain Node.
 *
 * Exit code: 0 — all clean (warnings don't count), 1 — there are errors.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';

/**
 * Values left over from the scaffold's initial config. If they reached
 * `dist/`, the config wasn't filled in for the client, and the site would go
 * to production with someone else's contacts.
 */
const PLACEHOLDERS = [
	{ value: 'example.com', fix: 'fill in SITE.url in src/site.config.js' },
	{ value: 'hello@example.com', fix: 'fill in SITE.contacts.email' },
	{ value: 'Forze Landing Demo', fix: 'fill in SITE.name and SITE.shortName' },
	{ value: '+1 (555) 010-20', fix: 'fill in PHONES in src/site.config.js' },
	{ value: 'https://t.me/example', fix: 'fill in SITE.messengers' },
	{ value: 'instagram.com/example', fix: 'fill in SITE.social' },
	{ value: '350 Fifth Avenue', fix: 'fill in SITE.contacts.address or set address: null' },
	{
		value: 'data-demo-content',
		fix: 'scaffold demo copy is still on the page: rewrite it for the client in the site language and remove the data-demo-content attribute (index.astro, privacy-policy.astro, thank-you.astro, 404.astro)',
	},
];

const errors = [];
const warnings = [];

/** @param {string} file @param {string} problem @param {string} fix */
const error = (file, problem, fix) => errors.push({ file, problem, fix });
const warn = (file, problem, fix) => warnings.push({ file, problem, fix });

/* --------------------------------------------------------------- helpers */

/** All files in a folder, recursively, as paths relative to it: `assets/icons/pin.svg`. */
function walk(dir, base = dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full, base));
		else out.push(full.slice(base.length + 1).split('\\').join('/'));
	}
	return out;
}

/** An absolute site URL → a path inside dist, or null for another domain. */
function toLocalPath(url, siteOrigin) {
	if (url.startsWith('//')) return null;
	if (/^[a-z]+:/i.test(url)) {
		if (!siteOrigin || !url.startsWith(siteOrigin)) return null;
		url = url.slice(siteOrigin.length) || '/';
	}
	if (!url.startsWith('/')) return null;
	return url.split('#')[0].split('?')[0];
}

/**
 * Whether what the path points to exists in `dist/`. `build.format: 'file'`
 * serves `privacy-policy.html` at `/privacy-policy`, so both forms are checked.
 */
function resolves(path, files) {
	const clean = decodeURIComponent(path).replace(/^\//, '');
	if (clean === '') return files.includes('index.html');
	return (
		files.includes(clean) ||
		files.includes(clean + '.html') ||
		files.includes(posix.join(clean, 'index.html'))
	);
}

const attrs = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

/* ----------------------------------------------------------------- start */

if (!existsSync(DIST)) {
	console.error('There is no dist/ folder. Run `npm run build` first, then `npm run check`.');
	process.exit(1);
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html')).sort();

if (!pages.length) {
	console.error('dist/ contains no .html files. The build seems to have failed.');
	process.exit(1);
}

/* ------------------------------------ 1. Canonical domain and robots.txt */

/**
 * The domain is taken from the home page canonical.
 *
 * It used to come from the `Sitemap:` line in robots.txt — a hidden
 * dependency: had robots.txt ever stopped printing it, `siteOrigin` would stay
 * null and half the checks (canonicals, local OG images, absolute links) would
 * quietly weaken instead of failing. Now the source is the canonical — what
 * the search engine sees — and robots.txt is checked against it.
 */
let siteOrigin = null;

const home = files.includes('index.html') ? readFileSync(join(DIST, 'index.html'), 'utf8') : '';
const homeCanonical = home.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);

if (!homeCanonical) {
	error(
		'dist/index.html',
		'no <link rel="canonical"> — without it the canonical domain cannot be determined',
		'check src/components/Seo.astro and that the home page goes through a layout'
	);
} else {
	try {
		siteOrigin = new URL(homeCanonical[1]).origin;
	} catch {
		error('dist/index.html', `canonical is not an absolute URL: ${homeCanonical[1]}`, 'check SITE.url in src/site.config.js');
	}
}

if (!files.includes('robots.txt')) {
	error('dist/robots.txt', 'file is missing', 'check src/pages/robots.txt.js');
} else {
	const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
	const sitemapLine = robots.match(/^Sitemap:\s*(\S+)/mi);
	if (!sitemapLine) {
		error('dist/robots.txt', 'no Sitemap: line', 'add it in src/pages/robots.txt.js');
	} else {
		try {
			const sitemapUrl = new URL(sitemapLine[1]);
			if (siteOrigin && sitemapUrl.origin !== siteOrigin) {
				error(
					'dist/robots.txt',
					`Sitemap points to ${sitemapUrl.origin}, but the site canonical is ${siteOrigin}`,
					'both must come from SITE.url — check src/pages/robots.txt.js'
				);
			}
			const local = sitemapUrl.pathname.replace(/^\//, '');
			if (!files.includes(local)) {
				error(
					'dist/robots.txt',
					`Sitemap points to ${sitemapUrl.pathname}, but dist/ has no such file`,
					'check the @astrojs/sitemap integration in astro.config.mjs'
				);
			}
		} catch {
			error('dist/robots.txt', `Sitemap is not an absolute URL: ${sitemapLine[1]}`, 'it must be a full URL with the domain');
		}
	}
}

/* ------------------------------------------------------- 2. per-page checks */

for (const page of pages) {
	const where = `dist/${page}`;
	const html = readFileSync(join(DIST, page), 'utf8');

	/* --- required tags --- */

	const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
	if (!title || !title[1].trim()) {
		error(where, 'no <title> or it is empty', 'pass title to Base/Bare');
	}

	const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
	if (!description || !description[1].trim()) {
		error(where, 'no <meta name="description"> or it is empty', 'pass description to Base/Bare');
	} else if (description[1].length > 165) {
		warn(where, `description is ${description[1].length} characters — Google truncates after ~160`, 'shorten the page description');
	}

	const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
	if (!canonical) {
		error(where, 'no <link rel="canonical">', 'the canonical is set by src/components/Seo.astro — check the page goes through a layout');
	} else if (siteOrigin && !canonical[1].startsWith(siteOrigin)) {
		error(where, `canonical (${canonical[1]}) is not on the site domain (${siteOrigin})`, 'check SITE.url in src/site.config.js');
	} else if (canonical[1].endsWith('.html')) {
		error(where, `canonical points to .html: ${canonical[1]}`, 'normalize the path with cleanPath() from src/lib/path.js');
	}

	/* --- OG and Twitter images --- */

	const images = [
		...attrs(html, /<meta\s+property="og:image"\s+content="([^"]*)"/g),
		...attrs(html, /<meta\s+name="twitter:image"\s+content="([^"]*)"/g),
	];
	for (const image of new Set(images)) {
		const local = toLocalPath(image, siteOrigin);
		if (local === null) {
			warn(where, `og/twitter:image points to another domain: ${image}`, 'social networks don\'t always fetch foreign images — better put the file in public/');
			continue;
		}
		if (!files.includes(local.replace(/^\//, ''))) {
			error(
				where,
				`og/twitter:image points to ${local}, but dist/ has no such file`,
				'put a 1200×630 image in public' + local.replace(/\/[^/]+$/, '/') + ' or pass an existing one via the ogImage prop'
			);
		}
	}

	/* --- JSON-LD --- */

	const blocks = attrs(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
	blocks.forEach((raw, index) => {
		try {
			JSON.parse(raw);
		} catch (e) {
			error(where, `ld+json block #${index + 1} does not parse: ${e.message}`, 'check the helpers in src/lib/schema.js — usually an unescaped quote in the content');
		}
	});

	/* --- duplicate ids --- */

	const idList = attrs(html, /\sid="([^"]+)"/g);
	const seen = new Set();
	const dupes = new Set();
	for (const id of idList) (seen.has(id) ? dupes : seen).add(id);
	if (dupes.size) {
		error(
			where,
			`duplicate ids in the document: ${[...dupes].join(', ')}`,
			'usually a form placed both on the page and in the modal — ids must be unique within a document'
		);
	}

	/* --- local links and resources --- */

	const refs = [
		...attrs(html, /\shref="([^"]+)"/g),
		...attrs(html, /\ssrc="([^"]+)"/g),
	];
	const broken = new Set();
	for (const ref of refs) {
		if (ref.startsWith('#') || /^(mailto|tel|viber|whatsapp|data|javascript):/i.test(ref)) continue;
		const local = toLocalPath(ref, siteOrigin);
		if (local === null) continue;
		if (!resolves(local, files)) broken.add(local);
	}
	for (const path of broken) {
		error(where, `link to ${path} leads nowhere`, 'either create the page/file or fix the address');
	}

	/* --- .html in links --- */

	const htmlLinks = refs.filter((r) => /^\/[^/].*\.html$/.test(r));
	if (htmlLinks.length) {
		error(
			where,
			`links to .html: ${[...new Set(htmlLinks)].join(', ')}`,
			'link to the clean address (/privacy-policy); the hosting serves the file itself'
		);
	}
}

/* --------------------------------------------- 3. placeholder values in dist/ */

const textFiles = files.filter((f) => /\.(html|xml|txt|json|webmanifest|js|css)$/.test(f));

for (const { value, fix } of PLACEHOLDERS) {
	const hits = textFiles.filter((f) => readFileSync(join(DIST, f), 'utf8').includes(value));
	if (hits.length) {
		const shown = hits.slice(0, 4).map((h) => 'dist/' + h).join(', ');
		error(
			`${shown}${hits.length > 4 ? ` and ${hits.length - 4} more` : ''}`,
			`placeholder value "${value}" is still there (${hits.length} file(s))`,
			fix
		);
	}
}

/* -------------------------------------------------- 4. files for PHP hosting */

/**
 * Without these files the form won't work on cPanel while the site looks
 * whole — meaning the client finds the bug, not us.
 */
const REQUIRED = [
	{ path: 'scripts/form.php', fix: 'build with `npm run build` (tools/build.mjs), not `astro build` directly' },
	{ path: 'scripts/form.limits.json', fix: 'build with `npm run build` (tools/build.mjs)' },
	{ path: '.htaccess', fix: 'build with `npm run build`: .htaccess is generated from server/htaccess.template' },
	{ path: '404.html', fix: 'check src/pages/404.astro' },
];

for (const { path, fix } of REQUIRED) {
	if (!files.includes(path)) error(`dist/${path}`, 'file is missing', fix);
}

if (files.includes('.htaccess') && readFileSync(join(DIST, '.htaccess'), 'utf8').includes('__')) {
	error('dist/.htaccess', 'unsubstituted __…__ markers remain', 'check the replacements in tools/build.mjs and server/htaccess.template');
}

for (const file of files) {
	if (/(^|\/)\.env(\..*)?$/.test(file)) {
		error(`dist/${file}`, 'a credentials file is in the build', 'remove it from public/: .env lives outside the repository and outside public_html');
	}
}

/* ------------------------------------------------- 5. scaffold favicons */

/**
 * The scaffold's own favicons, by SHA-256. A warning, not an error: a client
 * without a logo may launch with them — but it must be a decision, not an
 * oversight.
 */
const SCAFFOLD_FAVICONS = new Set([
	'4272b87a6a12507dcd36978588d0a9fe7d0e09b32c00c1485cb81e290c2b4bdc',
	'ee435a96f3fee6fbb148f44ada20e4571f36fed3a8deb58c78f689ba5c14c2aa',
	'18afb9b03872572813987921a325fef917b63fc708348bd74f588609f7952ee8',
	'9b498caaa6d0ae61f3ffe2f0bc6b7237eb41ce79ae248a510021e98bf15a6c11',
	'd5ea1586facca8b506cbeb08f6326383beaaacef2eaa8d3448035f79685efe83',
	'b230d88ae9a7d242be1867478c8dd93ce196b6a4975f87dadb511b1ea16f71e7',
]);

const leftover = files.filter(
	(f) => /^(favicon|apple-touch-icon|android-chrome)/.test(f) && SCAFFOLD_FAVICONS.has(createHash('sha256').update(readFileSync(join(DIST, f))).digest('hex'))
);
if (leftover.length) {
	warn(
		leftover.map((f) => 'dist/' + f).join(', '),
		'these are still the scaffold favicons',
		"put the client's favicon set into public/ (same file names), or confirm with the client that the scaffold ones stay"
	);
}

/* ----------------------------------------------------------------- output */

const line = (item) => `  ${item.file}\n      ${item.problem}\n      → ${item.fix}`;

if (warnings.length) {
	console.log(`\nWarnings (${warnings.length}) — not blocking:\n`);
	console.log(warnings.map(line).join('\n\n'));
}

if (errors.length) {
	console.log(`\nErrors (${errors.length}):\n`);
	console.log(errors.map(line).join('\n\n'));
	console.log(`\nChecked ${pages.length} pages in dist/. Launch blocked.\n`);
	process.exit(1);
}

console.log(`\nChecked ${pages.length} pages in dist/ — no errors.\n`);
