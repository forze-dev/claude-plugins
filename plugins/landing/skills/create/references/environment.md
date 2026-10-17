# Environment: what is needed and how to install it

Always: first show the person the list of commands, explain what each one does,
and **wait for confirmation**. Commands with `winget`, `brew` or `apt` may ask
for admin rights or a password — the person enters it themselves.

| Program | Version | Required | Why |
| --- | --- | --- | --- |
| Node.js | 22.12+ | yes | building the site |
| npm | bundled with Node | yes | dependencies |
| PHP | 8.1+ | no | testing the form locally |
| git | any | no | a commit after every stage |

## Windows (winget)

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id PHP.PHP.8.3 -e
winget install --id Git.Git -e
```

After installing, **restart the terminal and Claude Code** — otherwise the new
programs aren't on `PATH`.

No `winget` (old Windows 10) — Node from https://nodejs.org (LTS), git from
https://git-scm.com, PHP — the zip from https://windows.php.net/download
(Non Thread Safe, x64), unpacked to `C:\php` and added to `PATH`.

If Node is present but old and the machine uses nvm-windows:
`nvm install 22` and `nvm use 22`.

## macOS (Homebrew)

```bash
brew install node@22 php git
brew link --overwrite node@22
```

No Homebrew — first install it from https://brew.sh (the person runs the
command from the site themselves; it asks for a password).

## Linux (Debian/Ubuntu)

```bash
# Node 22 via nvm — no sudo and no conflict with a system node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# restart the terminal, then:
nvm install 22

sudo apt update
sudo apt install -y php-cli php-curl php-mbstring git
```

The PHP back end needs the `curl` and `mbstring` extensions — on cPanel
hosting they are almost always enabled; locally on Linux they are installed
separately, as above.

## After installing

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/create/scripts/doctor.mjs"
```

It must show `ok` for Node and npm. PHP and git are recommended, but the skill
works without them.
