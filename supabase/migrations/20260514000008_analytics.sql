-- Analytics events table
create table if not exists public.analytics_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  event_name  text        not null,
  properties  jsonb       not null default '{}',
  session_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists analytics_events_user_created
  on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_name_created
  on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;

create policy "users read own analytics"
  on public.analytics_events for select
  using (auth.uid() = user_id);
