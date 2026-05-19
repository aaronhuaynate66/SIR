import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { actionId?: string; status?: string };
    const { actionId, status } = body;

    if (!actionId || (status !== 'postponed' && status !== 'dismissed')) {
      return Response.json({ error: 'actionId and status (postponed|dismissed) required' }, { status: 400 });
    }

    const db = getServiceClient();
    await db
      .from('action_suggestions')
      .update({ status })
      .eq('id', actionId)
      .eq('user_id', user.id);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[actions/update-status]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
