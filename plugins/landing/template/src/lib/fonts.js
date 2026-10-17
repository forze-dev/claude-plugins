/**
 * Which font files to preload, by site language.
 *
 * Preloading speeds up the first paint (LCP), but a preloaded file the page
 * never uses is wasted bandwidth. A Latin-script site needs only the `latin`
 * range; a Cyrillic-script site needs `cyrillic` for the words and `latin`
 * for digits, spaces and punctuation (U+0000-00FF).
 */

import { SITE } from '../site.config.js';

const CYRILLIC = new Set(['uk', 'ru', 'be', 'bg', 'sr', 'mk', 'kk', 'ky', 'tg', 'mn']);

export const preloadFonts = () => {
	const lang = SITE.lang.toLowerCase().split('-')[0];
	return CYRILLIC.has(lang) ? ['/fonts/onest-cyrillic.woff2', '/fonts/onest-latin.woff2'] : ['/fonts/onest-latin.woff2'];
};
