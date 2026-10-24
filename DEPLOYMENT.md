# MadzzoChatApp deployment

## 1. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Keep the Supabase service-role key only in the Zeabur backend environment.
   Never expose it through a `NEXT_PUBLIC_` variable.
4. The schema enables RLS and restricts access to the backend service role.

## 2. Baileys service on Zeabur

1. Push the project to GitHub and sign in to Zeabur with GitHub.
2. Create a project, select **Add New Service → Deploy your source code**, and
   choose the repository.
3. This is a monorepo. Set the service's working/root directory to `backend`
   if Zeabur does not select it automatically.
4. Zeabur should detect Node.js from `backend/package.json`. Its existing
   `"start": "node src/index.js"` script starts the service. No custom start
   command or `zbpack.json` should be needed.
5. Add these environment variables to the backend service:
   - `SUPABASE_URL` — Supabase project URL.
   - `SUPABASE_SERVICE_KEY` — Supabase service-role key.
   - `SESSION_ID` — stable ID used to load/store the WhatsApp session.
   - `API_TOKEN` — long random token required by `/qr`, `/send`, and
     `/settings`.
6. Deploy. Use the public service URL to check `/health` and `/status`. Fetch
   `/qr` with the `Authorization: Bearer <API_TOKEN>` header, then scan the
   returned QR using WhatsApp.

The app listens on `process.env.PORT` (with a local development fallback),
stores Baileys credentials and signal keys in Supabase rather than local files,
and attempts to reconnect after an unexpected WhatsApp disconnect. `/health`
and `/status` are public; `/qr`, `/send`, and `/settings` require the API token.

## 3. Keep-alive

Zeabur service sleep behavior depends on the plan and service configuration.
An incoming health request may wake an idle service, but cold starts can
interrupt the WhatsApp connection. Keep-alive is best-effort, not an uptime
guarantee.

### Vercel Cron

Deploy `frontend/` to Vercel with its Root Directory set to `frontend`. Under
**Project Settings → Environment Variables**, add:

- `ZEABUR_SERVICE_URL` — the public Zeabur domain, without `/health`.
- `CRON_SECRET` — a strong random value for authenticating the cron request.

`frontend/vercel.json` schedules `/api/keep-alive` every 10 minutes. The API
route checks `Authorization: Bearer <CRON_SECRET>` and requests the service's
public `/health` endpoint. Verify invocations in Vercel **Cron Jobs** and
**Logs**. Cron availability and minimum interval depend on the Vercel plan:
check the dashboard to confirm that a 10-minute schedule is allowed.

### UptimeRobot backup

1. Sign up at [UptimeRobot](https://uptimerobot.com/).
2. Add an HTTP(s) monitor for `https://<your-service-domain>/health`.
3. Choose an interval supported by your monitor plan, such as 5 minutes if
   available.

## 4. WhatsApp note

Baileys is unofficial and can lead to WhatsApp account restrictions. Use it
responsibly. View-once media is not forwarded or copied by this service.
