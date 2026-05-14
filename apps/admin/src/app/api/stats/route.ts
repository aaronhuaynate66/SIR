import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-server';
import type { MemoryLayer } from '@sir/db';

export const runtime = 'nodejs';

const LAYERS: MemoryLayer[] = [
  'episodic', 'semantic', 'procedural', 'emotional', 'prophetic',
];

export interface LayerStat {
  layer: MemoryLayer;
  count: number;
  lastActivity: string | null;
}

export interface StatsResponse {
  layers: LayerStat[];
  totalSignals: number;
  totalUsers: number;
  pendingSignals: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminClient();

    const [layerResults, signalResult, userResult, pendingResult] = await Promise.all([
      Promise.all(
        LAYERS.map(async (layer): Promise<LayerStat> => {
          const { count } = await db
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('layer', layer)
            .then((r) => ({ count: r.count ?? 0 }));

          const { data } = await db
            .from('memories')
            .select('created_at')
            .eq('layer', layer)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return { layer, count, lastActivity: data?.created_at ?? null };
        })
      ),
      db.from('signals').select('*', { count: 'exact', head: true }),
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('signals').select('*', { count: 'exact', head: true }).eq('processed', false),
    ]);

    return NextResponse.json({
      layers: layerResults,
      totalSignals: signalResult.count ?? 0,
      totalUsers: userResult.count ?? 0,
      pendingSignals: pendingResult.count ?? 0,
    } satisfies StatsResponse);
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
