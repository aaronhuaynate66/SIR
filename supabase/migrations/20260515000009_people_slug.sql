alter table public.people
  add column if not exists slug text;

-- Generate slug for existing rows
update public.people
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

-- Unique per user (nulls are excluded from uniqueness checks)
create unique index if not exists people_user_slug_unique
  on public.people (user_id, slug)
  where slug is not null;

create index if not exists people_slug_idx
  on public.people (slug)
  where slug is not null;
