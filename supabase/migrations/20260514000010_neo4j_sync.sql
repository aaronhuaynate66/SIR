alter table public.relationships
  add column if not exists neo4j_sync_status text not null default 'pending';

create index if not exists relationships_neo4j_pending
  on public.relationships (neo4j_sync_status)
  where neo4j_sync_status = 'pending';
