-- Add feature label and latency tracking to ai_usage
alter table public.ai_usage
  add column if not exists feature     text,
  add column if not exists latency_ms  integer;

-- Index for feature-level cost aggregations in the admin panel
create index if not exists ai_usage_feature_idx
  on public.ai_usage (feature, created_at desc)
  where feature is not null;

-- Index for time-range cost queries
create index if not exists ai_usage_created_idx
  on public.ai_usage (user_id, created_at desc);
