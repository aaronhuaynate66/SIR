import { getSupabaseClient } from '../supabase';
import type { DbUser, InsertUser } from '../schema';

export async function createUser(data: InsertUser): Promise<DbUser> {
  const { data: user, error } = await getSupabaseClient()
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createUser: ${error.message}`);
  return user as DbUser;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const { data, error } = await getSupabaseClient()
    .from('users')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`getUserById: ${error.message}`);
  return data as DbUser | null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { data, error } = await getSupabaseClient()
    .from('users')
    .select()
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(`getUserByEmail: ${error.message}`);
  return data as DbUser | null;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<DbUser, 'name' | 'avatar_url' | 'preferences'>>
): Promise<DbUser> {
  const { data: user, error } = await getSupabaseClient()
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateUser: ${error.message}`);
  return user as DbUser;
}
