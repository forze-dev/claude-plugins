/**
 * Передзапускова перевірка зібраного сайту.
 *
 * Запускається як `npm run check` ПІСЛЯ `npm run build` і працює по `dist/` —
 * тобто по тому, що реально поїде на хостинг, а не по сирцях. Ловить клас
 * помилок, які інакше знаходить лише уважність людини і які видно вже після
 * деплою: OG-зображення, якого немає; домен-заглушка, що лишився в canonical;
 * сторінка без `<title>`; блок JSON-LD, який не парситься.
 *
 * Скрипт НІЧОГО не змінює — лише читає. Жодних залежностей: чистий Node.
 *
 * Код виходу: 0 — усе чисто (попередження не рахуються), 1 — є помилки.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';

/**
 * Значення, які лишилися з початкового конфіга шаблону. Якщо вони доїхали до
 * `dist/` — конфіг під клієнта не заповнили, і сайт піде в продакшен з чужими
 * контактами.
 */
const PLACEHOLDERS = [
	{ value: 'example.com', fix: 'заповни SITE.url у src/site.config.js' },
	{ value: 'hello@example.com', fix: 'заповни SITE.contacts.email' },
	{ value: 'Forze Landing Demo', fix: 'заповни SITE.name і SITE.shortName' },
	{ value: '+1 (555) 010-20', fix: 'заповни PHONES у src/site.config.js' },
	{ value: 'https://t.me/example', fix: 'заповни SITE.messengers' },
	{ value: 'instagram.com/example', fix: 'заповни SITE.social' },
	{ value: '350 Fifth Avenue', fix: 'заповни SITE.contacts.address або постав address: null' },
	{
		value: 'data-demo-content',
		fix: 'демо-текст шаблону ще на сторінці: заміни його справжнім і прибери атрибут data-demo-content (index.astro, privacy-policy.astro)',
	},
];

const errors = [];
const warnings = [];

/** @param {string} file @param {string} problem @param {string} fix */
const error = (file, problem, fix) => errors.push({ file, problem, fix });
const warn = (file, problem, fix) => warnings.push({ file, problem, fix });

/* ------------------------------------------------------------- допоміжне */

/** Усі файли в теці, рекурсивно, шляхами відносно неї: `assets/icons/pin.svg`. */
function walk(dir, base = dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full, base));
		else out.push(full.slice(base.length + 1).split('\\').join('/'));
	}
	return out;
}

/** Абсолютний URL сайту → шлях усередині dist, або null для чужого домену. */
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
 * Чи існує в `dist/` те, на що вказує шлях. `build.format: 'file'` віддає
 * `privacy-policy.html` за адресою `/privacy-policy`, тож перевіряються обидва варіанти.
 */
function resolves(path, files) {
	const clean = decodeURIComponent(path).replace(/^\//, '');
	if (clean === '' ) return files.includes('index.html');
	return (
		files.includes(clean) ||
		files.includes(clean + '.html') ||
		files.includes(posix.join(clean, 'index.html'))
	);
}

const attrs = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

/* ----------------------------------------------------------------- старт */

if (!existsSync(DIST)) {
	console.error('Теки dist/ немає. Спершу `npm run build`, потім `npm run check`.');
	process.exit(1);
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html')).sort();

if (!pages.length) {
	console.error('У dist/ немає жодного .html. Схоже, збірка не відпрацювала.');
	process.exit(1);
}

/* ------------------------------------- 1. Канонічний домен і robots.txt */

/**
 * Домен береться з canonical головної сторінки.
 *
 * Раніше він брався з рядка `Sitemap:` у robots.txt — і це була прихована
 * залежність: якби robots.txt колись перестав його виводити, `siteOrigin`
 * лишився б null, а половина перевірок (канонічність, локальні OG-зображення,
 * абсолютні посилання) мовчки ослабла б, не впавши. Тепер джерело — canonical,
 * тобто те саме, що бачить пошуковик, а robots.txt звіряється з ним.
 */
let siteOrigin = null;

const home = files.includes('index.html') ? readFileSync(join(DIST, 'index.html'), 'utf8') : '';
const homeCanonical = home.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);

if (!homeCanonical) {
	error(
		'dist/index.html',
		'немає <link rel="canonical"> — без нього неможливо визначити канонічний домен сайту',
		'перевір src/components/Seo.astro і те, що головна сторінка йде через layout'
	);
} else {
	try {
		siteOrigin = new URL(homeCanonical[1]).origin;
	} catch {
		error('dist/index.html', `canonical не є абсолютним URL: ${homeCanonical[1]}`, 'звір SITE.url у src/site.config.js');
	}
}

if (!files.includes('robots.txt')) {
	error('dist/robots.txt', 'файла немає', 'перевір src/pages/robots.txt.js');
} else {
	const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
	const sitemapLine = robots.match(/^Sitemap:\s*(\S+)/mi);
	if (!sitemapLine) {
		error('dist/robots.txt', 'немає рядка Sitemap:', 'додай його в src/pages/robots.txt.js');
	} else {
		try {
			const sitemapUrl = new URL(sitemapLine[1]);
			if (siteOrigin && sitemapUrl.origin !== siteOrigin) {
				error(
					'dist/robots.txt',
					`Sitemap веде на ${sitemapUrl.origin}, а canonical сайту — ${siteOrigin}`,
					'обидва мають виводитись із SITE.url — перевір src/pages/robots.txt.js'
				);
			}
			const local = sitemapUrl.pathname.replace(/^\//, '');
			if (!files.includes(local)) {
				error(
					'dist/robots.txt',
					`Sitemap вказує на ${sitemapUrl.pathname}, а такого файла в dist/ немає`,
					'перевір інтеграцію @astrojs/sitemap в astro.config.mjs'
				);
			}
		} catch {
			error('dist/robots.txt', `Sitemap не є абсолютним URL: ${sitemapLine[1]}`, 'має бути повний URL з доменом');
		}
	}
}

/* ------------------------------------------------- 2. посторінкові перевірки */

for (const page of pages) {
	const where = `dist/${page}`;
	const html = readFileSync(join(DIST, page), 'utf8');

	/* --- обовʼязкові теги --- */

	const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
	if (!title || !title[1].trim()) {
		error(where, 'немає <title> або він порожній', 'передай title у Base/Bare');
	}

	const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
	if (!description || !description[1].trim()) {
		error(where, 'немає <meta name="description"> або він порожній', 'передай description у Base/Bare');
	} else if (description[1].length > 165) {
		warn(where, `description ${description[1].length} символів — Google обріже після ~160`, 'скороти опис сторінки');
	}

	const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
	if (!canonical) {
		error(where, 'немає <link rel="canonical">', 'canonical ставить src/components/Seo.astro — перевір, що сторінка йде через layout');
	} else if (siteOrigin && !canonical[1].startsWith(siteOrigin)) {
		error(where, `canonical (${canonical[1]}) не з домену сайту (${siteOrigin})`, 'звір SITE.url у src/site.config.js');
	} else if (canonical[1].endsWith('.html')) {
		error(where, `canonical вказує на .html: ${canonical[1]}`, 'нормалізуй шлях через cleanPath() із src/lib/path.js');
	}

	/* --- OG і Twitter зображення --- */

	const images = [
		...attrs(html, /<meta\s+property="og:image"\s+content="([^"]*)"/g),
		...attrs(html, /<meta\s+name="twitter:image"\s+content="([^"]*)"/g),
	];
	for (const image of new Set(images)) {
		const local = toLocalPath(image, siteOrigin);
		if (local === null) {
			warn(where, `og/twitter:image веде на чужий домен: ${image}`, 'соцмережі не завжди тягнуть чужі зображення — краще покласти файл у public/');
			continue;
		}
		if (!files.includes(local.replace(/^\//, ''))) {
			error(
				where,
				`og/twitter:image вказує на ${local}, а файла в dist/ немає`,
				'поклади зображення 1200×630 у public' + local.replace(/\/[^/]+$/, '/') + ' або передай наявне через проп ogImage'
			);
		}
	}

	/* --- JSON-LD --- */

	const blocks = attrs(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
	blocks.forEach((raw, index) => {
		try {
			JSON.parse(raw);
		} catch (e) {
			error(where, `блок ld+json #${index + 1} не парситься: ${e.message}`, 'перевір хелпери в src/lib/schema.js — найчастіше це незаекранована лапка в контенті');
		}
	});

	/* --- дублікати id --- */

	const idList = attrs(html, /\sid="([^"]+)"/g);
	const seen = new Set();
	const dupes = new Set();
	for (const id of idList) (seen.has(id) ? dupes : seen).add(id);
	if (dupes.size) {
		error(
			where,
			`дублікати id у документі: ${[...dupes].join(', ')}`,
			'найчастіше це форма, вставлена і на сторінці, і в модалці — id мають бути унікальні в межах документа'
		);
	}

	/* --- локальні посилання й ресурси --- */

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
		error(where, `посилання на ${path} нікуди не веде`, 'або створи сторінку/файл, або виправ адресу');
	}

	/* --- .html у посиланнях --- */

	const htmlLinks = refs.filter((r) => /^\/[^/].*\.html$/.test(r));
	if (htmlLinks.length) {
		error(
			where,
			`посилання на .html: ${[...new Set(htmlLinks)].join(', ')}`,
			'посилайся на чисту адресу (/privacy-policy), хостинг віддасть файл сам'
		);
	}
}

/* ------------------------------------------- 3. значення-заглушки в dist/ */

const textFiles = files.filter((f) => /\.(html|xml|txt|json|webmanifest|js|css)$/.test(f));

for (const { value, fix } of PLACEHOLDERS) {
	const hits = textFiles.filter((f) => readFileSync(join(DIST, f), 'utf8').includes(value));
	if (hits.length) {
		const shown = hits.slice(0, 4).map((h) => 'dist/' + h).join(', ');
		error(
			`${shown}${hits.length > 4 ? ` та ще ${hits.length - 4}` : ''}`,
			`лишилося значення-заглушка «${value}» (${hits.length} файл(ів))`,
			fix
		);
	}
}

/* ------------------------------------------- 4. файли для PHP-хостингу */

/**
 * Без цих файлів форма на cPanel не працюватиме, а сайт виглядатиме цілим —
 * тобто помилку знайде вже клієнт, а не ми.
 */
const REQUIRED = [
	{ path: 'scripts/form.php', fix: 'збирай через `npm run build` (tools/build.mjs), а не `astro build` напряму' },
	{ path: 'scripts/form.limits.json', fix: 'збирай через `npm run build` (tools/build.mjs)' },
	{ path: '.htaccess', fix: 'збирай через `npm run build`: .htaccess генерується з server/htaccess.template' },
	{ path: '404.html', fix: 'перевір src/pages/404.astro' },
];

for (const { path, fix } of REQUIRED) {
	if (!files.includes(path)) error(`dist/${path}`, 'файла немає', fix);
}

if (files.includes('.htaccess') && readFileSync(join(DIST, '.htaccess'), 'utf8').includes('__')) {
	error('dist/.htaccess', 'лишилися непідставлені маркери __…__', 'перевір заміни в tools/build.mjs і server/htaccess.template');
}

for (const file of files) {
	if (/(^|\/)\.env(\..*)?$/.test(file)) {
		error(`dist/${file}`, 'у збірці лежить файл із доступами', 'прибери його з public/: .env живе поза репозиторієм і поза public_html');
	}
}

/* ------------------------------------------------------------------ вивід */

const line = (item) => `  ${item.file}\n      ${item.problem}\n      → ${item.fix}`;

if (warnings.length) {
	console.log(`\nПопередження (${warnings.length}) — не блокують:\n`);
	console.log(warnings.map(line).join('\n\n'));
}

if (errors.length) {
	console.log(`\nПомилки (${errors.length}):\n`);
	console.log(errors.map(line).join('\n\n'));
	console.log(`\nПеревірено ${pages.length} сторінок у dist/. Запуск заблоковано.\n`);
	process.exit(1);
}

console.log(`\nПеревірено ${pages.length} сторінок у dist/ — помилок немає.\n`);
