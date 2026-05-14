import { getSupabaseClient } from '@sir/db';

const PRICES: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5-20251001': { in: 0.25,  out: 1.25 },
  'claude-haiku-4-5':          { in: 0.25,  out: 1.25 },
  'claude-sonnet-4-6':         { in: 3,     out: 15   },
  'claude-opus-4-7':           { in: 15,    out: 75   },
  'ollama':                    { in: 0,     out: 0    },
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

export class CostTracker {
  async track(
    userId:    string,
    model:     string,
    tokensIn:  number,
    tokensOut: number,
  ): Promise<void> {
    if (!userId) return;
    const costUsd = calcCost(model, tokensIn, tokensOut);
    await getSupabaseClient().from('ai_usage').insert({
      user_id:    userId,
      model,
      tokens_in:  tokensIn,
      tokens_out: tokensOut,
      cost_usd:   costUsd,
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
}

export const costTracker = new CostTracker();
