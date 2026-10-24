# MadzzoChatApp Frontend

This is the Vercel-hosted Next.js app for the private WhatsApp browser dashboard.

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RENDER_SERVICE_URL=https://your-render-service.onrender.com
CRON_SECRET=your-generated-secret
```

## Run locally

```bash
npm install
npm run dev
```

## Production notes

- Deploy to Vercel.
- Set the root directory to the `frontend` folder if using a monorepo structure.
- `vercel.json` schedules `/api/keep-alive` every 10 minutes. The route pings `RENDER_SERVICE_URL/health` and only accepts requests with the configured cron secret.
- In Vercel, open **Project Settings → Environment Variables** and add `RENDER_SERVICE_URL` (the public Render service URL) and `CRON_SECRET`. Vercel does not create `CRON_SECRET` for you; generate a strong random value, for example with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, then save it in Vercel. Apply the variables to Production and redeploy.
- Check **Logs** or **Cron Jobs** in the Vercel project to verify invocation history. A successful request returns `{ "ok": true, "status": 200 }`; 401 means the secret is missing or mismatched, and 502 means the Render health endpoint failed.
- Vercel Cron schedule frequency and availability depend on your plan. Vercel Hobby may not support every 10 minutes; check the current limit in the dashboard. Render free services may still sleep or restart despite pings, so treat cron and external monitoring as best-effort rather than an uptime guarantee.
