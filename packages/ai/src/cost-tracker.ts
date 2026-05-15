import { getSupabaseClient } from '@sir/db';

const PRICES: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5-20251001': { in: 0.25,  out: 1.25 },
  'claude-haiku-4-5':          { in: 0.25,  out: 1.25 },
  'claude-sonnet-4-6':         { in: 3,     out: 15   },
  'claude-opus-4-7':           { in: 15,    out: 75   },
  'ollama':                    { in: 0,     out: 0    },
};

// Monthly AI spend limits per plan (USD)
const PLAN_BUDGET_USD: Record<string, number> = {
  free:       0.50,
  individual: 5,
  pro:        20,
  enterprise: 100,
};

function monthStart(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function calcCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICES[model] ?? PRICES['claude-sonnet-4-6']!;
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}

export interface UsageSummary {
  totalCost:  number;
  tokensIn:   number;
  tokensOut:  number;
}

export interface TrackAIUsageParams {
  userId:     string;
  feature:    string;
  model:      string;
  tokensIn:   number;
  tokensOut:  number;
  latencyMs?: number;
}

export class CostTracker {
  async track(
    userId:    string,
    model:     string,
    tokensIn:  number,
    tokensOut: number,
    feature?:  string,
    latencyMs?: number,
  ): Promise<void> {
    if (!userId) return;
    const costUsd = calcCost(model, tokensIn, tokensOut);
    await getSupabaseClient().from('ai_usage').insert({
      user_id:    userId,
      model,
      tokens_in:  tokensIn,
      tokens_out: tokensOut,
      cost_usd:   costUsd,
      ...(feature   !== undefined && { feature }),
      ...(latencyMs !== undefined && { latency_ms: latencyMs }),
    });
  }

  async getMonthlyUsage(userId: string): Promise<UsageSummary> {
    const { data } = await getSupabaseClient()
      .from('ai_usage')
      .select('tokens_in, tokens_out, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStart());

    const rows = (data ?? []) as Array<{ tokens_in: number; tokens_out: number; cost_usd: number }>;
    return {
      totalCost: rows.reduce((s, r) => s + Number(r.cost_usd), 0),
      tokensIn:  rows.reduce((s, r) => s + r.tokens_in,        0),
      tokensOut: rows.reduce((s, r) => s + r.tokens_out,       0),
    };
  }

  async isOverMonthlyLimit(userId: string, limitUsd = 5): Promise<boolean> {
    const { totalCost } = await this.getMonthlyUsage(userId);
    return totalCost >= limitUsd;
  }

  async checkBudget(userId: string, db: ReturnType<typeof getSupabaseClient>): Promise<Response | null> {
    try {
      const [{ data: userData }, usage] = await Promise.all([
        db.from('users').select('subscription_status').eq('id', userId).single(),
        this.getMonthlyUsage(userId),
      ]);
      const status   = (userData as { subscription_status?: string } | null)?.subscription_status ?? 'free';
      const limitUsd = PLAN_BUDGET_USD[status] ?? PLAN_BUDGET_USD['free']!;
      if (usage.totalCost >= limitUsd) {
        return Response.json(
          {
            error: `Límite de AI alcanzado: $${usage.totalCost.toFixed(3)} / $${limitUsd} (plan ${status}). Se reinicia el 1 del mes.`,
            used:  usage.totalCost,
            limit: limitUsd,
            plan:  status,
          },
          { status: 429, headers: { 'Retry-After': '86400' } },
        );
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const costTracker = new CostTracker();

export async function trackAIUsage(params: TrackAIUsageParams): Promise<void> {
  const { userId, feature, model, tokensIn, tokensOut, latencyMs } = params;
  costTracker.track(userId, model, tokensIn, tokensOut, feature, latencyMs).catch(() => undefined);
}
