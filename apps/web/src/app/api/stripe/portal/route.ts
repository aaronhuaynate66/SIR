import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getStripe(): Stripe {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  void req;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

  try {
    const db = getServiceClient();
    const { data } = await db
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: 'No Stripe customer' }, { status: 404 });

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
