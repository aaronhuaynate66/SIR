create type public.memory_layer as enum (
  'sensory',
  'working',
  'episodic',
  'semantic',
  'procedural',
  'emotional',
  'social',
  'prophetic'
);

create table public.memories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  layer       public.memory_layer not null,
  content     text not null,
  embedding   vector(768),          -- nomic-embed-text produce 768 dims
  metadata    jsonb not null default '{}',
  importance  real not null default 0.5 check (importance >= 0 and importance <= 1),
  accessed_at timestamptz not null default now(),
  expires_at  timestamptz,          -- null = permanente; usado en sensory/working
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger memories_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- Índices
create index memories_user_id_idx on public.memories(user_id);
create index memories_layer_idx    on public.memories(layer);
create index memories_expires_idx  on public.memories(expires_at) where expires_at is not null;

-- Índice HNSW para búsqueda vectorial (mejor rendimiento que IVFFlat en <1M rows)
create index memories_embedding_idx
  on public.memories
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RLS
alter table public.memories enable row level security;

create policy "memories_all_own"
  on public.memories for all
  using (auth.uid() = user_id);

-- Función para búsqueda semántica
create or replace function public.search_memories(
  p_user_id   uuid,
  p_query     vector(768),
  p_layer     public.memory_layer default null,
  p_limit     int default 10,
  p_threshold real default 0.7
)
returns table (
  id         uuid,
  layer      public.memory_layer,
  content    text,
  metadata   jsonb,
  importance real,
  similarity real,
  created_at timestamptz
)
language sql stable as $$
  select
    m.id,
    m.layer,
    m.content,
    m.metadata,
    m.importance,
    1 - (m.embedding <=> p_query) as similarity,
    m.created_at
  from public.memories m
  where
    m.user_id = p_user_id
    and (p_layer is null or m.layer = p_layer)
    and (m.expires_at is null or m.expires_at > now())
    and m.embedding is not null
    and 1 - (m.embedding <=> p_query) >= p_threshold
  order by m.embedding <=> p_query
  limit p_limit;
$$;

-- Limpieza de memorias expiradas (ejecutar con pg_cron o desde la app)
create or replace function public.purge_expired_memories()
returns int language plpgsql as $$
declare
  deleted int;
begin
  delete from public.memories
  where expires_at is not null and expires_at <= now();
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;
