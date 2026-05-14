-- Social signal type enum
create type public.social_signal_type as enum (
  'promotion',
  'job_change',
  'travel',
  'birthday',
  'publication',
  'life_event',
  'health_event',
  'achievement',
  'loss'
);

-- Extend signals table with social intelligence fields
alter table public.signals
  add column if not exists signal_type           public.social_signal_type null,
  add column if not exists opportunity_score     smallint null
    constraint chk_opportunity_score check (opportunity_score between 0 and 100),
  add column if not exists action_recommendation text null,
  add column if not exists person_id             uuid null
    references public.people(id) on delete set null,
  add column if not exists processed_at          timestamptz null,
  add column if not exists source                text not null default 'manual'
    constraint chk_source check (source in ('manual', 'screenshot', 'voice'));

create index signals_signal_type_idx  on public.signals(signal_type)
  where signal_type is not null;
create index signals_person_id_idx    on public.signals(person_id)
  where person_id is not null;
create index signals_opportunity_idx  on public.signals(user_id, opportunity_score desc)
  where opportunity_score is not null;
