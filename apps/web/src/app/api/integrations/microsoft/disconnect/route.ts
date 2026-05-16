import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await getServiceClient()
    .from('microsoft_integrations')
    .delete()
    .eq('user_id', user.id);

  return Response.json({ ok: true });
}
