# MadzzoChatApp Frontend

This is the Vercel-hosted Next.js app for the private WhatsApp browser dashboard.

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Run locally

```bash
npm install
npm run dev
```

## Production notes

- Deploy to Vercel with the project Root Directory set to `frontend`.
- The Baileys service is deployed separately in a Docker container. Follow the
  repository deployment guide for Suga and configure UptimeRobot against its
  public `/health` URL if availability monitoring is desired.
