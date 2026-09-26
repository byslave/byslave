alter table public.activities add column if not exists note text;

create table if not exists public.activity_respects (
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.activity_respects enable row level security;
alter table public.follows enable row level security;

create policy respects_read on public.activity_respects for select using (true);
create policy respects_insert on public.activity_respects for insert to authenticated with check (auth.uid() = user_id);
create policy respects_delete on public.activity_respects for delete to authenticated using (auth.uid() = user_id);

create policy follows_read on public.follows for select using (true);
create policy follows_insert on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy follows_delete on public.follows for delete to authenticated using (auth.uid() = follower_id);
