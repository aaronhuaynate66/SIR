import { getAuthUser } from '@/lib/supabase-server';
import { generateDailyActions } from '@/app/(app)/acciones/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(): Promise<Response> {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const actions = await generateDailyActions(user.id);
    return Response.json({ actions });
  } catch (err) {
    console.error('[actions/suggest]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
