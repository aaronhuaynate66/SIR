export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface EventRow {
  user_id:    string;
  event_name: string;
  created_at: string;
}

const EVENT_COLOR: Record<string, string> = {
  signal_captured:  '#10b981',
  briefing_viewed:  '#6366f1',
  state_updated:    '#f59e0b',
  person_contacted: '#3b82f6',
  memory_recalled:  '#8b5cf6',
  graph_viewed:     '#ec4899',
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dayKey(d.toISOString()));
  }
  return days;
}

async function getAnalyticsData() {
  const db  = getAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data } = await db
    .from('analytics_events')
    .select('user_id, event_name, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true });

  const events = (data ?? []) as EventRow[];

  // Events per day (last 14 days)
  const days = last14Days();
  const perDay = new Map<string, number>();
  for (const d of days) perDay.set(d, 0);
  for (const e of events) {
    const k = dayKey(e.created_at);
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const dailyMax = Math.max(1, ...perDay.values());

  // Top events
  const eventCounts = new Map<string, number>();
  for (const e of events) eventCounts.set(e.event_name, (eventCounts.get(e.event_name) ?? 0) + 1);
  const topEvents = [...eventCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topMax = Math.max(1, topEvents[0]?.[1] ?? 1);

  // DAU / WAU
  const today = dayKey(new Date().toISOString());
  const weekStart = dayKey(new Date(Date.now() - 6 * 86_400_000).toISOString());
  const dauSet = new Set(events.filter(e => dayKey(e.created_at) === today).map(e => e.user_id));
  const wauSet = new Set(events.filter(e => dayKey(e.created_at) >= weekStart).map(e => e.user_id));

  return { days, perDay, dailyMax, topEvents, topMax, dau: dauSet.size, wau: wauSet.size, total: events.length };
}

export default async function AnalyticsPage() {
  const d = await getAnalyticsData();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Analytics</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Últimos 30 días</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Eventos totales" value={d.total}  color="#6366f1" />
        <KpiCard label="DAU hoy"         value={d.dau}    color="#10b981" sub="usuarios activos" />
        <KpiCard label="WAU 7 días"      value={d.wau}    color="#3b82f6" sub="usuarios activos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Daily events bar chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>
            Eventos por día (últimos 14 días)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {d.days.map(day => {
              const count = d.perDay.get(day) ?? 0;
              const pct   = count / d.dailyMax;
              const short = day.slice(5); // MM-DD
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{count > 0 ? count : ''}</span>
                  <div style={{
                    width: '100%',
                    height: Math.max(4, Math.round(pct * 90)),
                    background: count > 0 ? '#6366f1' : '#e5e7eb',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <span style={{ fontSize: 9, color: '#9ca3af', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 24 }}>
                    {short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top events */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>
            Top eventos
          </h2>
          {d.topEvents.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.topEvents.map(([name, count]) => {
                const pct   = Math.round((count / d.topMax) * 100);
                const color = EVENT_COLOR[name] ?? '#6366f1';
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{count}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderTop: `3px solid ${color}` }}>
      <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color, fontSize: 34, fontWeight: 800, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#9ca3af', fontSize: 12, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}
