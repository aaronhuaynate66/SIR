import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getStripe(): Stripe {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getServiceClient();

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const isActive = sub.status === 'active' || sub.status === 'trialing';
    const expiresAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

    await db
      .from('users')
      .update({
        subscription_status: isActive ? 'pro' : 'free',
        ...(expiresAt ? { subscription_expires_at: expiresAt } : {}),
      })
      .eq('stripe_customer_id', customerId);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await db
      .from('users')
      .update({ subscription_status: 'free', subscription_expires_at: null })
      .eq('stripe_customer_id', customerId);
  }

  return NextResponse.json({ received: true });
}
