<?php
/**
 * Request form back end for Apache / cPanel — the landing's only back end.
 *
 * It lives OUTSIDE `public/` on purpose: `npm run build` puts it into
 * `dist/scripts/` together with `form.limits.json`. During `npm run dev` it is
 * served by PHP's built-in server (`php -S`), which Astro's dev server proxies
 * to — so locally you test the same file that ships to the hosting.
 *
 * Limits are NOT retyped here — they are read from `form.limits.json`,
 * generated from src/site.config.js (tools/limits.mjs) and placed next to this
 * file.
 *
 * Credentials come from a .env file in a `secrets` folder OUTSIDE the site root:
 *
 *   /home/user/secrets/.env.<domain>   ← the file, as created by `npm run env`
 *   /home/user/public_html/            ← the site root
 *
 * The file may also be renamed to plain `.env` inside secrets/. Locally (npm
 * run dev) the same names are read from the project root.
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

/* ----------------------------------------------------------------- helpers */

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo $message;
    exit;
}

/**
 * Limits — from the same source the browser uses (SITE.form).
 *
 * Without the file we can't work: silent defaults would mean the server and
 * the browser have drifted apart, which is exactly what this file prevents.
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
 * A minimal .env reader: the first readable candidate wins.
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
 * Truncation by UTF-16 code units — what Telegram counts.
 *
 * `mb_substr` counts characters, not UTF-16 units, so with emoji the message
 * would exceed Telegram's limit and be rejected. Here we count UTF-16 units
 * and never split a surrogate pair.
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
 * Whether the request came from our own site.
 *
 * Stops other sites posting to this form from a visitor's browser. It does NOT
 * protect against a script outside a browser: that fakes the Origin header
 * effortlessly. The honeypot, fill duration and rate limit do the real work.
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
 * One marker per IP in the system temp folder; no database needed.
 *
 * Errors are NOT suppressed: there used to be an `@touch` here, and on a host
 * with `open_basedir` the rate limit silently switched off — the site looked
 * protected without being so.
 *
 * Stale markers are cleaned up here too: otherwise /tmp would accumulate files
 * forever. This is a speed bump, not a wall: there is no locking between
 * parallel requests, so two simultaneous ones both get through.
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

    // Clean up other people's stale markers while we're here.
    foreach (glob($dir . '/form-*.txt') ?: [] as $stale) {
        if ((time() - (int) @filemtime($stale)) > $seconds * 60) {
            @unlink($stale);
        }
    }
}

/**
 * What the file really is.
 *
 * `$_FILES['type']` is not checked at all — the browser sends it, so it proves
 * nothing: a PE file named `evil.pdf` would otherwise pass. The first bytes of
 * the file are checked against the config's signature table, for exactly the
 * extension the file claims.
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

/* ---------------------------------------------------------------- defences */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'Method Not Allowed');
}

/**
 * PHP drops a body larger than `post_max_size` before we see it: $_POST and
 * $_FILES are empty while Content-Length is not. Without this check the
 * honeypot saw an empty field (passed), the duration was missing — and a
 * request full of "Not provided" went to Telegram with status 200.
 */
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && $_POST === [] && $_FILES === []) {
    fail(413, 'The request is too large for this server. Attach a smaller file or contact us directly.');
}

$maxFieldLength = (int) ($LIMITS['maxFieldLength'] ?? 2000);
$maxFileSize = (int) ($LIMITS['maxFileSize'] ?? 20971520);

// 1. Honeypot: the field is moved off-screen, so only a bot fills it in.
if (field('company', $maxFieldLength) !== '') {
    fail(400, 'Rejected.');
}

// 2. Fill duration. The field must be present and numeric: the check used to
//    sit under `if ($value > 0)`, so a bot skipped it simply by not sending the
//    field. This is a DURATION from the client's performance.now(), not a
//    timestamp: someone else's clock can't be compared with ours.
$elapsedRaw = $_POST['elapsedMs'] ?? '';
if (!is_string($elapsedRaw) || !is_numeric($elapsedRaw)) {
    fail(400, 'Rejected.');
}
if ((float) $elapsedRaw < ((float) ($LIMITS['minFillSeconds'] ?? 3)) * 1000) {
    fail(400, 'Rejected.');
}

// 3. The request must come from our own site.
if (!origin_allowed((string) ($LIMITS['siteUrl'] ?? ''))) {
    fail(400, 'Rejected.');
}

/* ------------------------------------------------------------------ 4. file */

$upload = $_FILES['drawing'] ?? null;
$uploadError = is_array($upload) ? (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE) : UPLOAD_ERR_NO_FILE;

/**
 * Everything except UPLOAD_ERR_OK used to be treated as "no file" — and the
 * request went out without the attachment, with status 200. On shared hosting
 * `upload_max_filesize` is typically 2M or 8M, so a 15 MB drawing silently
 * vanished while the user saw "Sent.".
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
 * 5. Rate limit — AFTER the file check. Otherwise someone who attached the
 * wrong file type would be rejected, fix it — and hit "wait 20 seconds" for a
 * request that never went anywhere.
 */
enforce_rate_limit((int) ($LIMITS['rateLimitSeconds'] ?? 20));

/* ------------------------------------------------------------ credentials */

/**
 * One level above the site root: on the hosting that is the user's home folder
 * (secrets/ lives there); under `npm run dev` the document root is server/, so
 * one level up is the project root, where the local .env files live.
 */
$above = dirname((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__));
$domain = (string) (parse_url((string) ($LIMITS['siteUrl'] ?? ''), PHP_URL_HOST) ?? '');

$env = load_env(array_filter([
    $domain !== '' ? "{$above}/secrets/.env.{$domain}" : null,
    "{$above}/secrets/.env",
    $domain !== '' ? "{$above}/.env.{$domain}" : null,
    "{$above}/.env",
]));

$botToken = $env['TELEGRAM_BOT_TOKEN'] ?? (getenv('TELEGRAM_BOT_TOKEN') ?: '');
$chatId   = $env['CHAT_ID'] ?? (getenv('CHAT_ID') ?: '');

if ($botToken === '' || $chatId === '') {
    fail(500, 'The form is not configured yet: TELEGRAM_BOT_TOKEN and CHAT_ID are missing. Put the filled .env.<domain> into the secrets folder one level above public_html.');
}

/* ----------------------------------------------------------------- message */

$text = "New request from the website\n\n"
    . 'Name: ' . field('username', $maxFieldLength, 'Not provided') . "\n"
    . 'Phone: ' . field('phone', $maxFieldLength, 'Not provided') . "\n"
    . 'Comment: ' . field('comment', $maxFieldLength, 'No comment') . "\n"
    . 'Page: ' . field('page', $maxFieldLength, '/');

if ($hasFile) {
    $text .= "\n\nA file is attached.";
}

/* ---------------------------------------------------------------- delivery */

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
        // Without truncation four fields of 2000 characters gave ~8000 — twice
        // the sendMessage limit, and Telegram rejected a perfectly valid request.
        'text' => utf16_truncate($text, (int) ($LIMITS['telegramTextLimit'] ?? 4096)),
    ]);
}

if ($status !== 200) {
    fail(502, 'The message could not be delivered. Please try again.');
}

echo 'Sent.';
