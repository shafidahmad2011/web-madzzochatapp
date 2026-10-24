# MadzzoChatApp Frontend

This is the Vercel-hosted Next.js app for the private WhatsApp browser dashboard.

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BAILEYS_SERVICE_URL=http://localhost:3000
BAILEYS_API_TOKEN=the-same-secret-as-backend-API_TOKEN
BACKEND_ACCESS_EMAILS=you@example.com
```

## Run locally

```bash
npm install
npm run dev
```

## Production notes

- Deploy to Vercel with the project Root Directory set to `frontend`.
- Set `BAILEYS_SERVICE_URL` to the public backend URL and set
  `BAILEYS_API_TOKEN` to the backend's `API_TOKEN`. These are server-side
  variables; never prefix them with `NEXT_PUBLIC_`.
- Set `BACKEND_ACCESS_EMAILS` to a comma-separated allowlist of Supabase Auth
  email addresses. The server-side API proxy requires both a valid Supabase
  session and an allowlisted email before it forwards requests.
- Enable email/password sign-in in Supabase Auth and create the allowed user.
  Public sign-up should remain disabled unless the app is intentionally opened
  to new accounts.
- Sign in to the frontend and visit `/connect-wa` to connect. The QR is loaded
  through the authenticated server proxy and refreshes every 20 seconds;
  backend credentials are never sent to the browser.
- `/api/baileys/*` proxies the narrowly allowlisted backend operations. Keep the
  backend API token and Supabase service-role key in server-side environment
  variables only.
- The Baileys service is deployed separately in a Docker container. Follow the
  repository deployment guide for Suga and configure UptimeRobot against its
  public `/health` URL if availability monitoring is desired.
