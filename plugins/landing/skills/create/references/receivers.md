# Where requests go

## Telegram — built in

The scaffold already handles it: `server/form.php` sends a request as a
message, and with a file — as a document. Two values are needed in `.env`:
`TELEGRAM_BOT_TOKEN` and `CHAT_ID`.

Instructions for the person (they do this themselves and never paste the
values into the chat):

1. In Telegram open **@BotFather** → `/newbot` → a name → a username ending in
   `…bot`. BotFather sends a token like `123456789:AA…`.
2. Create a group for requests (or use an existing one) and add the bot.
3. Post any message in the group.
4. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and find
   `"chat":{"id":-100…` — that's the chat id (groups start with `-100`).
5. Put both values into `.env`:
   - locally — in the project root (copy `.env.example` → `.env`);
   - on the hosting — in a `.env` file **one level above** `public_html`.

Can't find the chat id (empty `getUpdates`) — the bot can't see group
messages: in BotFather `/setprivacy` → Disable, or send a message with the
command `/start@bot_username`.

## Other receivers (email, CRM, Google Sheets, webhook)

**Don't write the integration from memory.** APIs change, and a mistake here
means requests that are silently lost.

1. Ask the person for **current documentation** (a link) or **an example of a
   working request** (curl, Postman), and where to get the key.
2. Record the integration as a separate stage in the task file, with a
   verification checklist.
3. Implement it in `server/form.php` **after** all the anti-spam checks, where
   the Telegram delivery happens (or next to it, if both are needed). Keys
   come only from `.env`, like `TELEGRAM_BOT_TOKEN`.
4. The server response stays the same: `200 Sent.` on success, `502` when
   delivery fails — the form's behaviour in the browser depends on it.
5. Update section 4 of the privacy policy: who else receives the data.

Email via PHP `mail()` on shared hosting often lands in spam or is blocked —
if the person wants email, propose the SMTP of their mail service and ask for
its settings.
