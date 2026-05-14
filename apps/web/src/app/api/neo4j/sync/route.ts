import { type NextRequest, NextResponse } from 'next/server';
import { syncAllPending, getNeo4jStats } from '@sir/db';

export const dynamic = 'force-dynamic';
export const runtime  = 'nodejs';

function authorized(req: NextRequest): boolean {
  const secret = process.env['CRON_SECRET'];
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// Vercel Cron (GET) — syncs pending + returns stats
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [syncResult, stats] = await Promise.all([
      syncAllPending(50),
      getNeo4jStats().catch(() => ({ nodes: -1, edges: -1 })),
    ]);

    return NextResponse.json({
      ...syncResult,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Manual trigger (POST) — same as GET but also available for webhooks
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const syncResult = await syncAllPending(100);
    return NextResponse.json({ ...syncResult, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
