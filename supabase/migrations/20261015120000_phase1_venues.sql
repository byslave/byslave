-- Phase 1: venues, events, and attendance.
-- Apply in the Supabase SQL editor. Do not put the service role key in the app.
-- The client still reads labeled demo data until a later pass wires these tables.
-- sample_going / sample_checked_in are the labeled demo totals, not live people.

create extension if not exists postgis with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  birth_date date,
  privacy text not null default 'public' check (privacy in ('public', 'friends', 'ghost')),
  created_at timestamptz not null default now()
);

create table public.venues (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  city text not null check (city in ('istanbul', 'ankara', 'izmir')),
  district text not null,
  location extensions.geography(Point, 4326) not null,
  venue_type text not null check (venue_type in ('club', 'open-air', 'warehouse', 'festival')),
  rules text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index venues_location_gix on public.venues using gist (location);
create index venues_city_status_idx on public.venues (city, status);

create table public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null references public.venues (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.events (
  id text primary key,
  venue_id text not null references public.venues (id) on delete cascade,
  title text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  genres text[] not null default '{}',
  price_label text,
  age_limit integer not null default 18 check (age_limit >= 18),
  description_tr text,
  description_en text,
  sample_going integer not null default 0 check (sample_going >= 0),
  sample_checked_in integer not null default 0 check (sample_checked_in >= 0),
  created_at timestamptz not null default now()
);

create index events_venue_date_idx on public.events (venue_id, event_date);

create table public.event_lineup (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  artist_name text not null,
  sort_order integer not null default 0
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id text not null references public.events (id) on delete cascade,
  status text not null check (status in ('interested', 'going', 'checked_in', 'left')),
  ghost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index attendances_event_idx on public.attendances (event_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger attendances_touch
  before update on public.attendances
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Going and checked-in rows add one. Ghost rows still count; they are hidden from other readers by RLS.
create or replace function public.event_pin_count(target text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select sample_going from public.events where id = target), 0)
    + (
      select count(*)::integer
      from public.attendances
      where event_id = target
        and status in ('going', 'checked_in')
    );
$$;

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_photos enable row level security;
alter table public.events enable row level security;
alter table public.event_lineup enable row level security;
alter table public.attendances enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_select_visible on public.profiles
  for select using (privacy <> 'ghost');

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy venues_select on public.venues
  for select using (status = 'approved' or created_by = auth.uid());

create policy venues_insert_pending on public.venues
  for insert with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and status = 'pending'
  );

create policy venue_photos_select on public.venue_photos
  for select using (
    exists (
      select 1 from public.venues
      where venues.id = venue_photos.venue_id
        and (venues.status = 'approved' or venues.created_by = auth.uid())
    )
  );

create policy events_select on public.events
  for select using (
    exists (
      select 1 from public.venues
      where venues.id = events.venue_id
        and venues.status = 'approved'
    )
  );

create policy lineup_select on public.event_lineup
  for select using (
    exists (
      select 1
      from public.events
      join public.venues on venues.id = events.venue_id
      where events.id = event_lineup.event_id
        and venues.status = 'approved'
    )
  );

create policy attendances_select_own on public.attendances
  for select using (user_id = auth.uid());

create policy attendances_select_visible on public.attendances
  for select using (
    ghost = false
    and exists (
      select 1 from public.profiles
      where profiles.id = attendances.user_id
        and profiles.privacy <> 'ghost'
    )
  );

create policy attendances_insert_own on public.attendances
  for insert with check (user_id = auth.uid());

create policy attendances_update_own on public.attendances
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy attendances_delete_own on public.attendances
  for delete using (user_id = auth.uid());

grant select on public.venues, public.events, public.event_lineup, public.venue_photos to anon, authenticated;
grant insert on public.venues to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.attendances to authenticated;
grant execute on function public.event_pin_count(text) to anon, authenticated;

insert into public.venues (id, name, city, district, location, venue_type, status) values
  ('klein', 'Klein Phönix', 'istanbul', 'Maslak', extensions.ST_SetSRID(extensions.ST_MakePoint(29.022423, 41.118384), 4326)::extensions.geography, 'club', 'approved'),
  ('rx', 'RX Istanbul', 'istanbul', 'Karaköy', extensions.ST_SetSRID(extensions.ST_MakePoint(28.9774, 41.0256), 4326)::extensions.geography, 'warehouse', 'approved'),
  ('banger', 'Banger', 'istanbul', 'Kadıköy', extensions.ST_SetSRID(extensions.ST_MakePoint(29.0276, 40.9918), 4326)::extensions.geography, 'club', 'approved'),
  ('silo', 'Silo', 'istanbul', 'Bomonti', extensions.ST_SetSRID(extensions.ST_MakePoint(28.9788, 41.0562), 4326)::extensions.geography, 'warehouse', 'approved'),
  ('bahce', 'Arka Bahçe', 'istanbul', 'Sarıyer', extensions.ST_SetSRID(extensions.ST_MakePoint(29.0502, 41.148), 4326)::extensions.geography, 'open-air', 'approved'),
  ('karanlik', 'Karanlık Oda', 'ankara', 'Tunalı', extensions.ST_SetSRID(extensions.ST_MakePoint(32.8604, 39.9072), 4326)::extensions.geography, 'club', 'approved'),
  ('hangar', 'Hangar 06', 'ankara', 'OSTİM', extensions.ST_SetSRID(extensions.ST_MakePoint(32.7488, 39.9684), 4326)::extensions.geography, 'warehouse', 'approved'),
  ('kordon', 'Kordon Warehouse', 'izmir', 'Alsancak', extensions.ST_SetSRID(extensions.ST_MakePoint(27.1428, 38.4386), 4326)::extensions.geography, 'warehouse', 'approved'),
  ('sahil', 'Sahil', 'izmir', 'Karşıyaka', extensions.ST_SetSRID(extensions.ST_MakePoint(27.118, 38.4558), 4326)::extensions.geography, 'open-air', 'approved');

insert into public.events (
  id, venue_id, title, event_date, start_time, end_time, genres, price_label, age_limit,
  description_tr, description_en, sample_going, sample_checked_in
) values
  ('pulse-01', 'klein', 'Pulse 01', '2026-10-17', '23:00', '06:00', array['techno', 'electro'], '₺450–700', 18,
    'Açılış seti erken başlar. Ana oda tekno, yan oda elektro. Örnek bir gece kaydıdır.',
    'The opening set starts early. Main room techno, side room electro. This is a sample night.', 184, 62),
  ('rx-sat', 'rx', 'RX After Dark', '2026-10-17', '23:30', '05:00', array['house'], '₺350', 18,
    'Depo house gecesi. Örnek liste, doğrulanmış organizatör kaydı değildir.',
    'A warehouse house night. Sample listing, not a verified organizer record.', 96, 28),
  ('banger-sat', 'banger', 'Banger Room', '2026-10-17', '00:00', '06:00', array['techno'], '₺300', 21,
    'Küçük oda, yüksek tempo. 21+ örnek etkinlik.',
    'Small room, high tempo. Sample 21+ event.', 73, 19),
  ('silo-tonight', 'silo', 'Silo Midweek', '2026-10-13', '22:00', '03:00', array['dnb'], '₺250', 18,
    'Salı gecesi drum and bass. Örnek “bu gece” kaydı.',
    'Tuesday drum and bass. Sample “tonight” listing.', 41, 11),
  ('bahce-sun', 'bahce', 'Bahçe Trance', '2026-10-18', '16:00', '23:00', array['trance'], '₺200', 18,
    'Açık hava, gün batımı. Örnek pazar kaydı.',
    'Open air, sunset. Sample Sunday listing.', 28, 0),
  ('ankara-sat', 'karanlik', 'Karanlık', '2026-10-17', '23:00', '05:00', array['techno', 'electro'], '₺280', 18,
    'Ankara örnek kulüp gecesi.',
    'Sample Ankara club night.', 54, 12),
  ('hangar-sat', 'hangar', 'Hangar House', '2026-10-17', '22:30', '04:00', array['house'], '₺220', 18,
    'Ankara depo house. Örnek kayıt.',
    'Ankara warehouse house. Sample listing.', 22, 4),
  ('kordon-sat', 'kordon', 'Kordon 17', '2026-10-17', '23:00', '05:30', array['techno'], '₺260', 18,
    'İzmir depo teknosu. Örnek kayıt.',
    'Izmir warehouse techno. Sample listing.', 37, 9),
  ('sahil-sun', 'sahil', 'Sahil Session', '2026-10-18', '17:00', '23:00', array['house', 'pop'], 'Ücretsiz', 18,
    'Açık hava house. Örnek pazar kaydı.',
    'Open-air house. Sample Sunday listing.', 19, 0);

insert into public.event_lineup (event_id, artist_name, sort_order) values
  ('pulse-01', 'Vera Kael', 0),
  ('pulse-01', 'Nils Orth', 1),
  ('pulse-01', 'Mira Sol', 2),
  ('rx-sat', 'Ada Wren', 0),
  ('rx-sat', 'Leo Park', 1),
  ('banger-sat', 'Kian Voss', 0),
  ('silo-tonight', 'Noa Peck', 0),
  ('bahce-sun', 'Elif Shore', 0),
  ('ankara-sat', 'Deniz Mor', 0),
  ('hangar-sat', 'Pelin Ray', 0),
  ('kordon-sat', 'Arda Nil', 0),
  ('sahil-sun', 'Maya Kent', 0);
