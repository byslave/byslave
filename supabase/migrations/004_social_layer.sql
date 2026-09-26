alter table public.events add column if not exists lineup text;
alter table public.activities add column if not exists location_shared boolean not null default false;

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 60),
  created_at timestamptz not null default now()
);

alter table public.activity_comments enable row level security;

drop policy if exists comments_read on public.activity_comments;
drop policy if exists comments_insert on public.activity_comments;
drop policy if exists comments_delete on public.activity_comments;
create policy comments_read on public.activity_comments for select using (true);
create policy comments_insert on public.activity_comments for insert to authenticated with check (auth.uid() = user_id);
create policy comments_delete on public.activity_comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (auth.uid() is not null);

do $$
begin
  alter publication supabase_realtime add table public.activity_comments;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.activity_respects;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- Rozetler ve kişisel rekorlar aktivitelerden türetilir. Ayrı bir yazma tablosu demo ile supabase'i ayırırdı.
