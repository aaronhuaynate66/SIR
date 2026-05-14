import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from './supabase-server';

export async function getSubscriptionStatus(): Promise<'free' | 'pro' | 'enterprise'> {
  const user = await getAuthUser();
  if (!user) return 'free';

  const { data } = await getServiceClient()
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  return (data as { subscription_status?: string } | null)?.subscription_status as 'free' | 'pro' | 'enterprise' ?? 'free';
}

export async function requirePro(): Promise<void> {
  const status = await getSubscriptionStatus();
  if (status === 'free') redirect('/settings?upgrade=1');
}

export function isPaidStatus(status: string): boolean {
  return status === 'pro' || status === 'enterprise';
}
