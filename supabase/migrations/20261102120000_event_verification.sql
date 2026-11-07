-- Event verification, sessions, and automatic expiry.
-- Ticket sites are not scraped. source + external_id are reserved for a contracted feed.
-- Times are timestamptz (UTC). The app shows them in Europe/Istanbul.

alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'admin'));
alter table public.profiles add column if not exists organizer_verified boolean not null default false;

alter table public.events add column if not exists source text not null default 'community';
alter table public.events add column if not exists source_name text;
alter table public.events add column if not exists external_id text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists verification_status text not null default 'unverified';
alter table public.events add column if not exists verified_at timestamptz;
alter table public.events add column if not exists verified_by uuid references public.profiles (id);
alter table public.events add column if not exists verification_note text;
alter table public.events add column if not exists start_at timestamptz;
alter table public.events add column if not exists end_at timestamptz;
alter table public.events add column if not exists time_unconfirmed boolean not null default false;
alter table public.events add column if not exists status text not null default 'scheduled';
alter table public.events add column if not exists image_path text;
alter table public.events add column if not exists created_by uuid references public.profiles (id);
alter table public.events add column if not exists held boolean not null default false;

alter table public.events drop constraint if exists events_source_check;
alter table public.events add constraint events_source_check check (source in ('official_feed', 'organizer', 'community'));
alter table public.events drop constraint if exists events_verification_check;
alter table public.events add constraint events_verification_check check (verification_status in ('verified', 'pending', 'unverified', 'rejected'));
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('scheduled', 'cancelled', 'postponed', 'expired'));
alter table public.events drop constraint if exists events_window_check;
alter table public.events add constraint events_window_check check (end_at is null or start_at is null or end_at > start_at);

-- Overnight rows (end clock on or before the start clock) finish the next Istanbul morning.
update public.events
set start_at = (event_date + start_time) at time zone 'Europe/Istanbul',
    end_at = case
      when end_time <= start_time then ((event_date + interval '1 day') + end_time) at time zone 'Europe/Istanbul'
      else (event_date + end_time) at time zone 'Europe/Istanbul'
    end
where start_at is null or end_at is null;

alter table public.events alter column start_at set not null;
alter table public.events alter column end_at set not null;

create unique index if not exists events_source_external_uidx
  on public.events (source, external_id)
  where external_id is not null;

create unique index if not exists events_venue_start_uidx
  on public.events (venue_id, start_at)
  where status = 'scheduled';

create index if not exists events_listing_idx on public.events (status, end_at);

create table if not exists public.event_sessions (
  id text primary key default gen_random_uuid()::text,
  event_id text not null references public.events (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  check (end_at > start_at),
  check (end_at <= start_at + interval '24 hours')
);

create index if not exists event_sessions_event_idx on public.event_sessions (event_id, end_at);

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  business_name text not null,
  venue_name text not null,
  contact_email text not null,
  link text,
  tax_id text,
  document_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create table if not exists public.venue_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  venue_id text not null references public.venues (id) on delete cascade,
  contact text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create table if not exists public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  target_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id text,
  kind text not null check (kind in ('cancelled', 'postponed')),
  title text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists content_reports_once
  on public.content_reports (reporter_id, target, target_id);

create or replace function public.hold_event_after_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distinct_reporters integer;
begin
  if new.target <> 'event' then
    return new;
  end if;
  select count(distinct reporter_id) into distinct_reporters
  from public.content_reports
  where target = 'event' and target_id = new.target_id;
  if distinct_reporters >= 3 then
    update public.events
    set held = true,
        verification_status = case
          when verification_status = 'rejected' then verification_status
          else 'pending'
        end
    where id = new.target_id;
  end if;
  return new;
end;
$$;

drop trigger if exists content_reports_hold on public.content_reports;
create trigger content_reports_hold
  after insert on public.content_reports
  for each row execute function public.hold_event_after_reports();

-- Past nights stay in the table for archive and ranks. They leave public reads.
create or replace view public.active_events
with (security_invoker = true) as
select events.*
from public.events
where events.status = 'scheduled'
  and events.held = false
  and events.verification_status in ('verified', 'unverified')
  and (
    events.end_at > now()
    or exists (
      select 1 from public.event_sessions
      where event_sessions.event_id = events.id
        and event_sessions.end_at > now()
    )
  );

create or replace function public.expire_past_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.events as target
  set status = 'expired'
  where target.status = 'scheduled'
    and target.end_at < now()
    and not exists (
      select 1 from public.event_sessions
      where event_sessions.event_id = target.id
        and event_sessions.end_at >= now()
    );
  get diagnostics expired_count = row_count;

  -- KVKK: after 12 months an expired night is anonymised, not dropped from attendance history.
  update public.events
  set title = 'Arşiv gece',
      description_tr = null,
      description_en = null,
      ticket_url = null,
      image_path = null,
      verification_note = null
  where status = 'expired'
    and end_at < now() - interval '12 months'
    and title is distinct from 'Arşiv gece';

  return expired_count;
end;
$$;

-- Schedule only when pg_cron is already installed. Do not create the extension here.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('pulse-expire-events');
    exception when others then
      null;
    end;
    perform cron.schedule('pulse-expire-events', '*/15 * * * *', 'select public.expire_past_events()');
  end if;
end;
$$;

alter table public.event_sessions enable row level security;
alter table public.organizer_applications enable row level security;
alter table public.venue_claims enable row level security;
alter table public.moderation_log enable row level security;
alter table public.user_notices enable row level security;

drop policy if exists events_select on public.events;
drop policy if exists events_select_public on public.events;
drop policy if exists events_select_own on public.events;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_update_own on public.events;
drop policy if exists events_update_admin on public.events;
drop policy if exists lineup_select on public.event_lineup;

create policy events_select_public on public.events
  for select using (
    status = 'scheduled'
    and held = false
    and verification_status in ('verified', 'unverified')
    and (
      end_at > now()
      or exists (
        select 1 from public.event_sessions
        where event_sessions.event_id = events.id
          and event_sessions.end_at > now()
      )
    )
    and exists (
      select 1 from public.venues
      where venues.id = events.venue_id
        and venues.status = 'approved'
    )
  );

create policy events_select_own on public.events
  for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.attendances
      where attendances.event_id = events.id
        and attendances.user_id = auth.uid()
    )
  );

create policy events_insert_own on public.events
  for insert with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and status = 'scheduled'
    and (
      verification_status = 'unverified'
      or (
        verification_status = 'verified'
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.organizer_verified
        )
      )
    )
  );

create policy events_update_own on public.events
  for update using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and (
      verification_status <> 'verified'
      or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.organizer_verified
      )
    )
  );

create policy events_update_admin on public.events
  for update using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy lineup_select on public.event_lineup
  for select using (
    exists (
      select 1 from public.events
      where events.id = event_lineup.event_id
        and (
          (
            events.status = 'scheduled'
            and events.held = false
            and events.verification_status in ('verified', 'unverified')
            and events.end_at > now()
          )
          or events.created_by = auth.uid()
          or exists (
            select 1 from public.attendances
            where attendances.event_id = events.id
              and attendances.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists sessions_select on public.event_sessions;
create policy sessions_select on public.event_sessions
  for select using (
    exists (
      select 1 from public.events
      where events.id = event_sessions.event_id
        and (
          (
            events.status = 'scheduled'
            and events.held = false
            and events.verification_status in ('verified', 'unverified')
            and event_sessions.end_at > now()
          )
          or events.created_by = auth.uid()
          or exists (
            select 1 from public.attendances
            where attendances.event_id = events.id
              and attendances.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists sessions_write_own on public.event_sessions;
create policy sessions_write_own on public.event_sessions
  for all using (
    exists (select 1 from public.events where events.id = event_sessions.event_id and events.created_by = auth.uid())
  )
  with check (
    exists (select 1 from public.events where events.id = event_sessions.event_id and events.created_by = auth.uid())
  );

drop policy if exists organizer_apps_own on public.organizer_applications;
create policy organizer_apps_own on public.organizer_applications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists organizer_apps_admin on public.organizer_applications;
create policy organizer_apps_admin on public.organizer_applications
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists venue_claims_own on public.venue_claims;
create policy venue_claims_own on public.venue_claims
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists venue_claims_admin on public.venue_claims;
create policy venue_claims_admin on public.venue_claims
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists moderation_admin on public.moderation_log;
create policy moderation_admin on public.moderation_log
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists notices_select_own on public.user_notices;
create policy notices_select_own on public.user_notices
  for select using (user_id = auth.uid());

drop policy if exists notices_insert_host on public.user_notices;
create policy notices_insert_host on public.user_notices
  for insert with check (
    exists (
      select 1
      from public.events
      join public.attendances on attendances.event_id = events.id and attendances.user_id = user_notices.user_id
      where events.id = user_notices.event_id
        and events.created_by = auth.uid()
        and (
          (user_notices.kind = 'cancelled' and attendances.status = 'going')
          or (user_notices.kind = 'postponed' and attendances.status in ('going', 'interested'))
        )
    )
  );

grant select on public.active_events to anon, authenticated;
grant select, insert, update, delete on public.event_sessions to authenticated;
grant select, insert, update on public.organizer_applications, public.venue_claims to authenticated;
grant select, insert on public.moderation_log, public.user_notices to authenticated;
grant select, insert, update on public.events to authenticated;
revoke all on function public.expire_past_events() from public, anon, authenticated;
