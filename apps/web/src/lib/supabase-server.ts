import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service role client — bypass RLS, para API routes
let _serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _serviceClient = createSupabaseClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

// Cookie-based client para Server Components (respeta RLS con la sesión del usuario)
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — no se puede escribir cookies aquí, el middleware lo hace
          }
        },
      },
    }
  );
}

export async function getAuthUser() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
