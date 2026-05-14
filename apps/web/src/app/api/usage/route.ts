import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase-server';
import { costTracker } from '@sir/ai';

export const dynamic = 'force-dynamic';

const LIMIT_USD = 5;

export async function GET(): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { totalCost, tokensIn, tokensOut } = await costTracker.getMonthlyUsage(user.id);
    return NextResponse.json({
      totalCost:    Math.round(totalCost * 10000) / 10000,
      tokensIn,
      tokensOut,
      limitUsd:     LIMIT_USD,
      percentUsed:  Math.min(100, Math.round((totalCost / LIMIT_USD) * 100)),
    });
  } catch {
    return NextResponse.json({ totalCost: 0, tokensIn: 0, tokensOut: 0, limitUsd: LIMIT_USD, percentUsed: 0 });
  }
}
