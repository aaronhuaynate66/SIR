alter table public.users
  add column if not exists subscription_status   text        not null default 'free',
  add column if not exists stripe_customer_id    text,
  add column if not exists revenuecat_user_id    text,
  add column if not exists subscription_expires_at timestamptz;

create index if not exists users_stripe_customer
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;
