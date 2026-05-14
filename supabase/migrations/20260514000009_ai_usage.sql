create table if not exists public.ai_usage (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  model       text        not null,
  tokens_in   integer     not null default 0,
  tokens_out  integer     not null default 0,
  cost_usd    numeric(10,6) not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists ai_usage_user_created
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "users read own usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);
