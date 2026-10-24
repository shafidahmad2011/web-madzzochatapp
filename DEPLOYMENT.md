# MadzzoChatApp deployment

## 1. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Store the Supabase service-role key only in the backend service's
   environment. Never expose it through a `NEXT_PUBLIC_` variable.
4. The schema enables RLS and grants backend access to the service role.

## 2. Baileys service on Suga

1. Sign in to Suga with GitHub and create a project.
2. Connect the GitHub repository that contains this app.
3. Set the Docker build context/root directory to `backend` so the platform
   finds `backend/Dockerfile` and `backend/package.json`.
4. Build and run the Docker image. The Dockerfile uses Node 18 Alpine,
   installs dependencies, copies the backend source, and runs `npm start`
   (`node src/index.js`).
5. Set these backend environment variables in Suga:
   - `SUPABASE_URL` — Supabase project URL.
   - `SUPABASE_SERVICE_KEY` — Supabase service-role key; keep private.
   - `SESSION_ID` — stable identifier for the WhatsApp session.
   - `API_TOKEN` — long random token required by `/qr`, `/send`, and
     `/settings`.
6. Deploy. The service reads the runtime `PORT` and binds on `0.0.0.0`.
   `EXPOSE 3000` in the Dockerfile is metadata; follow Suga's current
   instructions for configuring the container port if its dashboard requests
   one.
7. Check `https://<your-service-domain>/health`. Fetch `/qr` with
   `Authorization: Bearer <API_TOKEN>` and scan the returned QR with WhatsApp.

Baileys credentials and signal keys are persisted in Supabase, not local
container files. The service reconnects after unexpected WhatsApp disconnects.
`/health` and `/status` are public. `/qr`, `/send`, and `/settings` require the
API token.

## 2. Frontend on Vercel

1. Set the Vercel project Root Directory to `frontend`.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the project's public Supabase values.
3. Configure server-only `BAILEYS_SERVICE_URL` with the public Suga service URL
   and `BAILEYS_API_TOKEN` with the same value as backend `API_TOKEN`.
4. Set `BACKEND_ACCESS_EMAILS` to a comma-separated allowlist of Supabase Auth
   email addresses. Create those accounts in Supabase Auth and disable public
   sign-up unless it is intentionally needed.
5. Deploy, sign in, then open `/connect-wa` and scan the QR. The browser never
   receives the backend API token.

## 3. Availability monitoring

No self-ping or Vercel Cron is configured for this service. Check Suga's
current plan and service settings for sleep, restart, and availability
behavior; verify any no-sleep claim with Suga's current documentation.

For monitoring, configure an HTTP(s) monitor in
[UptimeRobot](https://uptimerobot.com/) for
`https://<your-service-domain>/health` with GET. Choose a polling interval
available on your UptimeRobot plan. The health endpoint should return HTTP 200
and `{ "status": "ok" }`. Monitoring reports availability; it does not itself
guarantee continuous uptime.

## 4. WhatsApp note

Baileys is unofficial and can lead to WhatsApp account restrictions. Use it
responsibly. View-once media is not forwarded or copied by this service.
