export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface EventRow {
  event_name: string;
  user_id:    string;
  created_at: string;
}

const EVENT_COLOR: Record<string, string> = {
  briefing_generated:          '#3b82f6',
  signal_created:              '#10b981',
  action_completed:            '#22c55e',
  action_dismissed:            '#ef4444',
  action_postponed:            '#f59e0b',
  actions_generated:           '#8b5cf6',
  search_used:                 '#06b6d4',
  graph_viewed:                '#f97316',
  person_created:              '#ec4899',
  person_viewed:               '#a78bfa',
  google_import_completed:     '#34d399',
  microsoft_import_completed:  '#60a5fa',
  sidebar_nav:                 '#94a3b8',
  screenshot_analyzed:         '#fbbf24',
};

const ALL_FEATURES = [
  'briefing_generated', 'signal_created', 'action_completed', 'action_dismissed',
  'action_postponed', 'actions_generated', 'search_used', 'graph_viewed',
  'person_created', 'person_viewed', 'google_import_completed',
  'microsoft_import_completed', 'screenshot_analyzed', 'sidebar_nav',
];

async function getFeatureData() {
  const db      = getAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data } = await db
    .from('analytics_events')
    .select('event_name, user_id, created_at')
    .gte('created_at', weekAgo);

  const events = (data ?? []) as EventRow[];

  // Aggregate per feature
  const featureMap = new Map<string, { count: number; users: Set<string> }>();
  for (const e of events) {
    const entry = featureMap.get(e.event_name) ?? { count: 0, users: new Set() };
    entry.count++;
    entry.users.add(e.user_id);
    featureMap.set(e.event_name, entry);
  }

  const rows = ALL_FEATURES.map(name => ({
    name,
    count:    featureMap.get(name)?.count    ?? 0,
    uniqueUsers: featureMap.get(name)?.users.size ?? 0,
    neverUsed: !featureMap.has(name),
  })).sort((a, b) => b.count - a.count);

  const top5     = rows.filter(r => r.count > 0).slice(0, 5);
  const never    = rows.filter(r => r.neverUsed);
  const maxCount = Math.max(1, rows[0]?.count ?? 1);

  return { rows, top5, never, maxCount, totalEvents: events.length };
}

export default async function FeatureUsagePage() {
  const d = await getFeatureData();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Feature Usage</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Últimos 7 días · {d.totalEvents} eventos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Full table */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Todas las features</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Feature', 'Usos / 7d', 'Usuarios únicos', 'Popularidad'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.rows.map((row, i) => {
                const color  = EVENT_COLOR[row.name] ?? '#6366f1';
                const pct    = Math.round((row.count / d.maxCount) * 100);
                return (
                  <tr key={row.name} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: row.neverUsed ? '#f3f4f6' : (color + '18'),
                        color: row.neverUsed ? '#9ca3af' : color,
                      }}>
                        {row.name}
                      </span>
                      {row.neverUsed && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>NUNCA USADA</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: 14, color: row.count > 0 ? '#111827' : '#d1d5db' }}>
                      {row.count}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>
                      {row.uniqueUsers > 0 ? row.uniqueUsers : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', width: 140 }}>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, width: 120 }}>
                        <div style={{ width: `${pct}%`, height: 6, background: row.neverUsed ? '#e5e7eb' : color, borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top 5 */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '18px 20px' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1f2937' }}>🏆 Top 5 features</h2>
            {d.top5.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos aún</p>
            ) : d.top5.map((row, i) => {
              const color = EVENT_COLOR[row.name] ?? '#6366f1';
              return (
                <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#9ca3af', width: 16 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{row.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{row.count}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 3, height: 4 }}>
                      <div style={{ width: `${Math.round(row.count / d.maxCount * 100)}%`, height: 4, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Never used */}
          <div style={{ background: '#fffbeb', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '18px 20px', border: '1px solid #fde68a' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#92400e' }}>
              ⚠️ Features nunca usadas ({d.never.length})
            </h2>
            {d.never.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>¡Todas las features tienen uso!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.never.map(row => (
                  <span key={row.name} style={{ fontSize: 12, color: '#b45309', fontWeight: 600, background: '#fef3c7', borderRadius: 4, padding: '3px 8px', display: 'inline-block' }}>
                    {row.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
