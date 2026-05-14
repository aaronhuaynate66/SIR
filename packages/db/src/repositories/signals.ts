import { getSupabaseClient } from '../supabase';
import type { DbSignal, InsertSignal, SignalType } from '../schema';

export async function createSignal(data: InsertSignal): Promise<DbSignal> {
  const { data: signal, error } = await getSupabaseClient()
    .from('signals')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createSignal: ${error.message}`);
  return signal as DbSignal;
}

export async function getPendingSignals(
  userId: string,
  limit = 100
): Promise<DbSignal[]> {
  const { data, error } = await getSupabaseClient()
    .from('signals')
    .select()
    .eq('user_id', userId)
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`getPendingSignals: ${error.message}`);
  return (data ?? []) as DbSignal[];
}

export async function markSignalProcessed(
  id: string,
  memoryId?: string
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('signals')
    .update({ processed: true, memory_id: memoryId ?? null })
    .eq('id', id);

  if (error) throw new Error(`markSignalProcessed: ${error.message}`);
}

export async function getSignalsByType(
  userId: string,
  type: SignalType,
  limit = 50
): Promise<DbSignal[]> {
  const { data, error } = await getSupabaseClient()
    .from('signals')
    .select()
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getSignalsByType: ${error.message}`);
  return (data ?? []) as DbSignal[];
}
