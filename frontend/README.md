# MadzzoChatApp Frontend

This is the Vercel-hosted Next.js app for the private WhatsApp browser dashboard.

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BAILEYS_SERVICE_URL=http://localhost:3000
```

## Run locally

```bash
npm install
npm run dev
```

## Production notes

- Deploy to Vercel with the project Root Directory set to `frontend`.
- Set `BAILEYS_SERVICE_URL` to the public backend URL in the frontend
  environment (for local development, `http://localhost:3000`). Visit
  `/connect-wa`, enter the backend `API_TOKEN`, and scan the QR. The page
  refreshes the authenticated QR request every 20 seconds; the token is kept
  in page state only and is not exposed in frontend build variables.
- Install the frontend QR renderer with `npm install qrcode` and its TypeScript
  declarations with `npm install --save-dev @types/qrcode`. The backend already
  declares `qrcode-terminal`; run `npm install` in `backend` after pulling
  changes if it is not installed yet.
- The Baileys service is deployed separately in a Docker container. Follow the
  repository deployment guide for Suga and configure UptimeRobot against its
  public `/health` URL if availability monitoring is desired.
