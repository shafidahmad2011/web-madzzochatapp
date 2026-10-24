# Baileys service on Zeabur

This Node.js/Express service connects to WhatsApp with Baileys and stores its
authentication credentials and keys in Supabase. It does not persist session
data on the local filesystem.

## Local development

```bash
npm install
npm run dev
```

Set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_ID`, and `API_TOKEN` in
`.env`. The service listens on `PORT` (default `3000` locally).

## API

- `GET /health` — public health check.
- `GET /status` — public WhatsApp connection state.
- `GET /qr` — QR data for account linking; requires `Authorization: Bearer <API_TOKEN>`.
- `POST /send` — send JSON `{ "to": "<jid>", "text": "..." }`; requires API token.
- `GET /settings` and `POST /settings` — read/update auto-reply settings; require API token.

Auto-reply responds only to private chats when `wa_settings.auto_reply` is
enabled. View-once media is not forwarded or copied.

## Deploy on Zeabur

1. Deploy the source repository through Zeabur.
2. Set the service's root/working directory to `backend` for this monorepo.
3. Zeabur detects the Node project from `package.json`; `npm start` runs
   `node src/index.js`.
4. Set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_ID`, and `API_TOKEN` in
   the service's environment variables.
5. Run `supabase/schema.sql` in Supabase before launching the service.
6. Call `/qr` with the bearer API token and scan the returned QR.

The server binds to Zeabur's `PORT` environment variable. Credentials and keys
are restored from Supabase after restarts. A Vercel Cron or external monitor
can request `/health` if the service sleeps, but neither is an uptime
guarantee.

Baileys is unofficial and WhatsApp may restrict accounts using it. Use it
responsibly.
