# Privacy policy — forze plugins for Claude Code

Last updated: 2026-10-17

This policy covers the plugins published in the `forze` marketplace
(<https://github.com/forze-dev/claude-plugins>), currently `landing@forze`.

## What the plugins collect

**Nothing.** The plugins contain no analytics, telemetry, tracking or
"phone home" code. The author receives no data about who installs them, how
they are used, or what is built with them.

## What runs and where

- The plugins are instructions, scripts and a project template that run
  **locally on your machine**, inside your Claude Code session.
- Your conversation with Claude, including the client materials you share, is
  processed by Anthropic under Anthropic's own terms and privacy policy — the
  plugin author has no access to it.
- The scripts make network requests only to install the generated project's
  dependencies from the npm registry (`npm ci`). They make no other requests.
- Credentials (for example a Telegram bot token) are never requested in the
  chat and never written by the plugin: you enter them yourself into a local
  `.env.<domain>` file that is excluded from git and from the build.

## Websites built with the plugins

A website generated with `landing@forze` is **your** website (or your
client's). Its request form sends the data a visitor enters to the receiver
you configure — Telegram by default. The plugin author is not involved in that
data flow and never receives it. The generated site ships a privacy policy
**draft** that must be reviewed by a lawyer and adapted to the site owner's
actual practice before launch.

## Contact

Questions about this policy: open an issue at
<https://github.com/forze-dev/claude-plugins/issues>.

Changes to this policy are published in this file; the date at the top shows
the latest version.
