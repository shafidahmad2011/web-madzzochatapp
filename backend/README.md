# Baileys service on Suga

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
When Baileys emits a new `connection.update` QR, the service stores the QR for
`GET /qr` and renders a scannable terminal QR with `qrcode-terminal`.

## Deploy on Suga with Docker

1. Sign in to Suga with GitHub and create a new project.
2. Connect the GitHub repository containing this service.
3. Select the `backend` directory as the service/build context and use its
   `Dockerfile`.
4. Add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_ID`, and `API_TOKEN`
   to the service environment. Do not commit `.env` or expose the service-role
   key in frontend variables.
5. Run `supabase/schema.sql` in Supabase before launching the service.
6. Deploy and open `/qr` with the bearer API token to get the QR data; scan it
   with WhatsApp.

The Docker image uses Node 18 Alpine, installs dependencies, and starts with
`npm start`. The application listens on `process.env.PORT` (default `3000` for
local use); `EXPOSE 3000` in Docker is image metadata, not a replacement for
the platform's runtime port configuration. Verify Suga's current port and
container requirements in its service settings.

No application keep-alive loop is configured. If the service is expected to
remain continuously available, confirm Suga's current sleep and restart
behavior for your plan. Use UptimeRobot as an availability monitor, not as an
uptime guarantee:

1. Create an HTTP(s) monitor at [UptimeRobot](https://uptimerobot.com/).
2. Monitor `https://<your-service-domain>/health` using GET.
3. Choose an interval allowed by your UptimeRobot plan.
4. Confirm the monitor receives HTTP 200 with `{ "status": "ok" }`.

Baileys is unofficial and WhatsApp may restrict accounts using it. Use it
responsibly.
