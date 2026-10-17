# Лендинг

Односторінковий сайт на Astro: лендинг, політика конфіденційності, сторінка
подяки й 404. Форма заявки надсилає дані в Telegram через PHP — сайт
розрахований на звичайний хостинг з cPanel. Створено плагіном `landing@forze`.

Правила роботи з проєктом — у `CLAUDE.md`. Їх читає й Claude Code, тож далі
можна працювати з ним напряму: `/add-section`, `/add-page`.

## Швидкий старт

```bash
npm ci               # саме ci, не install — точні версії з lock-файла
npm run dev          # http://localhost:4321
```

Для перевірки форми локально потрібен PHP 8.1+ і файл `.env` у корені проєкту
(скопіюй `.env.example`). Без PHP сайт працює, а форма відповідає поясненням.

| Команда | Що робить |
| --- | --- |
| `npm run dev` | Дев-сервер; форма працює через локальний PHP |
| `npm run build` | Збірка в `dist/` разом із `form.php` і `.htaccess` |
| `npm run check` | Перевірка зібраного сайту перед здачею |
| `npm run pack` | `release/<домен>.zip` — архів для заливання |
| `npm run preview` | Перегляд `dist/` (без PHP: форма тут не працює) |
| `npm run test:phone` | Тест маски телефону |

## Що де міняти

| Що | Де |
| --- | --- |
| Назва, домен, телефони, email, адреса, години, месенджери, меню | `src/site.config.js` |
| Кольори, шрифти, відступи | `src/styles/base/variables.css` |
| Тексти лендингу, порядок секцій | `src/pages/index.astro` |
| Політика конфіденційності | `src/pages/privacy-policy.astro` |
| Фото й іконки | `public/assets/` |
| OG-зображення 1200×630 | `public/assets/seo/og.jpg` |

## Заливання на cPanel

```bash
npm run build && npm run check && npm run pack
```

1. **SSL.** У cPanel → SSL/TLS Status переконайся, що для домену є сертифікат
   (AutoSSL). Сайт переадресовує на `https://`, і без сертифіката не відкриється.
2. **Файли.** cPanel → File Manager → `public_html` → Upload →
   `release/<домен>.zip` → Extract. Вміст архіву має лягти прямо в
   `public_html`, без проміжної теки.
3. **Доступи бота.** Створи файл `.env` **на рівень вище** за `public_html`
   (тобто в `/home/<користувач>/.env`), зі змістом як у `.env.example` —
   справжній токен бота й chat id.
4. **PHP.** cPanel → MultiPHP Manager: версія PHP 8.1 або новіша. Якщо файли
   від 8 МБ не доходять — cPanel → MultiPHP INI Editor: `upload_max_filesize`
   і `post_max_size` не менші за ліміт у `SITE.form.maxFileMb`.
5. **Перевірка.** Надішли тестову заявку з сайту й переконайся, що вона
   прийшла в Telegram — з файлом і без.

## Перед здачею клієнту

- [ ] `npm run check` зелений
- [ ] OG-зображення й фавікони клієнта на місці
- [ ] Політику конфіденційності вичитав юрист
- [ ] Тестова заявка дійшла в Telegram на бойовому домені
- [ ] `npm audit` чистий або знахідки оцінені (правило 6 у `CLAUDE.md`)
