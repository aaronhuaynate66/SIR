import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-server';
import type { MemoryLayer } from '@sir/db';

export const runtime = 'nodejs';

const VALID_LAYERS: MemoryLayer[] = [
  'sensory', 'working', 'episodic', 'semantic',
  'procedural', 'emotional', 'social', 'prophetic',
];

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const layer = searchParams.get('layer') as MemoryLayer | null;
    const userId = searchParams.get('userId');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    if (layer && !VALID_LAYERS.includes(layer)) {
      return NextResponse.json({ error: 'Invalid layer', code: 'INVALID_LAYER' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = getAdminClient()
      .from('memories')
      .select('id, user_id, layer, content, importance, created_at, metadata');

    if (layer) query = query.eq('layer', layer);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ memories: data ?? [], total: (data as unknown[])?.length ?? 0 });
  } catch (err) {
    console.error('[GET /api/memories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
