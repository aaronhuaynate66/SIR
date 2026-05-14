import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import type { DbMemory, DbSignal } from '@sir/db';

export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string) {
  const db = getServiceClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [memoriesRes, signalsRes, weekSignalsRes, contactsRes] = await Promise.all([
    db.from('memories').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('signals').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('signals').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo),
    db.from('memories')
      .select('id, content, metadata, created_at')
      .eq('user_id', userId)
      .eq('layer', 'social')
      .is('expires_at', null)
      .order('importance', { ascending: false })
      .limit(8),
  ]);

  const recentSignals = await db.from('signals')
    .select('id, type, payload, processed, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalMemories: memoriesRes.count ?? 0,
    totalSignals: signalsRes.count ?? 0,
    signalsThisWeek: weekSignalsRes.count ?? 0,
    contacts: (contactsRes.data ?? []) as DbMemory[],
    recentSignals: (recentSignals.data ?? []) as DbSignal[],
  };
}

const SIGNAL_COLORS: Record<string, string> = {
  interaction: '#818cf8',
  emotion: '#f472b6',
  location: '#34d399',
  relationship: '#60a5fa',
  task: '#fbbf24',
  insight: '#a78bfa',
  external: '#94a3b8',
};

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const data = await getDashboardData(user.id);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>Dashboard</h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 32px' }}>
        Bienvenido, {user.user_metadata?.['name'] ?? user.email}
      </p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
        {[
          { label: 'Memorias totales', value: data.totalMemories, color: '#818cf8' },
          { label: 'Señales totales',  value: data.totalSignals,  color: '#34d399' },
          { label: 'Señales esta semana', value: data.signalsThisWeek, color: '#fbbf24' },
        ].map(({ label, value, color }) => (
          <div key={label} style={kpiCard}>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 6px' }}>{label}</p>
            <p style={{ color, fontSize: 36, fontWeight: 700, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Contactos */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Personas</h2>
            <Link href="/people" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {data.contacts.length === 0 ? (
            <div style={emptyCard}>
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                Aún no hay personas registradas.<br />
                Envía una señal de tipo <code style={{ color: '#818cf8' }}>relationship</code>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.contacts.map(contact => {
                const meta = contact.metadata as Record<string, unknown>;
                const name = typeof meta['name'] === 'string' ? meta['name'] : contact.content.slice(0, 30);
                return (
                  <Link key={contact.id} href={`/people/${contact.id}`} style={contactRow}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#2a2d3e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#818cf8', fontSize: 16, fontWeight: 700,
                    }}>
                      {name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                        {contact.content.slice(0, 50)}{contact.content.length > 50 ? '…' : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Señales recientes */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>Señales recientes</h2>
          {data.recentSignals.length === 0 ? (
            <div style={emptyCard}>
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Sin señales aún.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recentSignals.map(signal => (
                <div key={signal.id} style={signalRow}>
                  <span style={{
                    background: SIGNAL_COLORS[signal.type] ?? '#94a3b8',
                    color: '#0f1117',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}>
                    {signal.type}
                  </span>
                  <span style={{ color: '#64748b', fontSize: 11, marginLeft: 'auto' }}>
                    {new Date(signal.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontSize: 13, color: signal.processed ? '#34d399' : '#fbbf24' }}>
                    {signal.processed ? '✓' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const kpiCard: React.CSSProperties = {
  background: '#1a1d27',
  border: '1px solid #2a2d3e',
  borderRadius: 12,
  padding: '20px 24px',
};
const emptyCard: React.CSSProperties = {
  background: '#1a1d27',
  border: '1px dashed #2a2d3e',
  borderRadius: 10,
  padding: 20,
};
const contactRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: '#1a1d27',
  border: '1px solid #2a2d3e',
  borderRadius: 10,
  textDecoration: 'none',
};
const signalRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#1a1d27',
  border: '1px solid #2a2d3e',
  borderRadius: 8,
};
