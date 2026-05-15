alter table public.people
  add column if not exists emotional_state       text,
  add column if not exists love_language         text,
  add column if not exists relationship_patterns text;
