# MadzzoChatApp deployment

## 1. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Keep the Supabase service-role key only in Render's server-side environment
   variables. Do not expose it through a `NEXT_PUBLIC_` variable.
4. The schema enables RLS and restricts the tables to the backend service role.

## 2. Baileys service on Render

1. Create a Render **Web Service** connected to this repository.
2. Set the service's **Root Directory** to `backend`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SESSION_ID`
   - `API_TOKEN` (a long random token for QR, send, and settings API endpoints)
   - `RENDER_EXTERNAL_URL` (the service's public Render URL)
5. After deployment, open `/qr` and scan the code to link WhatsApp.

The service uses Supabase for credentials and keys; Render's local filesystem
is not used for session persistence. It automatically reconnects when the
WhatsApp connection closes and exposes `/health`, `/status`, `/qr`, and `/send`.
`/qr`, `/send`, and `/settings` require `Authorization: Bearer <API_TOKEN>`.
Auto-reply is controlled by `wa_settings.auto_reply`.
The schema keeps `auto_rvo` disabled for compatibility; the API rejects
enabling it and does not forward view-once media.

## 3. Vercel keep-alive request

Deploy `frontend/` to Vercel (set it as the project Root Directory). Under
**Project Settings → Environment Variables**, add:

- `RENDER_SERVICE_URL` — the public Render URL, e.g.
  `https://your-service.onrender.com`.
- `CRON_SECRET` — generate a strong random secret yourself; Vercel uses it to
  authenticate Cron requests when the variable is set. Set it for Production,
  then redeploy.

`frontend/vercel.json` schedules `/api/keep-alive` every 10 minutes. Check the
project's **Cron Jobs** page and **Logs** for invocation results. A 401 usually
means the secret is absent or mismatched; a 502 means the Render health request
failed. Vercel Hobby may not permit a 10-minute schedule; verify current limits
in the Vercel dashboard and adjust the schedule or plan if necessary.

## 4. UptimeRobot backup monitor

1. Create an account at [UptimeRobot](https://uptimerobot.com/).
2. Add an HTTP(s) monitor for `https://your-service.onrender.com/health`.
3. Choose a five-minute interval if it is available on your UptimeRobot plan.

An external monitor can wake a sleeping service when it makes a request, but
neither this nor the in-process ping guarantees uninterrupted uptime on a free
plan. Consult Render's current free-service limits before relying on the
service for continuous connectivity.

## 5. Privacy and policy note

Baileys is unofficial and may result in WhatsApp account restrictions. This
service does not forward or copy view-once media; respect the sender's privacy
and WhatsApp's terms.
