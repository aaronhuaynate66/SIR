import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import { costTracker } from '@sir/ai';
import SettingsForm from './SettingsForm';
import type { NotificationPrefs } from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const { data } = await getServiceClient()
    .from('users')
    .select('push_enabled, email_enabled, dnd_start_hour, dnd_end_hour, max_notifs_per_day, timezone')
    .eq('id', user.id)
    .single();

  const usage = await costTracker.getMonthlyUsage(user.id).catch(() => null);

  const prefs: NotificationPrefs = {
    push_enabled:       (data as { push_enabled?: boolean } | null)?.push_enabled       ?? true,
    email_enabled:      (data as { email_enabled?: boolean } | null)?.email_enabled      ?? true,
    dnd_start_hour:     (data as { dnd_start_hour?: number } | null)?.dnd_start_hour     ?? 22,
    dnd_end_hour:       (data as { dnd_end_hour?: number } | null)?.dnd_end_hour         ?? 8,
    max_notifs_per_day: (data as { max_notifs_per_day?: number } | null)?.max_notifs_per_day ?? 3,
    timezone:           (data as { timezone?: string } | null)?.timezone                 ?? 'UTC',
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
          Configuración
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
          Preferencias de notificaciones y zona horaria
        </p>
      </div>
      <SettingsForm initial={prefs} />

      {usage && (
        <div style={{ marginTop: 28, background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Uso AI este mes
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>
              ${usage.totalCost.toFixed(4)}
            </span>
            <span style={{ color: '#64748b', fontSize: 12 }}>límite $5.00</span>
          </div>
          <div style={{ background: '#2a2d3e', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (usage.totalCost / 5) * 100)}%`,
              background: usage.totalCost >= 5 ? '#ef4444' : usage.totalCost >= 3 ? '#f59e0b' : '#6366f1',
              borderRadius: 4, transition: 'width 0.3s',
            }} />
          </div>
          <p style={{ color: '#475569', fontSize: 11, margin: '6px 0 0' }}>
            {(usage.tokensIn + usage.tokensOut).toLocaleString()} tokens totales
          </p>
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2a2d3e' }}>
        <Link
          href="/settings/privacy"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#94a3b8', fontSize: 13, textDecoration: 'none',
          }}
        >
          Privacidad y datos →
        </Link>
      </div>
    </div>
  );
}
