# MadzzoChatApp

This repository contains the full stack for a personal WA browser app:

- Frontend: Next.js 15 app on Vercel
- Backend: Node.js + Express + Baileys on Render
- Database: Supabase

## Directory structure

- `backend/` — Baileys service and Docker deployment assets
- `frontend/` — Next.js app for the custom web UI
- `supabase/` — database schema
- `DEPLOYMENT.md` — deployment instructions

## Important notes

- Use Supabase to store the WA session, not local disk.
- Render should run the backend from the `backend/` directory and listen on
  `process.env.PORT`.
- Auto RVO and automated message forwarding have security and WhatsApp policy implications.
