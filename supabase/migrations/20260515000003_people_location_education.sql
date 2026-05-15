alter table public.people
  add column if not exists location  text,
  add column if not exists education text;
