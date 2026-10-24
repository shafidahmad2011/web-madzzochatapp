# MadzzoChatApp Frontend

This is the Vercel-hosted Next.js app for the private WhatsApp browser dashboard.

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ZEABUR_SERVICE_URL=https://your-service.zeabur.app
CRON_SECRET=your-generated-secret
```

## Run locally

```bash
npm install
npm run dev
```

## Production notes

- Deploy to Vercel with the project Root Directory set to `frontend`.
- `vercel.json` schedules `/api/keep-alive` every 10 minutes. The route requests
  `ZEABUR_SERVICE_URL/health` and validates the configured cron secret.
- In Vercel, open **Project Settings → Environment Variables** and add
  `ZEABUR_SERVICE_URL` (the public Zeabur service URL) and `CRON_SECRET`.
  Generate a strong random secret yourself, save it for Production, then
  redeploy.
- Check **Cron Jobs** and **Logs** in the Vercel project for invocation
  history. The route returns 401 if the cron secret is missing/mismatched and
  502 if the Zeabur health request fails.
- Vercel Cron schedule frequency depends on the plan. Confirm that 10 minutes
  is supported in the dashboard; if not, change the schedule to an allowed
  interval or use an external uptime monitor.
- Keep-alive requests are best-effort. They do not guarantee a continuously
  connected WhatsApp session or prevent all plan-based sleep/restarts.
