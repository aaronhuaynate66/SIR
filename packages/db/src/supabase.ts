import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from './types';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient {
  if (_client) return _client;

  const url = config?.url ?? process.env['SUPABASE_URL'];
  // Prefer service role key so server-side writes bypass RLS correctly.
  // Falls back to anon key for environments that don't have service role configured.
  const key =
    config?.anonKey ??
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    process.env['SUPABASE_ANON_KEY'];

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY');
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
