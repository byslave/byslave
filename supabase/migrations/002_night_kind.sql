alter table public.activities
  add column if not exists night_kind text;

alter table public.activities
  drop constraint if exists activities_night_kind_check;

alter table public.activities
  add constraint activities_night_kind_check
  check (night_kind is null or night_kind in ('rave', 'club', 'festival', 'concert', 'after'));
