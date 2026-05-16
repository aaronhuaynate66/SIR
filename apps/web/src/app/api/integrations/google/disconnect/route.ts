import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';
import { type GoogleIntegration } from '../_lib';

export const dynamic = 'force-dynamic';

export async function DELETE(): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data: intRow } = await db
    .from('google_integrations')
    .select('access_token, refresh_token')
    .eq('user_id', user.id)
    .single();

  if (!intRow) return Response.json({ ok: true }); // already disconnected

  const integration = intRow as Pick<GoogleIntegration, 'access_token' | 'refresh_token'>;
  const tokenToRevoke = integration.refresh_token ?? integration.access_token;

  // Revoke at Google (fire-and-forget — don't fail if Google rejects)
  if (tokenToRevoke) {
    fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`,
      { method: 'POST' }
    ).catch(() => undefined);
  }

  await db.from('google_integrations').delete().eq('user_id', user.id);

  return Response.json({ ok: true });
}
