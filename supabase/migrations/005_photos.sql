alter table public.activities add column if not exists photo_urls text[] not null default '{}';
