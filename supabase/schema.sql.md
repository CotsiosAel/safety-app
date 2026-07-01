-- SafeMe account foundation for Supabase Auth + Postgres.
-- Run in the Supabase SQL editor for a new project, then enable Email auth.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  medical_note text not null default '',
  medical_notes text not null default '',
  preferred_language text not null default 'el',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null default '',
  phone text not null default '',
  email text not null default '',
  tone text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.active_sos_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sos_event_id uuid references public.sos_events(id) on delete set null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  latest_latitude double precision,
  latest_longitude double precision,
  latest_location_at timestamptz,
  share_token text unique,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.sos_events enable row level security;
alter table public.active_sos_sessions enable row level security;

create policy "profiles owner access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "trusted contacts owner access" on public.trusted_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sos events owner access" on public.sos_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "active sos owner access" on public.active_sos_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_sos_session_by_token(token text)
returns table(status text, started_at timestamptz, ended_at timestamptz, latest_latitude double precision, latest_longitude double precision, latest_location_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.status, s.started_at, s.ended_at, s.latest_latitude, s.latest_longitude, s.latest_location_at
  from public.active_sos_sessions s
  where s.share_token = token
  limit 1;
$$;
