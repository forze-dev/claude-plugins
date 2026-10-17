/**
 * Будівельники JSON-LD.
 *
 * Кожен блок структурованих даних на сайті генерується з site.config.js, тож
 * контакти у видачі не можуть розійтися з тими, що у футері. Рендериться під
 * час збірки — пошукові роботи бачать це у статичному HTML.
 *
 * `ids` — спільна мапа ідентифікаторів: мікророзмітка ставить той самий URI
 * в `itemid`, і два описи читаються як одна сутність, а не як дві.
 */

import { SITE, isPlace } from '../site.config.js';

const abs = (path = '/') => new URL(path, SITE.url).href;

export const ids = {
	organization: `${SITE.url}/#organization`,
	website: `${SITE.url}/#website`,
};

/**
 * Телефони бізнесу — і для JSON-LD, і для мікророзмітки. Один номер — рядок,
 * кілька — масив: мікророзмітка з кількома `itemprop="telephone"` дає рівно
 * такий самий масив, тож формати не розходяться.
 */
export const telephones = () => {
	const list = SITE.contacts.phones.map((phone) => phone.href);
	return list.length === 1 ? list[0] : list;
};

/**
 * Бізнес — одна сутність графа, на кожній сторінці. Layout додає вузол сам,
 * тож сторінка не може про нього забути або описати його вдруге.
 *
 * Кожна властивість тут має пару в мікророзмітці футера й секції контактів —
 * і навпаки. Додаєш властивість в одне місце — додай і в інше.
 */
export function business() {
	const { contacts } = SITE;
	return {
		'@type': SITE.businessType,
		'@id': ids.organization,
		name: SITE.name,
		description: SITE.description,
		url: abs('/'),
		logo: abs('/android-chrome-512x512.png'),
		email: contacts.email,
		telephone: telephones(),
		...(SITE.priceRange && isPlace ? { priceRange: SITE.priceRange } : {}),
		...(contacts.address ? { address: postalAddress() } : {}),
		...(isPlace && contacts.geo
			? {
					geo: {
						'@type': 'GeoCoordinates',
						latitude: contacts.geo.latitude,
						longitude: contacts.geo.longitude,
					},
				}
			: {}),
		...(isPlace && contacts.hours.length ? { openingHoursSpecification: openingHours() } : {}),
		...(SITE.social.length ? { sameAs: SITE.social } : {}),
	};
}

export function website() {
	return {
		'@type': 'WebSite',
		'@id': ids.website,
		url: abs('/'),
		name: SITE.name,
		description: SITE.description,
		publisher: { '@id': ids.organization },
		inLanguage: SITE.locale.replace('_', '-'),
	};
}

/** Один масив `contacts.hours` живить і цей хелпер, і мікророзмітку. */
function openingHours() {
	return SITE.contacts.hours.map((entry) => ({
		'@type': 'OpeningHoursSpecification',
		dayOfWeek: entry.days,
		opens: entry.opens,
		closes: entry.closes,
	}));
}

function postalAddress() {
	const { address } = SITE.contacts;
	return {
		'@type': 'PostalAddress',
		streetAddress: address.street,
		addressLocality: address.locality,
		addressRegion: address.region,
		postalCode: address.postalCode,
		addressCountry: address.country,
	};
}

/**
 * @param {string} path  напр. '/privacy-policy'
 * @param {{name: string, description?: string, type?: string}} page
 */
export function webPage(path, page) {
	return {
		'@type': page.type ?? 'WebPage',
		'@id': `${abs(path)}#webpage`,
		url: abs(path),
		name: page.name,
		description: page.description ?? SITE.description,
		inLanguage: SITE.locale.replace('_', '-'),
		isPartOf: { '@id': ids.website },
		about: { '@id': ids.organization },
	};
}

/** @param {{label: string, href?: string}[]} trail — останній елемент є поточною сторінкою. */
export function breadcrumbs(trail) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.label,
			...(crumb.href ? { item: abs(crumb.href) } : {}),
		})),
	};
}

/**
 * Відповідь FAQ може містити простий HTML (<a>, <strong>) — у JSON-LD іде
 * текст без тегів. Ту саму функцію не потрібно викликати на сторінці:
 * сторінка передає сирий масив, а хелпер чистить сам.
 *
 * @param {{question: string, answer: string}[]} entries
 */
export function faqPage(entries) {
	return {
		'@type': 'FAQPage',
		mainEntity: entries.map((entry) => ({
			'@type': 'Question',
			name: entry.question,
			acceptedAnswer: { '@type': 'Answer', text: entry.answer.replace(/<[^>]+>/g, '') },
		})),
	};
}

/**
 * Загортає вузли в обгортку @graph. Викликає ЛИШЕ layout — сторінка передає
 * через проп `schema` масив своїх вузлів, а не результат `graph()`.
 */
export const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.flat() });
