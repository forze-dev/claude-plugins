/**
 * The request form — the single implementation.
 *
 * Both the form embedded in the landing's contacts section and the one in the
 * modal call `initForm(formElement)`. The phone mask, file handling,
 * validation and submission exist nowhere else.
 *
 * Expected markup — the full version is in src/components/RequestForm.astro:
 *   <form data-form novalidate>
 *     <input name="username">
 *     <input name="phone" type="tel">
 *     <textarea name="comment">
 *     <input type="file" name="drawing" data-file-input>
 *     <button data-file-trigger>            … opens the file picker
 *     <div data-file-preview>               … name + size + remove button
 *     <input name="company" data-form-trap> … honeypot, must stay empty
 *     <input type="hidden" name="elapsedMs">   … how many ms the form was on screen
 *     <p data-form-message>                 … validation / error output
 *     <button type="submit">
 */

import { SITE, fillMessage, formatNational } from '../site.config.js';

const { form: FORM, messages: COPY } = SITE;
const MASK = FORM.phone;

/* ------------------------------------------------------------------ phone */

/** The prefix the field shows right on focus, e.g. "+1 (". */
const PREFIX = `${MASK.countryCode} (`;

/** The country code digits: "+380" → "380". */
const COUNTRY_DIGITS = MASK.countryCode.replace(/\D/g, '');

/**
 * The national digits from what is in the field right now.
 *
 * The prefix is removed AS TEXT before the digits are counted — that's the key
 * here. The field almost always already contains `+1 (`, so `replace(/\D/g, '')`
 * on the raw value pulls the country code digit into the national part. The
 * next keystroke does it again — this time on its own previous output — and
 * the number creeps: typing 5550102030 produced `+1 (111) 115-5501`, after
 * which the field stopped accepting input at all.
 *
 * The old version removed the country code conditionally, via
 * `if (digits.length > MASK.digits && …)` — but that condition only becomes
 * true at the very end of typing, when the corruption has already piled up.
 */
export function phoneDigits(rawValue) {
	const body = rawValue.startsWith(PREFIX) ? rawValue.slice(PREFIX.length) : rawValue;
	let digits = body.replace(/\D/g, '');

	// A number pasted from the clipboard may carry the country code again — as
	// E.164 (15550102030) or as "+1 555 010 2030". Strip it, but only when the
	// number wouldn't become too short without it.
	if (digits.length > MASK.digits && digits.startsWith(COUNTRY_DIGITS)) {
		digits = digits.slice(COUNTRY_DIGITS.length);
	}

	return digits.slice(0, MASK.digits);
}

/**
 * Whether a complete number has been typed.
 *
 * DIGITS are counted, not the string length: a length check let a corrupted
 * number through, because brackets and dashes gave exactly the same length as
 * a correct one.
 */
export const isPhoneComplete = (rawValue) => phoneDigits(rawValue).length === MASK.digits;

/**
 * Digits → a number by the mask, fully driven by SITE.form.phone. Formatting is
 * done by `formatNational` from the config — the same function that produces
 * the visible phone text on the site, so the mask and the footer can't show
 * different formats.
 */
export const formatPhone = (rawValue) => formatNational(phoneDigits(rawValue));

export function initPhoneField(input) {
	if (!input) return;

	// The prefix appears on focus so the placeholder is visible at rest.
	input.addEventListener('focus', () => {
		if (!input.value) input.value = PREFIX;
	});

	input.addEventListener('blur', () => {
		if (input.value === PREFIX) input.value = '';
	});

	input.addEventListener('input', () => {
		input.value = formatPhone(input.value);
	});

	// Don't let backspace eat the prefix and leave the caret nowhere.
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
	// The extension decides, and only it. file.type comes from the browser — for
	// CAD it is empty or odd, and above all it proves nothing. This is only a
	// convenience: the real check (signatures) is done by the back end.
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
		// Clear the name and size too: otherwise the hidden block keeps the
		// previous file's data, and the next rejection would show someone else's label.
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

/** Wires one form. Returns `reset()` so the modal can clear it. */
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
	 * How long the form was actually on screen. A DURATION, not a timestamp: the
	 * browser's Date.now() used to go here and the server subtracted it from its
	 * own. For a visitor whose clock ran ahead of the server's, the difference
	 * went negative — and the server rejected them as a bot forever, with no
	 * explanation. performance.now() is monotonic and not tied to the clock.
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
		// The field stays in the markup: it documents the contract with the back
		// end, and without JS it is sent empty — and the back end rejects an empty value.
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
				// 429 gets its own text: the person has just sent a request, and "try
				// again" without an explanation would make them click again and again.
				showMessage('error', response.status === 429 ? COPY.tooManyRequests : COPY.sendError);
				return;
			}

			reset();
			// The thank-you page checks this marker before rendering.
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

/** Initializes every `[data-form]` already in the document. */
export function initForms(root = document) {
	root.querySelectorAll('[data-form]').forEach((form) => initForm(form));
}

export default initForms;
