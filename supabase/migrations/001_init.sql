create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  avatar_color text not null default '#151515',
  age int,
  height_cm numeric,
  weight_kg numeric,
  sex text check (sex in ('female', 'male', 'unspecified')),
  fitness_level text not null default 'medium' check (fitness_level in ('low', 'medium', 'high')),
  health_status text not null default 'skipped',
  watch_status text not null default 'skipped',
  watch_label text,
  health_note text,
  watch_note text,
  motion_status text not null default 'skipped',
  location_status text not null default 'skipped',
  notification_status text not null default 'skipped',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  music_bpm numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, user_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  title text not null,
  venue text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  active_seconds int not null,
  calories numeric not null,
  calorie_method text not null check (calorie_method in ('heart-rate', 'motion')),
  assumed_weight boolean not null default false,
  jumps int not null,
  distance_meters numeric not null,
  intensity numeric not null,
  peak_intensity numeric not null,
  peak_offset_seconds numeric not null default 0,
  avg_heart_rate numeric,
  peak_heart_rate numeric,
  heart_rate_origin text not null check (heart_rate_origin in ('estimated', 'measured', 'none')),
  music_bpm numeric,
  night_kind text check (night_kind in ('rave', 'club', 'festival', 'concert', 'after')),
  note text,
  party_score numeric not null,
  route jsonb not null default '[]'::jsonb,
  intensity_series jsonb not null default '[]'::jsonb,
  shared boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_idx on public.activities (user_id, started_at desc);
create index if not exists activities_event_idx on public.activities (event_id);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;

create policy profiles_read on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy events_read on public.events for select using (true);
create policy events_insert on public.events for insert to authenticated with check (true);

create policy attendees_read on public.event_attendees for select using (true);
create policy attendees_insert on public.event_attendees for insert to authenticated with check (auth.uid() = user_id);
create policy attendees_delete on public.event_attendees for delete to authenticated using (auth.uid() = user_id);

create policy activities_read on public.activities for select using (shared = true or auth.uid() = user_id);
create policy activities_insert on public.activities for insert to authenticated with check (auth.uid() = user_id);
create policy activities_update on public.activities for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activities_delete on public.activities for delete to authenticated using (auth.uid() = user_id);

create policy notifications_read on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy notifications_update on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_public_read on storage.objects
for select using (bucket_id = 'avatars');

create policy avatars_own_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.activities;
exception
  when duplicate_object then null;
end $$;

insert into public.events (id, title, venue, city, starts_at, music_bpm) values
  ('11111111-1111-4111-8111-111111111111', 'Warehouse 34', 'Karaköy', 'İstanbul', now() + interval '2 hours', 138),
  ('22222222-2222-4222-8222-222222222222', 'Sortie Afterhours', 'Muammer Karaca', 'İstanbul', now() + interval '3 days', 132)
on conflict (id) do nothing;
