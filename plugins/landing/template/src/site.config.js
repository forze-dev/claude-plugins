/**
 * Єдине джерело правди для всього сайту.
 *
 * Усе нижче рендериться ПІД ЧАС ЗБІРКИ — хедер, футер, кожен блок JSON-LD,
 * мікророзмітка, robots.txt, веб-маніфест, sitemap, модалка заявки, PHP-бекенд
 * і .htaccess читають звідси. Зміни телефон у цьому файлі — і він зміниться
 * всюди, включно зі статичним HTML, який бачать пошуковики.
 *
 * Починаєш новий проєкт? Цей файл і `src/styles/base/variables.css` — зазвичай
 * єдині два, які треба відкрити до того, як писати контент лендингу.
 */

/**
 * Формат національного номера. Живить маску у формі (`src/scripts/form.js`),
 * плейсхолдер і видимий текст номерів — тож зміна країни переписує все одразу.
 */
const PHONE_FORMAT = {
	countryCode: '+1',
	/** Кількість цифр після коду країни. */
	digits: 10,
	/** Розміри груп, напр. [3, 3, 4] → (555) 010-2030 */
	groups: [3, 3, 4],
};

/** E.164 → лише цифри: посилання wa.me не приймає плюса. */
const digitsOf = (e164) => e164.replace(/[^0-9]/g, '');

/**
 * Національні цифри → видимий текст за маскою: `+1 (555) 010-2030`. Цю саму
 * функцію використовує маска у формі (`src/scripts/form.js`), тож формат один
 * на весь сайт, а не два, які можуть розійтися.
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
 * ЄДИНЕ місце в проєкті, де номер телефону існує літералом. E.164, без пробілів.
 * Звідси виводяться посилання `tel:`, видимий текст, `wa.me` і `telephone` у
 * структурованих даних. Перший номер — головний.
 */
const PHONES = ['+15550102030'];

/** Ліміт файла в мегабайтах — з нього виводяться байти, тексти й .htaccess. */
const MAX_FILE_MB = 20;

export const SITE = {
	/** Канонічний домен, без слеша в кінці. Він же — `site` в astro.config.mjs. */
	url: 'https://example.com',

	name: 'Forze Landing Demo',
	/** Показується в хедері й на домашньому екрані телефона; до ~14 символів. */
	shortName: 'Forze Demo',
	/** Опис бізнесу: meta description головної, футер і `description` у JSON-LD. */
	description:
		'A one-page website for a small business: what we do, how we work, answers to common questions and a request form that lands in Telegram.',

	/**
	 * Тип сутності бізнесу — керує і JSON-LD, і мікророзміткою одразу.
	 *
	 * `LocalBusiness` або будь-який його підтип (`Restaurant`, `Dentist`,
	 * `HomeAndConstructionBusiness`…) — коли в клієнта є фізична адреса.
	 * `Organization` — коли бізнес існує лише онлайн: тоді гео й години роботи
	 * зникають з розмітки, бо schema.org не дозволяє їх поза `Place`.
	 */
	businessType: 'LocalBusiness',

	/** Діапазон цін для LocalBusiness, напр. '$$'. `null` — не виводити. */
	priceRange: null,

	lang: 'en',
	locale: 'en_US',
	themeColor: '#14532d',
	author: 'Forze',
	/** Посилання в рядку «Зроблено» у футері. `null` — рядок не виводиться. */
	authorUrl: null,

	/**
	 * Куди постить форма. PHP-бекенд (`server/form.php`) потрапляє в
	 * `dist/scripts/form.php` під час `npm run build`. Значення фіксоване:
	 * лендинг збирається під Apache / cPanel.
	 */
	formEndpoint: '/scripts/form.php',

	contacts: {
		email: 'hello@example.com',
		/**
		 * `href` — E.164 для посилань tel: і для структурованих даних, `display` —
		 * те, що читає людина. Обидва виводяться з `PHONES`, тож розійтися не можуть.
		 */
		phones: PHONES.map((href) => ({ display: displayPhone(href), href })),
		/** `null`, якщо фізичної адреси немає (тоді й businessType: 'Organization'). */
		address: {
			street: '350 Fifth Avenue',
			locality: 'New York',
			region: 'NY',
			postalCode: '10118',
			/** ISO 3166-1 alpha-2 — це йде в структуровані дані. */
			country: 'US',
			/** Назва країни словами: її читає людина в секції контактів. */
			countryName: 'United States',
		},
		/** `null`, якщо координат немає. */
		geo: { latitude: 40.74844, longitude: -73.985664 },
		/** Порожній масив — блок годин не виводиться. */
		hours: [
			{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00', label: 'Mon – Fri: 9:00 – 18:00' },
		],
	},

	/** Рендериться в мобільному меню, у hero, у футері та в плаваючій панелі. */
	messengers: [
		{ id: 'telegram', name: 'Telegram', href: 'https://t.me/example', icon: '/assets/icons/telegram.svg', brand: '#229ED9' },
		{ id: 'whatsapp', name: 'WhatsApp', href: `https://wa.me/${digitsOf(PHONES[0])}`, icon: '/assets/icons/whatsapp.svg', brand: '#25D366' },
	],

	/**
	 * Сторонні скрипти. За замовчуванням порожньо — шаблон не містить жодних
	 * трекерів. Вкажи id, і сніпет підставиться ЛИШЕ В PRODUCTION-ЗБІРЦІ.
	 * Використовуй щось одне: Tag Manager уже містить GA4 всередині.
	 */
	analytics: {
		gtmId: null, // 'GTM-XXXXXXX'
		gaId: null, //  'G-XXXXXXXXXX'
	},

	/** Дублюється в `sameAs` і в JSON-LD, і в мікророзмітці бізнесу. */
	social: ['https://instagram.com/example'],

	/**
	 * Меню. Лендинг — одна сторінка, тож пункти ведуть на якорі секцій.
	 * Адреса завжди починається з `/`, щоб меню працювало й зі сторінки
	 * політики конфіденційності. Якір має збігатися з `id` секції в index.astro.
	 */
	nav: [
		{ label: 'Services', href: '/#services' },
		{ label: 'How we work', href: '/#steps' },
		{ label: 'FAQ', href: '/#faq' },
		{ label: 'Contacts', href: '/#contacts' },
	],

	/**
	 * Обмеження форми. ОДНЕ джерело правди на всіх споживачів: браузер
	 * (`src/scripts/form.js`), PHP-бекенд (`server/form.php` читає
	 * `form.limits.json`, який генерує збірка саме звідси) і `.htaccess`
	 * (ліміти завантаження PHP теж підставляє збірка).
	 */
	form: {
		maxFileMb: MAX_FILE_MB,
		maxFileSize: MAX_FILE_MB * 1024 * 1024,
		allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],

		/**
		 * Сигнатури (magic bytes) у hex — чим файл є НАСПРАВДІ.
		 *
		 * MIME-тип від браузера не перевіряється взагалі: він приходить від
		 * клієнта, тож нічого не доводить. Бекенд звіряє перші байти файла з цією
		 * таблицею за розширенням. `docx` — це zip, тож сигнатура спільна з zip.
		 */
		signatures: {
			pdf: ['25504446'],
			jpg: ['ffd8ff'],
			jpeg: ['ffd8ff'],
			png: ['89504e470d0a1a0a'],
			doc: ['d0cf11e0a1b11ae1'],
			docx: ['504b0304', '504b0506', '504b0708'],
		},

		/** Найкоротший правдоподібний час заповнення, секунди. Менше — бот. */
		minFillSeconds: 3,
		/** Мінімальний проміжок між заявками з однієї IP, секунди. */
		rateLimitSeconds: 20,
		/** Обрізання одного текстового поля, символів. */
		maxFieldLength: 2000,
		/** Ліміти Telegram: sendMessage — 4096, caption у sendDocument — 1024. */
		telegramTextLimit: 4096,
		telegramCaptionLimit: 1024,
		/** Маска телефону. Формат живе в `PHONE_FORMAT` на початку файлу. */
		phone: {
			...PHONE_FORMAT,
			/** Необовʼязково. За замовчуванням — перший номер із contacts.phones. */
			placeholder: null,
		},
		successUrl: '/thank-you',
	},

	/**
	 * Рядки форми, які бачить користувач. `{size}` і `{types}` підставляються з
	 * `form` вище (див. `fillMessage`), тож зміна ліміту не лишає в тексті
	 * старої цифри.
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
	 * Службові рядки обрамлення: хедер, футер, модалка, форма, aria-підписи.
	 * Текст самих секцій — це контент, він живе в index.astro. Для іншої мови
	 * сайту перекладаються `messages`, `ui` і контент сторінок.
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

/** Підставляє `{size}` і `{types}` у рядок із `messages`. */
export const fillMessage = (text) =>
	text
		.replaceAll('{size}', String(SITE.form.maxFileMb))
		.replaceAll(
			'{types}',
			[...new Set(SITE.form.allowedExtensions.map((ext) => (ext === 'jpeg' ? 'jpg' : ext).toUpperCase()))].join(', ')
		);

/**
 * Гео й години роботи schema.org дозволяє лише на `Place`. `LocalBusiness` —
 * це одночасно `Organization` і `Place`, а чистий `Organization` — ні. Прапорець
 * рахується тут один раз і читається і JSON-LD, і мікророзміткою — тож формати
 * розійтися не можуть.
 */
export const isPlace = SITE.businessType !== 'Organization';

export default SITE;
