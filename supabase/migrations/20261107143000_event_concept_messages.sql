-- Richer event review data and consent-first messaging between attendees.

alter table public.events add column if not exists concept text;
update public.events
set concept = coalesce(nullif(array_to_string(genres, ' · '), ''), title)
where concept is null or btrim(concept) = '';
alter table public.events alter column concept set not null;

-- New community submissions need enough evidence for moderation. Existing archive rows remain readable.
drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and status = 'scheduled'
    and btrim(title) <> ''
    and btrim(concept) <> ''
    and ticket_url ~ '^https://'
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

create table public.message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  event_id text not null references public.events (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);

create unique index message_requests_open_pair_uidx
  on public.message_requests (
    event_id,
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id)
  )
  where status in ('pending', 'accepted');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.message_requests (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index messages_request_created_idx on public.messages (request_id, created_at);

create or replace function public.can_request_event_message(target_user uuid, target_event text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and auth.uid() <> target_user
    and exists (
      select 1
      from public.events
      where events.id = target_event
        and events.status = 'scheduled'
        and events.verification_status = 'verified'
        and events.held = false
        and events.end_at > now()
    )
    and exists (
      select 1 from public.attendances
      where attendances.event_id = target_event
        and attendances.user_id = auth.uid()
        and attendances.status in ('going', 'checked_in')
    )
    and exists (
      select 1
      from public.attendances
      join public.profiles on profiles.id = attendances.user_id
      where attendances.event_id = target_event
        and attendances.user_id = target_user
        and attendances.status in ('going', 'checked_in')
        and attendances.ghost = false
        and profiles.privacy <> 'ghost'
    )
    and not exists (
      select 1 from public.blocks
      where (blocks.blocker_id = auth.uid() and blocks.blocked_id = target_user)
         or (blocks.blocker_id = target_user and blocks.blocked_id = auth.uid())
    );
$$;

revoke all on function public.can_request_event_message(uuid, text) from public;
grant execute on function public.can_request_event_message(uuid, text) to authenticated;

create or replace function public.can_send_event_message(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.message_requests
    where message_requests.id = target_request
      and message_requests.status = 'accepted'
      and (message_requests.sender_id = auth.uid() or message_requests.recipient_id = auth.uid())
      and not exists (
        select 1 from public.blocks
        where (blocks.blocker_id = message_requests.sender_id and blocks.blocked_id = message_requests.recipient_id)
           or (blocks.blocker_id = message_requests.recipient_id and blocks.blocked_id = message_requests.sender_id)
      )
  );
$$;

revoke all on function public.can_send_event_message(uuid) from public;
grant execute on function public.can_send_event_message(uuid) to authenticated;

alter table public.message_requests enable row level security;
alter table public.messages enable row level security;

create policy message_requests_select_participant on public.message_requests
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy message_requests_insert_sender on public.message_requests
  for insert with check (
    sender_id = auth.uid()
    and status = 'pending'
    and public.can_request_event_message(recipient_id, event_id)
  );

create policy message_requests_update_recipient on public.message_requests
  for update using (
    recipient_id = auth.uid()
    and status = 'pending'
  ) with check (
    recipient_id = auth.uid()
    and status in ('accepted', 'declined')
  );

create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.message_requests
      where message_requests.id = messages.request_id
        and message_requests.status = 'accepted'
        and (message_requests.sender_id = auth.uid() or message_requests.recipient_id = auth.uid())
    )
  );

create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.can_send_event_message(request_id)
  );

grant select, insert on public.message_requests to authenticated;
grant update (status, responded_at) on public.message_requests to authenticated;
grant select, insert on public.messages to authenticated;
