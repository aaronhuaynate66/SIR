create type public.signal_type as enum (
  'interaction',   -- mensaje / conversación
  'emotion',       -- estado emocional detectado
  'location',      -- cambio de contexto físico/digital
  'relationship',  -- evento con otra persona
  'task',          -- tarea completada o iniciada
  'insight',       -- conclusión o aprendizaje
  'external'       -- input de sistema externo
);

create table public.signals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        public.signal_type not null,
  payload     jsonb not null default '{}',
  processed   boolean not null default false,
  memory_id   uuid references public.memories(id) on delete set null, -- memoria generada de este signal
  created_at  timestamptz not null default now()
);

-- Índices
create index signals_user_id_idx   on public.signals(user_id);
create index signals_type_idx      on public.signals(type);
create index signals_processed_idx on public.signals(processed) where processed = false;
create index signals_created_idx   on public.signals(created_at desc);

-- RLS
alter table public.signals enable row level security;

create policy "signals_all_own"
  on public.signals for all
  using (auth.uid() = user_id);

-- Vista de señales pendientes de procesar
create view public.pending_signals as
  select * from public.signals
  where processed = false
  order by created_at asc;
