create extension if not exists "pgcrypto";

create table if not exists public.wa_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  creds jsonb not null default '{}'::jsonb,
  "keys" jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_settings (
  id smallint primary key default 1 check (id = 1),
  auto_rvo boolean not null default false,
  auto_reply boolean not null default false,
  auto_reply_message text not null default 'Halo! Saya sedang menggunakan MadzzoChatApp.'
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_jid text not null,
  to_jid text,
  body text,
  media_type text,
  timestamp timestamptz not null default now(),
  is_view_once boolean not null default false
);

alter table public.wa_sessions enable row level security;
alter table public.wa_settings enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Allow authenticated access to wa_sessions" on public.wa_sessions;
drop policy if exists "Allow authenticated access to wa_settings" on public.wa_settings;
drop policy if exists "Allow authenticated access to messages" on public.messages;
drop policy if exists "Backend service role access to wa_sessions" on public.wa_sessions;
drop policy if exists "Backend service role access to wa_settings" on public.wa_settings;
drop policy if exists "Backend service role access to messages" on public.messages;

create policy "Backend service role access to wa_sessions"
  on public.wa_sessions for all to service_role
  using (true) with check (true);

create policy "Backend service role access to wa_settings"
  on public.wa_settings for all to service_role
  using (true) with check (true);

create policy "Backend service role access to messages"
  on public.messages for all to service_role
  using (true) with check (true);

create index if not exists wa_sessions_session_id_idx on public.wa_sessions (session_id);
create index if not exists messages_timestamp_idx on public.messages (timestamp desc);

insert into public.wa_settings default values
on conflict (id) do nothing;

update public.wa_settings
set auto_rvo = false;
