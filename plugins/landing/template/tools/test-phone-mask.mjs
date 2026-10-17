/**
 * Phone mask test: `npm run test:phone`.
 *
 * Why it exists as a separate file. The mask was once "tested", and the test
 * could not fail: a finished value was put into the field with **one** `input`
 * event, while real typing is ten events, each feeding the function its own
 * previous output. That's exactly where the defect lived. The second mistake
 * was asserting the string length instead of the value: the corrupted number
 * had exactly the same length as the correct one, so it passed.
 *
 * So here:
 *   — typing is EMULATED character by character, through the real listeners
 *     from initPhoneField();
 *   — VALUES are compared, not lengths;
 *   — formatPhone idempotence is checked: breaking it is exactly what made the
 *     country code accumulate.
 *
 * Expectations are given for two configurations. The test looks at
 * `countryCode` in the current `site.config.js` and takes the matching set;
 * for an unknown country code the literal expectations are skipped and only
 * the invariants remain.
 */

import { SITE } from '../src/site.config.js';
import { formatPhone, phoneDigits, isPhoneComplete, initPhoneField } from '../src/scripts/form.js';

const MASK = SITE.form.phone;

/* ------------------------------------------------- a minimal fake field */

/**
 * Exactly as much DOM as initPhoneField needs. The listeners are real, from
 * production code; we only deliver events to them the way a browser does.
 */
class FakeInput {
	constructor() {
		this.value = '';
		this.handlers = {};
	}

	addEventListener(type, handler) {
		(this.handlers[type] ??= []).push(handler);
	}

	fire(type, event = {}) {
		const payload = { type, defaultPrevented: false, ...event };
		payload.preventDefault = () => { payload.defaultPrevented = true; };
		for (const handler of this.handlers[type] ?? []) handler(payload);
		return payload;
	}
}

const newField = () => {
	const input = new FakeInput();
	initPhoneField(input);
	input.fire('focus');
	return input;
};

/** Character-by-character typing: the browser inserts a character, then `input` fires. */
const typeInto = (input, text) => {
	for (const char of text) {
		input.value += char;
		input.fire('input');
	}
	return input.value;
};

/** Pasting from the clipboard: the whole string at once, one `input` event. */
const pasteInto = (input, text) => {
	input.value += text;
	input.fire('input');
	return input.value;
};

/** Backspace, honouring the keydown guard of the prefix. */
const backspace = (input) => {
	const event = input.fire('keydown', { key: 'Backspace' });
	if (event.defaultPrevented) return input.value;
	input.value = input.value.slice(0, -1);
	input.fire('input');
	return input.value;
};

/* ----------------------------------------------------------------- assert */

let failed = 0;
let passed = 0;

const is = (label, actual, expected) => {
	if (actual === expected) {
		passed++;
		console.log(`  ok   ${label}\n         ${JSON.stringify(actual)}`);
	} else {
		failed++;
		console.log(`  FAIL ${label}\n         expected ${JSON.stringify(expected)}\n         got      ${JSON.stringify(actual)}`);
	}
};

/* ------------------------------------------------------ data per country */

const CASES = {
	'+1': {
		national: '5550102030',
		formatted: '+1 (555) 010-2030',
		pastes: ['+1 555 010 2030', '15550102030', '5550102030', '+1 (555) 010-2030'],
		partials: [
			['5', '+1 (5'],
			['555', '+1 (555'],
			['5550', '+1 (555) 0'],
			['555010', '+1 (555) 010'],
		],
	},
	'+380': {
		national: '441234567',
		formatted: '+380 (44) 123-45-67',
		pastes: ['+380 44 123 45 67', '380441234567', '441234567', '+380 (44) 123-45-67'],
		partials: [
			['4', '+380 (4'],
			['44', '+380 (44'],
			['441', '+380 (44) 1'],
			['44123', '+380 (44) 123'],
			['4412345', '+380 (44) 123-45'],
		],
	},
};

const expectations = CASES[MASK.countryCode];

console.log(`Phone mask: countryCode=${MASK.countryCode} digits=${MASK.digits} groups=[${MASK.groups}]\n`);

/* ---------------------------------------------------- literal expectations */

if (expectations) {
	const { national, formatted, pastes, partials } = expectations;

	is('character-by-character typing', typeInto(newField(), national), formatted);

	for (const [prefix, expected] of partials) {
		is(`intermediate state after "${prefix}"`, typeInto(newField(), prefix), expected);
	}

	for (const text of pastes) {
		is(`paste "${text}"`, pasteInto(newField(), text), formatted);
	}

	// Extra digits beyond the limit must not shift the number.
	is('typing with extra digits', typeInto(newField(), national + '999'), formatted);

	// Backspace down to empty and type again.
	const field = newField();
	typeInto(field, national);
	let guard = 0;
	while (field.value !== `${MASK.countryCode} (` && guard++ < 100) backspace(field);
	is('backspace down to the prefix', field.value, `${MASK.countryCode} (`);
	is('typing after backspace', typeInto(field, national), formatted);

	// Deleting part of the number and typing it back.
	const partial = newField();
	typeInto(partial, national);
	backspace(partial);
	backspace(partial);
	is('retyping after two backspaces', typeInto(partial, national.slice(-2)), formatted);

	is('isPhoneComplete on a full number', isPhoneComplete(formatted), true);
	is('isPhoneComplete on an incomplete one', isPhoneComplete(typeInto(newField(), national.slice(0, -1))), false);
	is('isPhoneComplete on an empty field', isPhoneComplete(`${MASK.countryCode} (`), false);
} else {
	console.log(`  (no literal expectations for ${MASK.countryCode} — invariants only)\n`);
}

/* ---------------------------------------------------------------- invariants */

console.log('\nInvariants:');

// The main one. Breaking it is exactly what made the country code accumulate:
// a second pass over its own output changed the result.
const sample = typeInto(newField(), '1'.repeat(MASK.digits));
is('formatPhone is idempotent', formatPhone(sample), sample);

const doubled = formatPhone(formatPhone(formatPhone(sample)));
is('formatPhone is stable over three passes', doubled, sample);

is('phoneDigits does not return the country code', phoneDigits(sample).length, MASK.digits);

// Every intermediate typing state must stay idempotent — otherwise the next
// keystroke corrupts the number.
const field = newField();
let stable = true;
for (const char of '1234567890123'.slice(0, MASK.digits)) {
	field.value += char;
	field.fire('input');
	if (formatPhone(field.value) !== field.value) stable = false;
}
is('every intermediate state is idempotent', stable, true);

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
