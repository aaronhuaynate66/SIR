export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface EventRow {
  id:         string;
  user_id:    string;
  event_name: string;
  properties: Record<string, unknown>;
  page_path:  string | null;
  created_at: string;
}

interface UserRow {
  id:    string;
  email: string;
}

const EVENT_COLOR: Record<string, string> = {
  briefing_generated:         '#3b82f6',
  signal_created:             '#10b981',
  action_completed:           '#22c55e',
  action_dismissed:           '#ef4444',
  action_postponed:           '#f59e0b',
  search_used:                '#06b6d4',
  graph_viewed:               '#f97316',
  person_created:             '#ec4899',
  google_import_completed:    '#34d399',
  sidebar_nav:                '#94a3b8',
  screenshot_analyzed:        '#fbbf24',
};

function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)    return 'ahora';
  if (mins < 60)   return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

async function getActivityData() {
  const db = getAdminClient();

  const [eventsRes, usersRes] = await Promise.all([
    db.from('analytics_events')
      .select('id, user_id, event_name, properties, page_path, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('users').select('id, email'),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const users  = (usersRes.data  ?? []) as UserRow[];
  const emailMap = new Map(users.map(u => [u.id, u.email]));

  return { events, emailMap };
}

export default async function ActivityPage() {
  const { events, emailMap } = await getActivityData();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Activity Feed</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Últimos 100 eventos</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Hace', 'Usuario', 'Evento', 'Página', 'Detalles'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  Sin eventos aún. El tracking se activa con el deploy.
                </td>
              </tr>
            ) : events.map((e, i) => {
              const color = EVENT_COLOR[e.event_name] ?? '#6366f1';
              const email = emailMap.get(e.user_id) ?? e.user_id.slice(0, 8) + '…';
              const props = Object.entries(e.properties ?? {})
                .filter(([, v]) => v !== null && v !== undefined)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join(' · ');
              return (
                <tr key={e.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f9fafb' }}>
                  <td style={{ padding: '9px 16px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {relTime(e.created_at)}
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 12, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email}
                  </td>
                  <td style={{ padding: '9px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: color + '18', color,
                    }}>
                      {e.event_name}
                    </span>
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                    {e.page_path ?? '—'}
                  </td>
                  <td style={{ padding: '9px 16px', fontSize: 12, color: '#6b7280', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {props || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
