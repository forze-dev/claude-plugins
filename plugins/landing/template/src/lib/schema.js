/**
 * JSON-LD builders.
 *
 * Every structured-data block on the site is generated from site.config.js,
 * so the contacts in search results can't drift from those in the footer.
 * Rendered at build time — crawlers see it in the static HTML.
 *
 * `ids` is a shared identifier map: the microdata puts the same URI into
 * `itemid`, and the two descriptions read as one entity, not two.
 */

import { SITE, isPlace } from '../site.config.js';

const abs = (path = '/') => new URL(path, SITE.url).href;

export const ids = {
	organization: `${SITE.url}/#organization`,
	website: `${SITE.url}/#website`,
};

/**
 * The business phones — for both JSON-LD and microdata. One number — a string,
 * several — an array: microdata with several `itemprop="telephone"` yields
 * exactly the same array, so the formats don't diverge.
 */
export const telephones = () => {
	const list = SITE.contacts.phones.map((phone) => phone.href);
	return list.length === 1 ? list[0] : list;
};

/**
 * The business — one graph entity, on every page. The layout adds the node
 * itself, so a page can neither forget it nor describe it a second time.
 *
 * Every property here has a twin in the footer microdata, and vice versa.
 * Add a property in one place — add it in the other.
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

/** One `contacts.hours` array feeds both this helper and the microdata. */
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
 * @param {string} path  e.g. '/privacy-policy'
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

/** @param {{label: string, href?: string}[]} trail — the last item is the current page. */
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
 * An FAQ answer may contain simple HTML (<a>, <strong>) — JSON-LD gets the text
 * without tags. The page passes the raw array; the helper strips tags itself.
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
 * Wraps nodes in the @graph envelope. Called ONLY by the layout — a page passes
 * an array of its own nodes through the `schema` prop, not the result of `graph()`.
 */
export const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.flat() });
