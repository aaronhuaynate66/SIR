import { getAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const db = getAdminClient();
  const { data } = await db
    .from('ai_usage')
    .select('created_at, user_id, model, feature, tokens_in, tokens_out, cost_usd, latency_ms')
    .order('created_at', { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as Array<{
    created_at: string;
    user_id: string;
    model: string;
    feature: string | null;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    latency_ms: number | null;
  }>;

  const header = 'created_at,user_id,model,feature,tokens_in,tokens_out,cost_usd,latency_ms\n';
  const body = rows.map(r =>
    [r.created_at, r.user_id, r.model, r.feature ?? '', r.tokens_in, r.tokens_out, Number(r.cost_usd).toFixed(6), r.latency_ms ?? ''].join(',')
  ).join('\n');

  return new Response(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ai-usage-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
