# forze — маркетплейс плагінів Claude Code

Плагіни для створення клієнтських сайтів з Claude Code.

| Плагін | Команда | Що робить |
| --- | --- | --- |
| `landing@forze` | `/landing:create` | Односторінковий лендинг під ключ: матеріали клієнта → бриф → Astro-сайт з формою в Telegram → zip для cPanel |

## Встановлення

Потрібен [Claude Code](https://claude.com/claude-code) і Node.js 22.12+.

```bash
claude plugin marketplace add forze-dev/claude-plugins
claude plugin install landing@forze
```

Далі в новій порожній теці: `claude`, потім `/landing:create`. Скіл сам
перевірить середовище, спитає дозволу на встановлення відсутнього (PHP, git) і
проведе від матеріалів клієнта до архіву для cPanel.

Оновлення: `claude plugin marketplace update forze`. Видалення:
`claude plugin marketplace remove forze`.

Для розробки маркетплейс можна додати з локальної копії репозиторію:
`claude plugin marketplace add <шлях до клону>`.

## Розробка

```bash
claude --plugin-dir ./plugins/landing     # запустити з плагіном без встановлення
claude plugin validate ./plugins/landing  # перевірити маніфест плагіна
claude plugin validate .                  # перевірити маркетплейс
```

Перевірка каркаса лендингу:

```bash
cd plugins/landing/template
npm ci && npm run build && npm run check   # check падає на демо-даних — це навмисно
npm run test:phone
```

Перед комітом прибери з `template/` артефакти: `node_modules/`, `dist/`,
`release/`, `.astro/` (вони в `.gitignore`, але не мають потрапити й у копію
плагіна на диску користувача).

## Структура

```
.claude-plugin/marketplace.json     каталог маркетплейсу «forze»
plugins/landing/
  .claude-plugin/plugin.json        маніфест плагіна
  skills/create/SKILL.md            сценарій /landing:create (9 етапів)
  skills/create/references/         бриф, секції, середовище, приймачі, деплой
  skills/create/scripts/            doctor.mjs (середовище), scaffold.mjs (розгортання)
  agents/verifier.md                перевіряльник без прав на запис
  hooks/                            захист dist/, npm ci замість install, без audit fix --force
  template/                         каркас проєкту, який отримує клієнт
docs/competitive-audit.md           аудит конкурентів
```

## Версії

Плагін має `version` у `plugin.json` — користувачі отримують оновлення лише
після зміни цього числа. Змінив скіл чи каркас — підніми версію.
