# Середовище: що потрібно і як встановити

Завжди: спершу показати людині список команд, пояснити, що кожна робить, і
**дочекатися підтвердження**. Команди з `winget`, `brew`, `apt` можуть
попросити права адміністратора або пароль — людина вводить його сама.

| Програма | Версія | Обов'язкова | Навіщо |
| --- | --- | --- | --- |
| Node.js | 22.12+ | так | збірка сайту |
| npm | з Node | так | залежності |
| PHP | 8.1+ | ні | перевірка форми локально |
| git | будь-яка | ні | коміти після кожного етапу |

## Windows (winget)

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id PHP.PHP.8.3 -e
winget install --id Git.Git -e
```

Після встановлення **перезапусти термінал і Claude Code** — інакше нові
програми не видно в `PATH`.

Якщо `winget` немає (стара Windows 10) — Node з https://nodejs.org (LTS),
git з https://git-scm.com, PHP — архів з https://windows.php.net/download
(Non Thread Safe, x64), розпакувати в `C:\php` і додати в `PATH`.

Якщо Node уже є, але старий, і на машині використовується nvm-windows:
`nvm install 22` і `nvm use 22`.

## macOS (Homebrew)

```bash
brew install node@22 php git
brew link --overwrite node@22
```

Немає Homebrew — спершу встановлення з https://brew.sh (людина виконує
команду з сайту сама, вона попросить пароль).

## Linux (Debian/Ubuntu)

```bash
# Node 22 через nvm — без sudo і без конфлікту з системним node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# перезапусти термінал, потім:
nvm install 22

sudo apt update
sudo apt install -y php-cli php-curl php-mbstring git
```

PHP-бекенду потрібні розширення `curl` і `mbstring` — на хостингу cPanel вони
майже завжди ввімкнені; локально на Linux ставляться окремо, як вище.

## Після встановлення

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/create/scripts/doctor.mjs"
```

Має показати `ok` для Node і npm. PHP і git — бажано, але скіл працює й без них.
