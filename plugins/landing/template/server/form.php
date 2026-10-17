<?php
/**
 * Бекенд форми заявки для Apache / cPanel — єдиний бекенд лендингу.
 *
 * Лежить ПОЗА `public/` навмисно: у `dist/scripts/` його кладе
 * `npm run build` разом із `form.limits.json`. Під час `npm run dev` його
 * віддає вбудований сервер PHP (`php -S`), до якого проксує dev-сервер Astro
 * — тож локально перевіряється той самий файл, що поїде на хостинг.
 *
 * Ліміти НЕ переписані тут руками — вони читаються з `form.limits.json`, який
 * генерується з src/site.config.js (tools/limits.mjs) і лягає поруч із цим
 * файлом.
 *
 * Доступи беруться з файлу .env, який має лежати ПОЗА коренем сайту:
 *
 *   /home/user/.env          ← файл
 *   /home/user/public_html/  ← корінь сайту
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

/* ---------------------------------------------------------------- допоміжне */

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo $message;
    exit;
}

/**
 * Ліміти — з того самого джерела, що й у браузера (SITE.form).
 *
 * Якщо файла немає, працювати не можна: мовчазні дефолти означали б, що
 * сервер і браузер розійшлися, а це саме те, від чого цей файл рятує.
 */
function load_limits(): array
{
    foreach ([__DIR__ . '/form.limits.json', __DIR__ . '/../form.limits.json'] as $path) {
        if (!is_readable($path)) {
            continue;
        }
        $data = json_decode((string) file_get_contents($path), true);
        if (is_array($data)) {
            return $data;
        }
        fail(500, 'form.limits.json is present but unreadable as JSON.');
    }

    fail(500, 'form.limits.json is missing. Run `npm run build` and deploy the dist/ folder it produces.');
}

$LIMITS = load_limits();

/**
 * Мінімальний читач .env. Спершу дивиться на рівень вище кореня сайту, потім
 * відкочується до кореня проєкту — для локальної розробки.
 */
function load_env(array $candidates): array
{
    foreach ($candidates as $path) {
        if (!is_readable($path)) {
            continue;
        }

        $values = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
        }
        return $values;
    }

    return [];
}

function field(string $name, int $maxLength, string $fallback = ''): string
{
    $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    if ($value === '') {
        return $fallback;
    }
    return mb_substr($value, 0, $maxLength);
}

/**
 * Обрізання по одиницях UTF-16 — саме їх рахує Telegram.
 *
 * `mb_substr` рахує символи, а не одиниці UTF-16, тож на емодзі повідомлення
 * виходило б довшим за ліміт Telegram і відхилялося. Тут рахуємо одиниці UTF-16
 * і не розрізаємо сурогатну пару.
 */
function utf16_truncate(string $text, int $limit): string
{
    $out = '';
    $units = 0;

    foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $char) {
        $codepoint = mb_ord($char, 'UTF-8');
        $size = ($codepoint !== false && $codepoint >= 0x10000) ? 2 : 1;
        if ($units + $size > $limit) {
            break;
        }
        $out .= $char;
        $units += $size;
    }

    return $out;
}

/**
 * Чи прийшов запит з нашого ж сайту.
 *
 * Відсікає чужі сайти, які постили б у цю форму з браузера відвідувача.
 * Від скрипта поза браузером це НЕ захищає: заголовок Origin він підробляє
 * без зусиль. Основну роботу роблять honeypot, тривалість заповнення й частота.
 */
function origin_allowed(string $siteUrl): bool
{
    $candidate = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($candidate === '') {
        return false;
    }

    $host = parse_url($candidate, PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        return false;
    }

    $siteHost = parse_url($siteUrl, PHP_URL_HOST);

    return $host === $siteHost
        || $host === 'www.' . $siteHost
        || $host === 'localhost'
        || $host === '127.0.0.1'
        || $host === '[::1]';
}

/**
 * Один запис на IP у системній теці tmp; база даних не потрібна.
 *
 * Помилки НЕ глушаться: раніше тут стояв `@touch`, і на хості з `open_basedir`
 * обмеження частоти мовчки вимикалося — сайт виглядав захищеним, не будучи ним.
 *
 * Прибирання застарілих маркерів — тут же: інакше /tmp обростав би файлами
 * довічно. Це «лежачий поліцейський», а не стіна: між паралельними запитами
 * немає блокування, тож два одночасні пройдуть обидва.
 */
function enforce_rate_limit(int $seconds): void
{
    $dir = sys_get_temp_dir();
    if (!is_dir($dir) || !is_writable($dir)) {
        fail(500, 'The form cannot enforce its rate limit: the temp directory is not writable.');
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $marker = $dir . '/form-' . hash('sha256', $ip) . '.txt';

    clearstatcache(true, $marker);
    if (is_file($marker) && (time() - (int) filemtime($marker)) < $seconds) {
        fail(429, 'Too many requests. Please wait a moment and try again.');
    }

    if (touch($marker) === false) {
        fail(500, 'The form cannot enforce its rate limit: the marker file could not be written.');
    }

    // Прибираємо чужі протухлі маркери, доки ми тут.
    foreach (glob($dir . '/form-*.txt') ?: [] as $stale) {
        if ((time() - (int) @filemtime($stale)) > $seconds * 60) {
            @unlink($stale);
        }
    }
}

/**
 * Чим файл є насправді.
 *
 * `$_FILES['type']` не перевіряється взагалі — його надсилає браузер, тож він
 * нічого не доводить: PE-файл під іменем `evil.pdf` інакше пройшов би.
 * Перевіряються перші байти файла проти таблиці сигнатур із конфіга, і саме за
 * тим розширенням, яке файл заявляє.
 */
function matches_signature(string $path, string $extension, array $signatures): bool
{
    if (empty($signatures[$extension])) {
        return false;
    }

    $handle = fopen($path, 'rb');
    if ($handle === false) {
        return false;
    }
    $head = bin2hex((string) fread($handle, 16));
    fclose($handle);

    foreach ($signatures[$extension] as $signature) {
        if (str_starts_with($head, strtolower((string) $signature))) {
            return true;
        }
    }

    return false;
}

/* ------------------------------------------------------------------ захист */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'Method Not Allowed');
}

/**
 * Тіло, більше за `post_max_size`, PHP відкидає ще до нас: $_POST і $_FILES
 * порожні, а Content-Length — ні. Без цієї перевірки honeypot бачив порожнє
 * поле (пройшов), тривалість була відсутня — і в Telegram летіла заявка з усіма
 * «Not provided» і статусом 200.
 */
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && $_POST === [] && $_FILES === []) {
    fail(413, 'The request is too large for this server. Attach a smaller file or contact us directly.');
}

$maxFieldLength = (int) ($LIMITS['maxFieldLength'] ?? 2000);
$maxFileSize = (int) ($LIMITS['maxFileSize'] ?? 20971520);

// 1. Honeypot: поле винесене за екран, тож заповнити його може лише бот.
if (field('company', $maxFieldLength) !== '') {
    fail(400, 'Rejected.');
}

// 2. Тривалість заповнення. Поле зобовʼязане бути присутнім і числовим:
//    раніше перевірка стояла під `if ($value > 0)`, тож бот пропускав її,
//    просто не надіславши поле. Це ТРИВАЛІСТЬ із performance.now() клієнта, а
//    не мітка часу: порівнювати чужий годинник зі своїм не можна.
$elapsedRaw = $_POST['elapsedMs'] ?? '';
if (!is_string($elapsedRaw) || !is_numeric($elapsedRaw)) {
    fail(400, 'Rejected.');
}
if ((float) $elapsedRaw < ((float) ($LIMITS['minFillSeconds'] ?? 3)) * 1000) {
    fail(400, 'Rejected.');
}

// 3. Запит має приходити з нашого ж сайту.
if (!origin_allowed((string) ($LIMITS['siteUrl'] ?? ''))) {
    fail(400, 'Rejected.');
}

/* ------------------------------------------------------------- 4. файл */

$upload = $_FILES['drawing'] ?? null;
$uploadError = is_array($upload) ? (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE) : UPLOAD_ERR_NO_FILE;

/**
 * Раніше все, крім UPLOAD_ERR_OK, трактувалося як «файлу немає» — і заявка
 * йшла без вкладення зі статусом 200. На шаред-хостингу `upload_max_filesize`
 * типово 2M або 8M, тож креслення на 15 МБ зникало мовчки, а користувач бачив
 * «Sent.».
 */
if ($uploadError !== UPLOAD_ERR_OK && $uploadError !== UPLOAD_ERR_NO_FILE) {
    if ($uploadError === UPLOAD_ERR_INI_SIZE || $uploadError === UPLOAD_ERR_FORM_SIZE) {
        fail(400, 'That file is too large for this server. Reduce it or send it to us by email.');
    }
    if ($uploadError === UPLOAD_ERR_PARTIAL) {
        fail(400, 'The upload was interrupted. Please try again.');
    }
    fail(500, 'The file could not be received by the server. Please try again or send it by email.');
}

$hasFile = $uploadError === UPLOAD_ERR_OK;

if ($hasFile) {
    if (!is_uploaded_file((string) $upload['tmp_name'])) {
        fail(400, 'Rejected.');
    }

    if ((int) $upload['size'] === 0) {
        fail(400, 'The attached file is empty.');
    }

    if ((int) $upload['size'] > $maxFileSize) {
        fail(400, sprintf('That file is too large. Maximum size is %d MB.', intdiv($maxFileSize, 1048576)));
    }

    $extension = strtolower(pathinfo(basename((string) $upload['name']), PATHINFO_EXTENSION));
    if (!in_array($extension, (array) ($LIMITS['allowedExtensions'] ?? []), true)) {
        fail(400, 'Unsupported file type.');
    }

    if (!matches_signature((string) $upload['tmp_name'], $extension, (array) ($LIMITS['signatures'] ?? []))) {
        fail(400, 'Unsupported file type.');
    }
}

/**
 * 5. Частота — ПІСЛЯ перевірки файла. Інакше людина, яка прикріпила файл не
 * того типу, отримувала б відмову, виправлялася — і впиралася в «зачекайте
 * 20 секунд» за заявку, яка нікуди не пішла.
 */
enforce_rate_limit((int) ($LIMITS['rateLimitSeconds'] ?? 20));

/* ------------------------------------------------------------ креденшили */

$env = load_env([
    dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__) . '/.env',
    __DIR__ . '/../../.env',
]);

$botToken = $env['TELEGRAM_BOT_TOKEN'] ?? (getenv('TELEGRAM_BOT_TOKEN') ?: '');
$chatId   = $env['CHAT_ID'] ?? (getenv('CHAT_ID') ?: '');

if ($botToken === '' || $chatId === '') {
    fail(500, 'The form is not configured yet: TELEGRAM_BOT_TOKEN and CHAT_ID are missing. Copy .env.example to .env and fill them in.');
}

/* --------------------------------------------------------------- повідомлення */

$text = "New request from the website\n\n"
    . 'Name: ' . field('username', $maxFieldLength, 'Not provided') . "\n"
    . 'Phone: ' . field('phone', $maxFieldLength, 'Not provided') . "\n"
    . 'Comment: ' . field('comment', $maxFieldLength, 'No comment') . "\n"
    . 'Page: ' . field('page', $maxFieldLength, '/');

if ($hasFile) {
    $text .= "\n\nA file is attached.";
}

/* --------------------------------------------------------------- надсилання */

function telegram_request(string $token, string $method, array $payload): int
{
    $handle = curl_init("https://api.telegram.org/bot{$token}/{$method}");
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
    ]);

    curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
    curl_close($handle);

    return $status;
}

if ($hasFile) {
    $status = telegram_request($botToken, 'sendDocument', [
        'chat_id' => $chatId,
        'caption' => utf16_truncate($text, (int) ($LIMITS['telegramCaptionLimit'] ?? 1024)),
        'document' => new CURLFile(
            (string) $upload['tmp_name'],
            'application/octet-stream',
            basename((string) $upload['name'])
        ),
    ]);
} else {
    $status = telegram_request($botToken, 'sendMessage', [
        'chat_id' => $chatId,
        // Без обрізання чотири поля по 2000 символів давали ~8000 — удвічі
        // більше за ліміт sendMessage, і Telegram відхиляв справну заявку.
        'text' => utf16_truncate($text, (int) ($LIMITS['telegramTextLimit'] ?? 4096)),
    ]);
}

if ($status !== 200) {
    fail(502, 'The message could not be delivered. Please try again.');
}

echo 'Sent.';
