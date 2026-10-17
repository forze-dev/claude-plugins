/**
 * The single source of truth for the whole site.
 *
 * Everything below is rendered AT BUILD TIME — the header, footer, every
 * JSON-LD block, the microdata, robots.txt, the web manifest, the sitemap, the
 * request modal, the PHP back end and .htaccess read from here. Change a phone
 * number in this file and it changes everywhere, including the static HTML
 * search engines see.
 *
 * Starting a new project? This file and `src/styles/base/variables.css` are
 * usually the only two to open before writing the landing copy.
 */

/**
 * National number format. Drives the form mask (`src/scripts/form.js`), the
 * placeholder and the visible phone text — so changing the country rewrites
 * everything at once.
 */
const PHONE_FORMAT = {
	countryCode: '+1',
	/** Number of digits after the country code. */
	digits: 10,
	/** Group sizes, e.g. [3, 3, 4] → (555) 010-2030 */
	groups: [3, 3, 4],
};

/** E.164 → digits only: wa.me links don't accept a plus sign. */
const digitsOf = (e164) => e164.replace(/[^0-9]/g, '');

/**
 * National digits → visible text by the mask: `+1 (555) 010-2030`. The form
 * mask (`src/scripts/form.js`) uses this same function, so the site has one
 * format, not two that can drift apart.
 */
export const formatNational = (national) => {
	let cursor = 0;
	return PHONE_FORMAT.groups.reduce((result, size, index) => {
		const chunk = national.slice(cursor, cursor + size);
		cursor += size;
		if (!chunk) return result;
		return result + (index === 1 ? ') ' : index > 1 ? '-' : '') + chunk;
	}, `${PHONE_FORMAT.countryCode} (`);
};

const displayPhone = (e164) => formatNational(digitsOf(e164).slice(digitsOf(PHONE_FORMAT.countryCode).length));

/**
 * The ONLY place in the project where a phone number exists as a literal.
 * E.164, no spaces. `tel:` links, the visible text, `wa.me` and `telephone`
 * in the structured data are all derived from it. The first number is the main one.
 */
const PHONES = ['+15550102030'];

/** File size limit in megabytes — bytes, messages and .htaccess are derived from it. */
const MAX_FILE_MB = 20;

export const SITE = {
	/** Canonical domain, no trailing slash. It is also `site` in astro.config.mjs. */
	url: 'https://example.com',

	name: 'Forze Landing Demo',
	/** Shown in the header and on the phone home screen; up to ~14 characters. */
	shortName: 'Forze Demo',
	/** Business description: the home page meta description, the footer and `description` in JSON-LD. */
	description:
		'A one-page website for a small business: what we do, how we work, answers to common questions and a request form that lands in Telegram.',

	/**
	 * Business entity type — drives both JSON-LD and microdata at once.
	 *
	 * `LocalBusiness` or any subtype (`Restaurant`, `Dentist`,
	 * `HomeAndConstructionBusiness`…) — when the client has a physical address.
	 * `Organization` — when the business exists only online: then geo and
	 * opening hours disappear from the markup, because schema.org doesn't allow
	 * them outside `Place`.
	 */
	businessType: 'LocalBusiness',

	/** Price range for LocalBusiness, e.g. '$$'. `null` — not output. */
	priceRange: null,

	lang: 'en',
	locale: 'en_US',
	themeColor: '#14532d',
	author: 'Forze',
	/** Link in the footer's "Made by" line. `null` — the line is not output. */
	authorUrl: null,

	/**
	 * Where the form posts. The PHP back end (`server/form.php`) is placed into
	 * `dist/scripts/form.php` by `npm run build`. The value is fixed: the
	 * landing is built for Apache / cPanel.
	 */
	formEndpoint: '/scripts/form.php',

	contacts: {
		email: 'hello@example.com',
		/**
		 * `href` — E.164 for tel: links and structured data, `display` — what a
		 * person reads. Both derive from `PHONES`, so they can't drift apart.
		 */
		phones: PHONES.map((href) => ({ display: displayPhone(href), href })),
		/** `null` if there is no physical address (then also businessType: 'Organization'). */
		address: {
			street: '350 Fifth Avenue',
			locality: 'New York',
			region: 'NY',
			postalCode: '10118',
			/** ISO 3166-1 alpha-2 — this goes into the structured data. */
			country: 'US',
			/** Country name in words: a person reads it in the contacts section. */
			countryName: 'United States',
		},
		/** `null` if there are no coordinates. */
		geo: { latitude: 40.74844, longitude: -73.985664 },
		/** An empty array — the hours block is not output. */
		hours: [
			{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00', label: 'Mon – Fri: 9:00 – 18:00' },
		],
	},

	/** Rendered in the mobile menu, the hero, the footer and the floating bar. */
	messengers: [
		{ id: 'telegram', name: 'Telegram', href: 'https://t.me/example', icon: '/assets/icons/telegram.svg', brand: '#229ED9' },
		{ id: 'whatsapp', name: 'WhatsApp', href: `https://wa.me/${digitsOf(PHONES[0])}`, icon: '/assets/icons/whatsapp.svg', brand: '#25D366' },
	],

	/**
	 * Third-party scripts. Empty by default — the scaffold ships no trackers.
	 * Set an id and the snippet is injected ONLY IN THE PRODUCTION BUILD.
	 * Use one: Tag Manager already contains GA4.
	 */
	analytics: {
		gtmId: null, // 'GTM-XXXXXXX'
		gaId: null, //  'G-XXXXXXXXXX'
	},

	/** Repeated as `sameAs` in both the JSON-LD and the business microdata. */
	social: ['https://instagram.com/example'],

	/**
	 * Menu. The landing is one page, so items point to section anchors. The
	 * address always starts with `/` so the menu also works from the privacy
	 * policy page. The anchor must match a section `id` in index.astro.
	 */
	nav: [
		{ label: 'Services', href: '/#services' },
		{ label: 'How we work', href: '/#steps' },
		{ label: 'FAQ', href: '/#faq' },
		{ label: 'Contacts', href: '/#contacts' },
	],

	/**
	 * Form limits. The ONE source of truth for every consumer: the browser
	 * (`src/scripts/form.js`), the PHP back end (`server/form.php` reads
	 * `form.limits.json`, generated from here by the build) and `.htaccess`
	 * (the PHP upload limits are substituted by the build too).
	 */
	form: {
		maxFileMb: MAX_FILE_MB,
		maxFileSize: MAX_FILE_MB * 1024 * 1024,
		allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],

		/**
		 * Signatures (magic bytes) in hex — what a file REALLY is.
		 *
		 * The MIME type from the browser is not checked at all: it comes from
		 * the client, so it proves nothing. The back end compares the file's first
		 * bytes with this table, by extension. `docx` is a zip, so it shares the
		 * zip signature.
		 */
		signatures: {
			pdf: ['25504446'],
			jpg: ['ffd8ff'],
			jpeg: ['ffd8ff'],
			png: ['89504e470d0a1a0a'],
			doc: ['d0cf11e0a1b11ae1'],
			docx: ['504b0304', '504b0506', '504b0708'],
		},

		/** The shortest plausible time to fill the form, in seconds. Less — a bot. */
		minFillSeconds: 3,
		/** Minimum interval between requests from one IP, in seconds. */
		rateLimitSeconds: 20,
		/** Truncation of a single text field, in characters. */
		maxFieldLength: 2000,
		/** Telegram limits: sendMessage — 4096, the caption in sendDocument — 1024. */
		telegramTextLimit: 4096,
		telegramCaptionLimit: 1024,
		/** Phone mask. The format lives in `PHONE_FORMAT` at the top of the file. */
		phone: {
			...PHONE_FORMAT,
			/** Optional. Defaults to the first number in contacts.phones. */
			placeholder: null,
		},
		successUrl: '/thank-you',
	},

	/**
	 * Form strings the user sees. `{size}` and `{types}` are substituted from
	 * `form` above (see `fillMessage`), so changing the limit never leaves a
	 * stale number in the text.
	 */
	messages: {
		nameRequired: 'Please enter your name.',
		phoneRequired: 'Please enter a complete phone number.',
		fileTooLarge: 'That file is too large. Maximum size is {size} MB.',
		fileWrongType: 'Unsupported file type. Allowed: {types}.',
		fileNote: '{types}, up to {size} MB.',
		sending: 'Sending…',
		sendError: 'The request could not be sent. Please try again or call us.',
		tooManyRequests: 'You have just sent a request. Please wait a moment and try again.',
		networkError: 'Connection failed. Check your internet connection and try again.',
	},

	/**
	 * Interface strings of the site chrome: header, footer, modal, form, aria
	 * labels. Section copy is content and lives in index.astro. For another site
	 * language, translate `messages`, `ui` and the page content.
	 */
	ui: {
		skipLink: 'Skip to content',
		home: 'Home',
		menuOpen: 'Open menu',
		menuClose: 'Close menu',
		mainNav: 'Main',
		cta: 'Request a call',
		call: 'Call',
		messageOn: 'Message on',
		chatWithUs: 'Chat with us',
		footerMenu: 'Menu',
		footerHours: 'Opening hours',
		footerContacts: 'Contacts',
		rights: 'All rights reserved.',
		privacy: 'Privacy policy',
		madeBy: 'Made by',
		modalTitle: 'Leave a request',
		modalSubtitle: 'Tell us briefly what you need and we will call you back.',
		modalPreferToTalk: 'Prefer to talk?',
		close: 'Close',
		formName: 'Your name',
		formPhone: 'Phone',
		email: 'Email',
		address: 'Address',
		formComment: 'What do you need?',
		formCommentPlaceholder: 'A short description',
		formAttach: 'Attach a file',
		formRemoveFile: 'Remove file',
		formSubmit: 'Send request',
		formConsent: 'By sending this form you agree to our',
		breadcrumb: 'Breadcrumb',
	},
};

/** Substitutes `{size}` and `{types}` in a string from `messages`. */
export const fillMessage = (text) =>
	text
		.replaceAll('{size}', String(SITE.form.maxFileMb))
		.replaceAll(
			'{types}',
			[...new Set(SITE.form.allowedExtensions.map((ext) => (ext === 'jpeg' ? 'jpg' : ext).toUpperCase()))].join(', ')
		);

/**
 * schema.org allows geo and opening hours only on `Place`. `LocalBusiness` is
 * both an `Organization` and a `Place`; a plain `Organization` is not. The flag
 * is computed here once and read by both JSON-LD and microdata — so the
 * formats can't diverge.
 */
export const isPlace = SITE.businessType !== 'Organization';

export default SITE;
