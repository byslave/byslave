-- Privacy default, blocks, consent, and a server-side jump cap.
-- Existing rows keep the privacy value they already stored.
-- Birth date stays off this table on purpose: the app keeps it on the device.

alter table public.profiles alter column privacy set default 'friends';
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists privacy_saved_at timestamptz;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.consents (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('location', 'motion', 'photos')),
  granted boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target text not null check (target in ('event', 'post', 'person')),
  target_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function public.jumps_rankable(jumps integer, minutes integer)
returns boolean
language sql
immutable
as $$
  select jumps is not null
    and minutes is not null
    and jumps >= 0
    and minutes > 0
    and jumps <= 8000
    and (jumps::numeric / minutes) * 15 <= 400;
$$;

create table if not exists public.night_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  minutes integer not null check (minutes > 0),
  jumps integer not null check (jumps >= 0),
  rankable boolean generated always as (public.jumps_rankable(jumps, minutes)) stored,
  created_at timestamptz not null default now()
);

comment on table public.venue_photos is
  'No location columns. Clients must redraw the image before upload so EXIF and GPS never arrive. There is no binary upload worker in this migration.';

alter table public.blocks enable row level security;
alter table public.consents enable row level security;
alter table public.content_reports enable row level security;
alter table public.night_sessions enable row level security;

create policy blocks_own on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy consents_own on public.consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_own on public.content_reports
  for all using (reporter_id = auth.uid()) with check (reporter_id = auth.uid());
create policy nights_own on public.night_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.blocks, public.consents, public.content_reports, public.night_sessions to authenticated;
