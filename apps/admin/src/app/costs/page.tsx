export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface UsageRow {
  user_id:    string;
  model:      string;
  tokens_in:  number;
  tokens_out: number;
  cost_usd:   number;
  created_at: string;
}

const MODEL_COLOR: Record<string, string> = {
  'claude-sonnet-4-6':         '#6366f1',
  'claude-haiku-4-5-20251001': '#10b981',
  'claude-haiku-4-5':          '#10b981',
  'claude-opus-4-7':           '#f59e0b',
  'ollama':                    '#94a3b8',
};

function dayKey(iso: string): string { return iso.slice(0, 10); }

async function getCostData() {
  const db = getAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(Date.now() - 29 * 86_400_000);

  const [monthRes, histRes] = await Promise.all([
    db.from('ai_usage').select('user_id, model, tokens_in, tokens_out, cost_usd').gte('created_at', monthStart.toISOString()),
    db.from('ai_usage').select('cost_usd, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at'),
  ]);

  const monthRows = (monthRes.data ?? []) as UsageRow[];
  const histRows  = (histRes.data  ?? []) as Pick<UsageRow, 'cost_usd' | 'created_at'>[];

  // Top users by cost this month
  const byCost = new Map<string, number>();
  for (const r of monthRows) byCost.set(r.user_id, (byCost.get(r.user_id) ?? 0) + Number(r.cost_usd));
  const topUsers = [...byCost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topMax   = Math.max(0.001, topUsers[0]?.[1] ?? 0);

  // Daily cost chart (last 14 days)
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dayKey(d.toISOString()));
  }
  const dailyCost = new Map<string, number>();
  for (const d of days) dailyCost.set(d, 0);
  for (const r of histRows) {
    const k = dayKey(r.created_at);
    if (dailyCost.has(k)) dailyCost.set(k, (dailyCost.get(k) ?? 0) + Number(r.cost_usd));
  }
  const dailyMax = Math.max(0.001, ...dailyCost.values());

  // By model
  const byModel = new Map<string, number>();
  for (const r of monthRows) byModel.set(r.model, (byModel.get(r.model) ?? 0) + Number(r.cost_usd));

  const totalCost   = monthRows.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalTokens = monthRows.reduce((s, r) => s + r.tokens_in + r.tokens_out, 0);

  return { topUsers, topMax, days, dailyCost, dailyMax, byModel, totalCost, totalTokens };
}

function fmt(n: number): string {
  return n < 0.01 ? '<$0.01' : `$${n.toFixed(3)}`;
}

export default async function CostsPage() {
  const d = await getCostData();

  const warn     = d.topUsers.filter(([, c]) => c >= 3).length;
  const critical = d.topUsers.filter(([, c]) => c >= 8).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Costos AI</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Este mes</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Costo total"    value={fmt(d.totalCost)} color="#6366f1" />
        <KpiCard label="Tokens totales" value={d.totalTokens.toLocaleString()} color="#10b981" />
        <KpiCard label="Alertas warn"   value={warn}     color="#f59e0b" sub="≥ $3/mes" />
        <KpiCard label="Críticos"       value={critical} color="#ef4444" sub="≥ $8/mes" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Daily cost chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>Costo diario (14 días)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {d.days.map(day => {
              const cost = d.dailyCost.get(day) ?? 0;
              const pct  = cost / d.dailyMax;
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#6b7280' }}>{cost > 0 ? fmt(cost).replace('$', '') : ''}</span>
                  <div style={{ width: '100%', height: Math.max(4, Math.round(pct * 90)), background: cost > 0 ? '#6366f1' : '#e5e7eb', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: 9, color: '#9ca3af', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 24 }}>{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By model */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>Costo por modelo</h2>
          {d.byModel.size === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...d.byModel.entries()].sort((a, b) => b[1] - a[1]).map(([model, cost]) => {
                const max  = Math.max(0.001, ...[...d.byModel.values()]);
                const pct  = Math.round((cost / max) * 100);
                const color = MODEL_COLOR[model] ?? '#6b7280';
                return (
                  <div key={model}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{model.replace('claude-', '').replace('-20251001', '')}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{fmt(cost)}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top users table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>Uso por usuario (este mes)</h2>
        </div>
        {d.topUsers.length === 0 ? (
          <p style={{ padding: 24, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Sin datos aún. Las llamadas a Claude aparecerán aquí.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Usuario', 'Costo', 'Barra de uso', 'Alerta'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.topUsers.map(([userId, cost]) => {
                const pct      = Math.min(100, Math.round((cost / 8) * 100));
                const isCrit   = cost >= 8;
                const isWarn   = cost >= 3 && !isCrit;
                const barColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#6366f1';
                return (
                  <tr key={userId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{userId.slice(0, 12)}…</td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, color: isCrit ? '#ef4444' : isWarn ? '#d97706' : '#111827' }}>{fmt(cost)}</td>
                    <td style={{ padding: '10px 16px', width: 160 }}>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, height: 6, background: barColor, borderRadius: 4 }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {isCrit ? <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>CRÍTICO</span>
                        : isWarn ? <span style={{ background: '#fffbeb', color: '#d97706', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>WARN</span>
                        : <span style={{ color: '#9ca3af', fontSize: 12 }}>OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderTop: `3px solid ${color}` }}>
      <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color, fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#9ca3af', fontSize: 12, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}
