# MadzzoChatApp

This repository contains the full stack for a personal WA browser app:

- Frontend: Next.js 15 app on Vercel
- Backend: Node.js + Express + Baileys in a Docker container on Suga
- Database: Supabase

## Directory structure

- `backend/` — Baileys service and Docker deployment assets
- `frontend/` — Next.js app for the custom web UI
- `supabase/` — database schema
- `DEPLOYMENT.md` — deployment instructions

## Important notes

- Use Supabase to store the WA session, not local disk.
- Suga should build the backend from the `backend/` directory and listen on
  `process.env.PORT`.
- View-once media is not forwarded or copied by the service.
