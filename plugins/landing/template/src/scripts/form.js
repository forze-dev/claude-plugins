/**
 * Форма заявки — єдина реалізація.
 *
 * І вбудована форма в секції контактів лендингу, і форма в модалці викликають
 * `initForm(formElement)`. Маска телефону, робота з файлом, валідація й
 * надсилання не існують більше ніде.
 *
 * Очікувана розмітка — повна версія в src/components/RequestForm.astro:
 *   <form data-form novalidate>
 *     <input name="username">
 *     <input name="phone" type="tel">
 *     <textarea name="comment">
 *     <input type="file" name="drawing" data-file-input>
 *     <button data-file-trigger>            … відкриває вибір файлу
 *     <div data-file-preview>               … назва + розмір + кнопка видалення
 *     <input name="company" data-form-trap> … honeypot, має лишатися порожнім
 *     <input type="hidden" name="elapsedMs">   … скільки мс форма була на екрані
 *     <p data-form-message>                 … вивід валідації / помилок
 *     <button type="submit">
 */

import { SITE, fillMessage, formatNational } from '../site.config.js';

const { form: FORM, messages: COPY } = SITE;
const MASK = FORM.phone;

/* ------------------------------------------------------------------ phone */

/** Префікс, який поле показує одразу при фокусі, напр. "+1 (". */
const PREFIX = `${MASK.countryCode} (`;

/** Цифри коду країни: "+380" → "380". */
const COUNTRY_DIGITS = MASK.countryCode.replace(/\D/g, '');

/**
 * Національні цифри з того, що зараз у полі.
 *
 * Префікс знімається ЯК ТЕКСТ, перш ніж рахувати цифри, — і це тут головне.
 * Поле майже завжди вже містить `+1 (`, тож `replace(/\D/g, '')` по сирому
 * значенню затягує цифру коду країни в національну частину. Наступне
 * натискання робить це знову — уже зі своїм попереднім виводом, — і номер
 * розповзається: набір 5550102030 давав `+1 (111) 115-5501`, після чого поле
 * переставало приймати ввід узагалі.
 *
 * Стара версія знімала код країни умовно, через
 * `if (digits.length > MASK.digits && …)` — але ця умова стає істинною аж
 * наприкінці набору, коли псування вже накопичене.
 */
export function phoneDigits(rawValue) {
	const body = rawValue.startsWith(PREFIX) ? rawValue.slice(PREFIX.length) : rawValue;
	let digits = body.replace(/\D/g, '');

	// Вставлений з буфера номер може нести код країни ще раз — і як E.164
	// (15550102030), і як «+1 555 010 2030». Знімаємо, але лише коли без нього
	// номер не стане закоротким.
	if (digits.length > MASK.digits && digits.startsWith(COUNTRY_DIGITS)) {
		digits = digits.slice(COUNTRY_DIGITS.length);
	}

	return digits.slice(0, MASK.digits);
}

/**
 * Чи набрано повний номер.
 *
 * Рахуються ЦИФРИ, а не довжина рядка: перевірка довжини пропускала зіпсований
 * номер, бо дужки й дефіси давали рівно ту саму довжину, що й правильний.
 */
export const isPhoneComplete = (rawValue) => phoneDigits(rawValue).length === MASK.digits;

/**
 * Цифри → номер за маскою, цілком керований SITE.form.phone. Форматування
 * робить `formatNational` із конфіга — та сама функція, що дає видимий текст
 * номерів на сайті, тож маска й футер не можуть показувати різні формати.
 */
export const formatPhone = (rawValue) => formatNational(phoneDigits(rawValue));

export function initPhoneField(input) {
	if (!input) return;

	// Префікс зʼявляється при фокусі, щоб у спокої було видно плейсхолдер.
	input.addEventListener('focus', () => {
		if (!input.value) input.value = PREFIX;
	});

	input.addEventListener('blur', () => {
		if (input.value === PREFIX) input.value = '';
	});

	input.addEventListener('input', () => {
		input.value = formatPhone(input.value);
	});

	// Не даємо backspace зʼїсти префікс і лишити курсор у нікуди.
	input.addEventListener('keydown', (event) => {
		const isDelete = event.key === 'Backspace' || event.key === 'Delete';
		if (isDelete && input.value.length <= PREFIX.length) event.preventDefault();
	});
}

/* ------------------------------------------------------------------- file */

function formatSize(bytes) {
	const mb = bytes / 1024 / 1024;
	return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isAllowedFile(file) {
	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	// Вирішує розширення, і тільки воно. file.type приходить від браузера — для
	// CAD він порожній або дивний, а головне, він нічого не доводить. Це лише
	// зручність: справжню перевірку (сигнатури) роблять бекенди.
	return FORM.allowedExtensions.includes(extension);
}

function initFileField(form, showMessage) {
	const input = form.querySelector('[data-file-input]');
	const trigger = form.querySelector('[data-file-trigger]');
	const preview = form.querySelector('[data-file-preview]');
	if (!input || !trigger || !preview) return;

	const nameOutput = preview.querySelector('[data-file-name]');
	const sizeOutput = preview.querySelector('[data-file-size]');
	const removeButton = preview.querySelector('[data-file-remove]');

	const clear = () => {
		input.value = '';
		trigger.hidden = false;
		preview.hidden = true;
		// Назву й розмір теж чистимо: інакше прихований блок тримає дані
		// попереднього файла, і наступне відхилення показало б чужий підпис.
		if (nameOutput) nameOutput.textContent = '';
		if (sizeOutput) sizeOutput.textContent = '';
	};

	trigger.addEventListener('click', () => input.click());
	removeButton?.addEventListener('click', () => {
		clear();
		trigger.focus();
	});

	input.addEventListener('change', () => {
		const file = input.files?.[0];
		if (!file) return clear();

		if (file.size > FORM.maxFileSize) {
			showMessage('validation', fillMessage(COPY.fileTooLarge));
			return clear();
		}

		if (!isAllowedFile(file)) {
			showMessage('validation', fillMessage(COPY.fileWrongType));
			return clear();
		}

		if (nameOutput) nameOutput.textContent = file.name;
		if (sizeOutput) sizeOutput.textContent = formatSize(file.size);
		trigger.hidden = true;
		preview.hidden = false;
	});

	return clear;
}

/* ---------------------------------------------------------------- message */

function createMessenger(form) {
	const output = form.querySelector('[data-form-message]');
	let timer;

	return (type, text) => {
		if (!output) return;
		clearTimeout(timer);

		output.textContent = text;
		output.className = `form__message form__message--${type}`;
		output.hidden = false;

		timer = setTimeout(() => {
			output.hidden = true;
		}, 6000);
	};
}

/* ----------------------------------------------------------------- submit */

/** Підключає одну форму. Повертає `reset()`, щоб модалка могла її очистити. */
export function initForm(form) {
	if (!form || form.dataset.formReady === 'true') return () => {};
	form.dataset.formReady = 'true';

	const nameInput = form.querySelector('[name="username"]');
	const phoneInput = form.querySelector('[name="phone"]');
	const commentInput = form.querySelector('[name="comment"]');
	const fileInput = form.querySelector('[data-file-input]');
	const trapInput = form.querySelector('[data-form-trap]');
	const elapsedInput = form.querySelector('[name="elapsedMs"]');
	const submitButton = form.querySelector('[type="submit"]');

	const showMessage = createMessenger(form);
	const clearFile = initFileField(form, showMessage);
	initPhoneField(phoneInput);

	/**
	 * Скільки часу форма реально пробула на екрані. Саме ТРИВАЛІСТЬ, а не мітка
	 * часу: раніше сюди клався Date.now() браузера, а сервер віднімав його від
	 * свого. У відвідувача з годинником, що випереджає серверний, різниця
	 * ставала відʼємною — і сервер відхиляв його як бота назавжди, без жодного
	 * пояснення. performance.now() монотонний і з годинником не звʼязаний.
	 */
	let openedAt = performance.now();
	const elapsedMs = () => String(Math.round(performance.now() - openedAt));

	const reset = () => {
		form.reset();
		clearFile?.();
		openedAt = performance.now();
	};

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!nameInput?.value.trim()) {
			showMessage('validation', COPY.nameRequired);
			nameInput?.focus();
			return;
		}

		if (!phoneInput || !isPhoneComplete(phoneInput.value)) {
			showMessage('validation', COPY.phoneRequired);
			phoneInput?.focus();
			return;
		}

		const payload = new FormData();
		payload.append('username', nameInput.value.trim());
		payload.append('phone', phoneInput.value.trim());
		payload.append('comment', commentInput?.value.trim() || '');
		payload.append('company', trapInput?.value ?? '');
		// Поле в розмітці лишається: воно документує контракт із бекендом і без
		// JS піде порожнім — а порожнє значення бекенд відхиляє.
		if (elapsedInput) elapsedInput.value = elapsedMs();
		payload.append('elapsedMs', elapsedInput ? elapsedInput.value : elapsedMs());
		payload.append('page', window.location.pathname);

		const file = fileInput?.files?.[0];
		if (file) payload.append('drawing', file);

		const originalLabel = submitButton?.textContent;
		if (submitButton) {
			submitButton.disabled = true;
			submitButton.textContent = COPY.sending;
		}

		try {
			const response = await fetch(SITE.formEndpoint, { method: 'POST', body: payload });

			if (!response.ok) {
				// 429 — окремий текст: людина щойно надіслала заявку, і «спробуйте
				// ще раз» без пояснення змусило б її натискати знову й знову.
				showMessage('error', response.status === 429 ? COPY.tooManyRequests : COPY.sendError);
				return;
			}

			reset();
			// Сторінка подяки перевіряє цю мітку, перш ніж відрендеритись.
			window.location.href = `${FORM.successUrl}?formStatus=sent&timestamp=${Date.now()}`;
		} catch {
			showMessage('error', COPY.networkError);
		} finally {
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent = originalLabel;
			}
		}
	});

	return reset;
}

/** Ініціалізує всі `[data-form]`, що вже є в документі. */
export function initForms(root = document) {
	root.querySelectorAll('[data-form]').forEach((form) => initForm(form));
}

export default initForms;
