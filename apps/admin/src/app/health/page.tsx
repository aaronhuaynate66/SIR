export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface UserRow {
  id:         string;
  email:      string;
  created_at: string;
}

interface ActionRow {
  user_id: string;
  status:  string;
  created_at: string;
}

interface EventRow {
  user_id:    string;
  created_at: string;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function relTime(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return 'hoy';
  if (d === 1) return 'ayer';
  return `hace ${d}d`;
}

async function getHealthData() {
  const db      = getAdminClient();
  const threeDaysAgo = new Date(Date.now() - 3  * 86_400_000).toISOString();
  const weekAgo      = new Date(Date.now() - 7  * 86_400_000).toISOString();

  const [usersRes, peopleCountRes, actionsRes, eventsRes] = await Promise.all([
    db.from('users').select('id, email, created_at').order('created_at', { ascending: false }),
    db.from('people').select('user_id, id'),
    db.from('action_suggestions')
      .select('user_id, status, created_at')
      .gte('created_at', weekAgo),
    db.from('analytics_events')
      .select('user_id, created_at')
      .gte('created_at', threeDaysAgo),
  ]);

  const users   = (usersRes.data   ?? []) as UserRow[];
  const people  = (peopleCountRes.data ?? []) as { user_id: string; id: string }[];
  const actions = (actionsRes.data  ?? []) as ActionRow[];
  const events  = (eventsRes.data   ?? []) as EventRow[];

  // Per-user people count
  const peopleMap = new Map<string, number>();
  for (const p of people) peopleMap.set(p.user_id, (peopleMap.get(p.user_id) ?? 0) + 1);

  // Active users in last 3 days (from analytics_events)
  const activeSet = new Set(events.map(e => e.user_id));

  // Users who never imported contacts
  const noContacts = users.filter(u => (peopleMap.get(u.id) ?? 0) === 0);

  // Users inactive > 3 days (registered > 3 days ago and no event in last 3d)
  const inactive = users.filter(u =>
    daysSince(u.created_at) > 3 && !activeSet.has(u.id)
  );

  // High dismiss rate this week (per user: dismissed / total)
  const dismissMap = new Map<string, { dismissed: number; total: number }>();
  for (const a of actions) {
    const entry = dismissMap.get(a.user_id) ?? { dismissed: 0, total: 0 };
    entry.total++;
    if (a.status === 'dismissed') entry.dismissed++;
    dismissMap.set(a.user_id, entry);
  }
  const highDismiss = [...dismissMap.entries()]
    .map(([userId, s]) => ({
      userId,
      email:       users.find(u => u.id === userId)?.email ?? userId.slice(0, 8) + '…',
      dismissRate: s.total > 0 ? Math.round((s.dismissed / s.total) * 100) : 0,
      dismissed:   s.dismissed,
      total:       s.total,
    }))
    .filter(r => r.dismissRate >= 50 && r.total >= 2)
    .sort((a, b) => b.dismissRate - a.dismissRate);

  return { users, noContacts, inactive, highDismiss, activeSet };
}

export default async function HealthPage() {
  const d = await getHealthData();

  const sections = [
    {
      title:    `Sin contactos importados — ${d.noContacts.length} usuarios`,
      color:    '#f59e0b',
      bg:       '#fffbeb',
      border:   '#fde68a',
      empty:    '¡Todos los usuarios tienen contactos importados.',
      items:    d.noContacts,
      renderRow: (u: UserRow) => (
        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fef3c7' }}>
          <span style={{ fontSize: 13, color: '#374151' }}>{u.email}</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>registrado {relTime(u.created_at)}</span>
        </div>
      ),
    },
    {
      title:    `Inactivos (&gt;3 días) — ${d.inactive.length} usuarios`,
      color:    '#ef4444',
      bg:       '#fef2f2',
      border:   '#fecaca',
      empty:    '¡Sin usuarios inactivos!',
      items:    d.inactive,
      renderRow: (u: UserRow) => (
        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fee2e2' }}>
          <span style={{ fontSize: 13, color: '#374151' }}>{u.email}</span>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{daysSince(u.created_at)}d inactivo</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Health Check</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Señales de riesgo para beta users</span>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total usuarios',       value: d.users.length,         color: '#6366f1' },
          { label: 'Usuarios activos 3d',  value: d.activeSet.size,       color: '#10b981' },
          { label: 'Sin contactos',        value: d.noContacts.length,    color: '#f59e0b' },
          { label: 'Inactivos +3d',        value: d.inactive.length,      color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderTop: `3px solid ${color}` }}>
            <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ color, fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {sections.map(s => (
          <div key={s.title} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: s.color }}
              dangerouslySetInnerHTML={{ __html: s.title }} />
            {s.items.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{s.empty}</p>
            ) : (
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {(s.items as UserRow[]).slice(0, 20).map(u => s.renderRow(u))}
                {s.items.length > 20 && (
                  <p style={{ color: '#9ca3af', fontSize: 12, margin: '8px 0 0' }}>+{s.items.length - 20} más…</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* High dismiss rate */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
            Alta tasa de descarte de acciones (≥50%, última semana)
          </h2>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{d.highDismiss.length} usuarios</span>
        </div>
        {d.highDismiss.length === 0 ? (
          <p style={{ padding: '20px', color: '#9ca3af', fontSize: 13 }}>Sin usuarios con alta tasa de descarte — las sugerencias son relevantes.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Usuario', 'Descartadas', 'Total', 'Tasa'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.highDismiss.map((r, i) => (
                <tr key={r.userId} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>{r.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{r.dismissed}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>{r.total}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: r.dismissRate >= 75 ? '#fee2e2' : '#fef3c7',
                      color: r.dismissRate >= 75 ? '#ef4444' : '#d97706',
                    }}>
                      {r.dismissRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
