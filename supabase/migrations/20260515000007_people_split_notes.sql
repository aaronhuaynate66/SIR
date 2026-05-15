alter table public.people
  add column if not exists notes_professional text,
  add column if not exists notes_social       text,
  add column if not exists notes_personal     text;
