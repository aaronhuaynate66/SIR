import { getSupabaseClient } from '../supabase';
import type { DbMemory, DbSearchResult, InsertMemory, MemoryLayer } from '../schema';

export async function createMemory(data: InsertMemory): Promise<DbMemory> {
  const { data: memory, error } = await getSupabaseClient()
    .from('memories')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createMemory: ${error.message}`);
  return memory as DbMemory;
}

export async function getMemoriesByLayer(
  userId: string,
  layer: MemoryLayer,
  limit = 50
): Promise<DbMemory[]> {
  const { data, error } = await getSupabaseClient()
    .from('memories')
    .select()
    .eq('user_id', userId)
    .eq('layer', layer)
    .is('expires_at', null)
    .order('importance', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getMemoriesByLayer: ${error.message}`);
  return (data ?? []) as DbMemory[];
}

export async function searchMemories(
  userId: string,
  queryEmbedding: number[],
  options: {
    layer?: MemoryLayer;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<DbSearchResult[]> {
  const { data, error } = await getSupabaseClient().rpc('search_memories', {
    p_user_id: userId,
    p_layer: options.layer ?? null,
    p_query: queryEmbedding,
    p_limit: options.limit ?? 10,
    p_threshold: options.threshold ?? 0.7,
  });

  if (error) throw new Error(`searchMemories: ${error.message}`);
  return (data ?? []) as DbSearchResult[];
}

export async function updateMemoryEmbedding(
  id: string,
  embedding: number[]
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('memories')
    .update({ embedding, accessed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`updateMemoryEmbedding: ${error.message}`);
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`deleteMemory: ${error.message}`);
}

export async function purgeExpiredMemories(): Promise<number> {
  const { data, error } = await getSupabaseClient().rpc('purge_expired_memories');
  if (error) throw new Error(`purgeExpiredMemories: ${error.message}`);
  return data as number;
}
