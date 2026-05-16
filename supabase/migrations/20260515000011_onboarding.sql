-- Track onboarding state per user
alter table public.users
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step      integer not null default 0;
