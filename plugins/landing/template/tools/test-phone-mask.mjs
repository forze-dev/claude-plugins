/**
 * Тест маски телефону: `npm run test:phone`.
 *
 * Чому він узагалі існує окремим файлом. Маску вже колись «перевіряли», і
 * перевірка не могла впасти: у поле підставляли готове значення **однією**
 * подією `input`, тоді як реальний набір — це десять подій, і кожна годує
 * функцію її ж попереднім виводом. Саме там і жив дефект. Друга помилка —
 * assert на довжину рядка замість значення: зіпсований номер мав рівно ту саму
 * довжину, що й правильний, тож проходив.
 *
 * Тому тут:
 *   — набір ЕМУЛЮЄТЬСЯ посимвольно, через справжні слухачі з initPhoneField();
 *   — порівнюються ЗНАЧЕННЯ, а не довжини;
 *   — перевіряється ідемпотентність formatPhone: саме її порушення й давало
 *     накопичення коду країни.
 *
 * Очікування задані для двох конфігурацій. Тест дивиться на `countryCode` у
 * поточному `site.config.js` і бере відповідний набір; для невідомого коду
 * країни літеральні очікування пропускаються, а інваріанти лишаються.
 */

import { SITE } from '../src/site.config.js';
import { formatPhone, phoneDigits, isPhoneComplete, initPhoneField } from '../src/scripts/form.js';

const MASK = SITE.form.phone;

/* ------------------------------------------------- мінімальний фейк поля */

/**
 * Рівно стільки DOM, скільки потребує initPhoneField. Слухачі — справжні, з
 * продакшен-коду; ми лише доставляємо їм події так, як це робить браузер.
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

/** Набір посимвольно: браузер вставляє символ, потім летить `input`. */
const typeInto = (input, text) => {
	for (const char of text) {
		input.value += char;
		input.fire('input');
	}
	return input.value;
};

/** Вставка з буфера: весь рядок одразу, одна подія `input`. */
const pasteInto = (input, text) => {
	input.value += text;
	input.fire('input');
	return input.value;
};

/** Backspace із урахуванням keydown-захисту префікса. */
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
		console.log(`  FAIL ${label}\n         очікували ${JSON.stringify(expected)}\n         отримали  ${JSON.stringify(actual)}`);
	}
};

/* -------------------------------------------------------- дані по країнах */

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

console.log(`Маска телефону: countryCode=${MASK.countryCode} digits=${MASK.digits} groups=[${MASK.groups}]\n`);

/* ------------------------------------------------ літеральні очікування */

if (expectations) {
	const { national, formatted, pastes, partials } = expectations;

	is('набір посимвольно', typeInto(newField(), national), formatted);

	for (const [prefix, expected] of partials) {
		is(`проміжний стан після "${prefix}"`, typeInto(newField(), prefix), expected);
	}

	for (const text of pastes) {
		is(`вставка "${text}"`, pasteInto(newField(), text), formatted);
	}

	// Зайві цифри понад ліміт не мають зсувати номер.
	is('набір із зайвими цифрами', typeInto(newField(), national + '999'), formatted);

	// Backspace до порожнього і набір заново.
	const field = newField();
	typeInto(field, national);
	let guard = 0;
	while (field.value !== `${MASK.countryCode} (` && guard++ < 100) backspace(field);
	is('backspace до префікса', field.value, `${MASK.countryCode} (`);
	is('набір після backspace', typeInto(field, national), formatted);

	// Видалення частини номера й донабір.
	const partial = newField();
	typeInto(partial, national);
	backspace(partial);
	backspace(partial);
	is('донабір після двох backspace', typeInto(partial, national.slice(-2)), formatted);

	is('isPhoneComplete на повному номері', isPhoneComplete(formatted), true);
	is('isPhoneComplete на неповному', isPhoneComplete(typeInto(newField(), national.slice(0, -1))), false);
	is('isPhoneComplete на порожньому полі', isPhoneComplete(`${MASK.countryCode} (`), false);
} else {
	console.log(`  (літеральні очікування для ${MASK.countryCode} не задані — лише інваріанти)\n`);
}

/* ------------------------------------------------------------ інваріанти */

console.log('\nІнваріанти:');

// Головний. Саме його порушення й давало накопичення коду країни: другий
// прогін по власному виводу міняв результат.
const sample = typeInto(newField(), '1'.repeat(MASK.digits));
is('formatPhone ідемпотентний', formatPhone(sample), sample);

const doubled = formatPhone(formatPhone(formatPhone(sample)));
is('formatPhone стабільний на трьох прогонах', doubled, sample);

is('phoneDigits не повертає код країни', phoneDigits(sample).length, MASK.digits);

// Кожен проміжний стан набору має лишатися ідемпотентним — інакше наступне
// натискання зіпсує номер.
const field = newField();
let stable = true;
for (const char of '1234567890123'.slice(0, MASK.digits)) {
	field.value += char;
	field.fire('input');
	if (formatPhone(field.value) !== field.value) stable = false;
}
is('кожен проміжний стан ідемпотентний', stable, true);

console.log(`\n${passed} пройшло, ${failed} впало.`);
process.exit(failed ? 1 : 0);
