-- The public map only returns a verified night. Pending and unverified rows stay in the table for review.

create or replace view public.active_events
with (security_invoker = true) as
select events.*
from public.events
where events.status = 'scheduled'
  and events.held = false
  and events.verification_status = 'verified'
  and (
    events.end_at > now()
    or exists (
      select 1 from public.event_sessions
      where event_sessions.event_id = events.id
        and event_sessions.end_at > now()
    )
  );

drop policy if exists events_select_public on public.events;
create policy events_select_public on public.events
  for select using (
    status = 'scheduled'
    and held = false
    and verification_status = 'verified'
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

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and status = 'scheduled'
    and (
      verification_status = 'pending'
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

drop policy if exists lineup_select on public.event_lineup;
create policy lineup_select on public.event_lineup
  for select using (
    exists (
      select 1 from public.events
      where events.id = event_lineup.event_id
        and (
          (
            events.status = 'scheduled'
            and events.held = false
            and events.verification_status = 'verified'
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
            and events.verification_status = 'verified'
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
