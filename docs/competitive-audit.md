# Аудит конкурентів: лендинг під ключ через Claude Code

Дата: 17.10.2026. Порівнюємо `landing@forze` (і шаблон, з якого він виріс) з
трьома групами альтернатив: інші скіли/плагіни для Claude Code, AI-конструктори
сайтів і готові Astro-шаблони.

> Цифри популярності й описи сторонніх продуктів — з їхніх сторінок і
> каталогів-агрегаторів; вони не перевірялися незалежно. Перед публічним
> порівнянням варто перевірити кожен пункт напряму.

## 1. Скіли й плагіни Claude Code для лендингів

| Продукт | Що робить | Вихід | SEO / schema | Форма й бекенд | Деплой |
| --- | --- | --- | --- | --- | --- |
| **alirezarezvani `landing`** (плагін, `/cs:landing`) | 4 питання (продукт, аудиторія, кольори, тон) → один HTML-файл з GSAP-анімаціями | один `.html`, інлайн CSS/JS, Google Fonts і GSAP з CDN | не заявлено | немає | немає |
| **alirezarezvani `landing-page-generator`** | лендинг «на конверсію» | Next.js + Tailwind | не заявлено | немає | немає |
| **kuse-ai `landing-page-creator`** | генерація лендингу, бренд-консистентний дизайн | HTML/CSS у проєкті | не заявлено | немає | немає |
| **wshobson/agents `brand-landingpage`** | лендинг у стилі бренду, частина великого набору агентів | не описано | не заявлено | не описано | не описано |
| **Felo Landing Page** | генерує сторінку з промпту й хостить її | сторінка на домені Felo | не заявлено | — | хостинг Felo, потрібен API-ключ |

**Спільне в усіх:** генерують *верстку* — гарну, швидко, з одного промпту. Ніхто
не закриває решту шляху до живого сайту клієнта: бриф із реальних матеріалів,
перевірка фактів, форма, яка реально доставляє заявки, структуровані дані,
юридична сторінка, деплой на звичайний хостинг, передзапускова перевірка.

## 2. AI-конструктори сайтів

| Продукт | Сильне | Слабке для нашого сценарію |
| --- | --- | --- |
| **Framer AI** | найкращий візуальний результат «з коробки» | хостинг Framer, пропрієтарна розмітка, експорт статики не є основним сценарієм, підписка |
| **Lovable** | фронт + бекенд + БД разом, React/Tailwind | SPA: без пререндеру пошуковик бачить порожню сторінку; керовані сервіси не експортуються як код |
| **v0 (Vercel)** | чисті React/Tailwind-компоненти | лише фронт; бекенд, форма, деплой — на розробнику; прив'язка до екосистеми Vercel |
| **Bolt** | більше контролю для технічних користувачів | React/Next у WebContainer; статичний експорт не підтверджено |
| **Durable** | сайт за ~30 секунд | мінімалістична розмітка без семантичної глибини; власний хостинг |

**Спільне:** швидкість і візуал. Платять за це хостингом-заручником, SPA або
слабкою семантикою, і жоден не дає архів, який залив на cPanel за 50 грн/міс і
забув.

## 3. Готові Astro-шаблони

| Продукт | Що є | Чого немає |
| --- | --- | --- |
| **Stone** (premium) | 15+ секцій, темна тема, View Transitions | бекенд форми, schema, процес |
| **SaaSify** (Colorlib, ціна різниться між джерелами) | SaaS-лендинг | бекенд форми, локальний бізнес |
| **Studiova** (WrapPixel, комерційний) | бізнес/агенція, «SEO-friendly» | бекенд форми, деплой на PHP |
| **Astrolize** (free) | Astro + Tailwind, лендинг і блог | форма через сторонній сервіс (FabForm) |
| Туторіали Astro + Telegram (Rodney Lab, mpz.im) | форма → Telegram | лише serverless (Netlify), не PHP/cPanel; без schema |

**Спільне:** шаблон — це верстка. Хтось усе одно має зібрати бриф, наповнити,
налаштувати форму, перевірити й задеплоїти. Під PHP/cPanel із Telegram і
структурованими даними в обох форматах готового рішення не знайшлося.

## 4. Наш шаблон (до плагіна) — чесно

Сильне:

- один конфіг на весь сайт, перевірено: зміна контактів переписує 100% виводу;
- детермінованість, яку реально перевірено (дві збірки — ідентичний `dist/`);
- власна передзапускова перевірка `check.mjs`, що падає на заглушках;
- форма з продуманим антиспамом (honeypot, тривалість, сигнатури файлів);
- JSON-LD + мікророзмітка, зв'язані через `itemid`;
- процес для агентів: задачі по етапах, ченжлог, правила.

Слабке (з аудиту 17.10.2026, у плагіні виправлено):

| Проблема | У плагіні |
| --- | --- |
| Vercel-функція обмежена 4.5 МБ, а форма обіцяла 20 МБ | лише PHP/cPanel — обмеження немає |
| `npm audit`: 3 high, документація каже «чисто» | lock оновлено патчами транзитивних, audit чистий |
| `/add-page` вчив `graph(...)` — невалідний граф | виправлено, пояснено чому |
| сторінка подяки: біла картка на білому | виправлено |
| `.htaccess` без HTTP→HTTPS | один редірект на https + без www |
| «20 MB» вписано вручну в 6 місцях | `{size}`/`{types}` з `SITE.form`, `.htaccess` генерується |
| мікророзмітка розходилась із JSON-LD (адреса, опис, телефони) | один вузол у футері, значення збігаються |
| англійські рядки по компонентах | `SITE.ui` + `messages` |
| `/start` не знав про `temp/`, правила вимагали git | скіл читає матеріали першим; правило 3 працює з git і без |
| rate limit до перевірки файла блокував повторну спробу | rate limit після файла |
| клієнт показував однакову помилку на 429 | окреме повідомлення |

## 5. Позиціювання `landing@forze`

Ніша, яку ніхто з перелічених не закриває: **«сайт для малого бізнесу від
сирих матеріалів до архіву на cPanel» для людини, яка не є розробником.**

| Можливість | Скіли CC | AI-конструктори | Astro-шаблони | **landing@forze** |
| --- | --- | --- | --- | --- |
| Бриф із реальних матеріалів клієнта, без вигадок | — | частково | — | **так** |
| Статичний HTML, видимий пошуковикам | так | залежить | так | **так** |
| Форма, що доставляє заявки (Telegram), з антиспамом | — | частково | — | **так** |
| Звичайний PHP-хостинг (cPanel) | — | — | вручну | **так, архів** |
| JSON-LD + мікророзмітка, синхронні | — | — | — | **так** |
| Передзапускова перевірка, що блокує заглушки | — | — | — | **так** |
| Детермінована збірка й архів | — | — | — | **так** |
| Проєкт живе далі без інструмента | так | ні | так | **так** |
| Візуальний «вау» з одного промпту | **так** | **так** | так | середньо |

### Чесні слабкі місця й що з ними робити

1. **Візуал скромніший за Framer і анімаційні скіли.** Шаблон — чистий,
   стриманий, без анімацій. Напрям: 2–3 теми оформлення (токени) і
   опціональна секція з анімацією, що не ламає Core Web Vitals.
2. **Бар'єр входу — Claude Code на ПК.** Людина має його встановити й
   оплатити. Плагін прибирає знання про Node/npm/git, але не саму установку.
3. **Немає локальної перевірки форми без PHP.** Скіл пропонує встановити PHP;
   без нього форма перевіряється вже на хостингу.
4. **Один приймач з коробки (Telegram).** Email/CRM — за документацією, що
   надає людина. Напрям: вбудований SMTP-приймач як другий варіант.
5. **Лише один тип сайту.** Свідомо. Наступні плагіни в маркетплейсі `forze` —
   окремими продуктами (`blog@forze`, `shop@forze`), а не розширенням цього.

## Джерела

- [alirezarezvani `landing` — Claude Plugin Hub](https://www.claudepluginhub.com/plugins/alirezarezvani-landing-marketing-landing)
- [Landing Page Generator — Claude Code Marketplaces](https://claudemarketplaces.com/skills/alirezarezvani/claude-skills/landing-page-generator)
- [Landing Page Creator — Claude Code Marketplaces](https://claudemarketplaces.com/skills/kuse-ai/kuse-skills/landing-page-creator)
- [brand-landingpage — vibeindex](https://www.vibeindex.ai/skills/wshobson/agents/brand-landingpage)
- [Felo Landing Page Skill](https://felo.ai/skills/claudecode/felo-landingpage)
- [Best AI Landing Page Builders 2026 — Dupple](https://dupple.com/learn/best-ai-landing-page-builders)
- [AI Website Builder Comparison — Till Freitag](https://till-freitag.com/en/blog/ai-website-builder-comparison)
- [Lovable vs Webflow vs Framer — Till Freitag](https://till-freitag.com/en/blog/lovable-vs-webflow-vs-framer)
- [Premium Astro Templates — AdminLTE](https://adminlte.io/blog/premium-astro-templates/)
- [Astro website templates — Colorlib](https://colorlib.com/wp/astro-website-templates)
- [Studiova — WrapPixel](https://wrappixel.com/templates/studiova-astro-business-agency-website-template)
- [Astrolize starter — godev](https://godev.substack.com/p/starter-template-for-astro-with-tailwind)
- [Astro landing page form — Rodney Lab](https://rodneylab.com/astro-landing-page-form/)
- [Plugins reference — Claude Code docs](https://code.claude.com/docs/en/plugins-reference)
- [Create a marketplace — Claude Code docs](https://code.claude.com/docs/en/plugin-marketplaces)
