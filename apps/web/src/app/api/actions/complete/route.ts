import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { actionId?: string; personId?: string };
    const { actionId, personId } = body;

    if (!actionId || !personId) {
      return Response.json({ error: 'actionId and personId required' }, { status: 400 });
    }

    const db  = getServiceClient();
    const now = new Date().toISOString();

    await Promise.all([
      // Mark suggestion completed
      db.from('action_suggestions')
        .update({ status: 'completed', completed_at: now })
        .eq('id', actionId)
        .eq('user_id', user.id),

      // Update last_contact_at on the relationship
      db.from('relationships')
        .update({ last_contact_at: now })
        .eq('user_id', user.id)
        .eq('person_id', personId),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[actions/complete]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
