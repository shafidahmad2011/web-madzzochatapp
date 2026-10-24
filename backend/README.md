# Baileys service on Render

This Node.js/Express service connects to WhatsApp using Baileys and stores its
authentication credentials and signal keys in Supabase. It does not persist
session data to the local filesystem, which is ephemeral on Render.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and set the required Supabase values. The service
listens on `PORT` (default `3000`).

## API

- `GET /health` — service health and connection state.
- `GET /status` — WhatsApp connection state.
- `GET /qr` — QR data for linking the WhatsApp account (requires API token).
- `POST /send` — send a text message with JSON `{ "to": "<jid>", "text": "..." }` (requires API token).
- `GET /settings` and `PUT /settings` — inspect/update auto-reply settings (requires API token).

Send `Authorization: Bearer <API_TOKEN>` to the protected endpoints. `/health`
and `/status` are public; the QR and message controls are not.

Auto-reply only responds to private chats when `auto_reply` is enabled in
`wa_settings`. `auto_rvo` is retained as a disabled compatibility setting;
enabling it through the API is rejected. Incoming view-once messages are never
forwarded or copied.

## Deploy to Render

1. Create a **Web Service** from this repository.
2. Set **Root Directory** to `backend`.
3. Choose the Node runtime, then set **Build Command** to `npm install` and
   **Start Command** to `npm start`.
4. Add these environment variables:
   - `SUPABASE_URL` — Supabase project URL.
   - `SUPABASE_SERVICE_KEY` — Supabase service-role key; keep it private.
   - `SESSION_ID` — stable identifier for the WhatsApp session.
   - `API_TOKEN` — long random token for the protected API endpoints.
   - `RENDER_EXTERNAL_URL` — the service's public `https://...onrender.com` URL.
5. Run `supabase/schema.sql` in the Supabase SQL editor before starting the
   service.
6. Fetch `/qr` with `Authorization: Bearer <API_TOKEN>` (for example via curl
   or an API client) and scan the returned QR data. Credentials and keys are
   then saved to Supabase and restored on reconnect/restart.

The service pings its own `/health` endpoint immediately and every 10 minutes
while running. Vercel Cron and an external monitor can provide additional
requests, but free-tier sleep/restarts and plan limits mean this is best-effort,
not a guarantee of continuous uptime.

## WhatsApp and privacy

Baileys is unofficial and WhatsApp may restrict accounts using it. Use it
responsibly. View-once media is not forwarded or copied by this service.
