export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';
import ExportButton from './ExportButton';

interface UsageRow {
  user_id:    string;
  model:      string;
  feature:    string | null;
  tokens_in:  number;
  tokens_out: number;
  cost_usd:   number;
  latency_ms: number | null;
  created_at: string;
}

const MODEL_COLOR: Record<string, string> = {
  'claude-sonnet-4-6':         '#6366f1',
  'claude-haiku-4-5-20251001': '#10b981',
  'claude-haiku-4-5':          '#10b981',
  'claude-opus-4-7':           '#f59e0b',
  'ollama':                    '#94a3b8',
};

const FEATURE_LABEL: Record<string, string> = {
  briefing:           'Briefing',
  briefing_executive: 'Briefing Ejecutivo',
  signal_extraction:  'Extracción Señal',
  screenshot:         'Análisis Screenshot',
  executive_report:   'Reporte Ejecutivo',
};

// Per-plan monthly budget limits (USD)
const PLAN_BUDGET: Record<string, number> = {
  free:       0.50,
  individual: 5,
  pro:        20,
  enterprise: 100,
};
const DEFAULT_BUDGET = PLAN_BUDGET['individual']!;

function fmt(n: number): string {
  return n < 0.001 ? '<$0.001' : `$${n.toFixed(3)}`;
}

function periodStart(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthStart(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

async function getData() {
  const db = getAdminClient();

  const [todayRes, weekRes, monthRes, recentRes, trend7Res, usersRes] = await Promise.all([
    db.from('ai_usage').select('cost_usd, tokens_in, tokens_out').gte('created_at', periodStart(0)),
    db.from('ai_usage').select('cost_usd, tokens_in, tokens_out').gte('created_at', periodStart(6)),
    db.from('ai_usage').select('user_id, model, feature, tokens_in, tokens_out, cost_usd, latency_ms, created_at').gte('created_at', monthStart()).order('created_at', { ascending: false }),
    db.from('ai_usage').select('user_id, model, feature, tokens_in, tokens_out, cost_usd, latency_ms, created_at').order('created_at', { ascending: false }).limit(50),
    db.from('ai_usage').select('cost_usd, created_at').gte('created_at', periodStart(6)).order('created_at', { ascending: true }),
    db.from('users').select('id, plan').limit(1000),
  ]);

  const todayRows  = (todayRes.data  ?? []) as Pick<UsageRow, 'cost_usd' | 'tokens_in' | 'tokens_out'>[];
  const weekRows   = (weekRes.data   ?? []) as Pick<UsageRow, 'cost_usd' | 'tokens_in' | 'tokens_out'>[];
  const monthRows  = (monthRes.data  ?? []) as UsageRow[];
  const recentRows = (recentRes.data ?? []) as UsageRow[];
  const trend7Rows = (trend7Res.data ?? []) as Array<{ cost_usd: number; created_at: string }>;
  const usersRows  = (usersRes.data  ?? []) as Array<{ id: string; plan: string | null }>;

  const userPlanMap = new Map(usersRows.map(u => [u.id, u.plan ?? 'free']));

  const sum = (rows: Pick<UsageRow, 'cost_usd' | 'tokens_in' | 'tokens_out'>[]) => ({
    cost:   rows.reduce((s, r) => s + Number(r.cost_usd), 0),
    tokens: rows.reduce((s, r) => s + r.tokens_in + r.tokens_out, 0),
    calls:  rows.length,
  });

  // 7-day trend — group by day
  const trendMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of trend7Rows) {
    const k = dayKey(r.created_at);
    trendMap.set(k, (trendMap.get(k) ?? 0) + Number(r.cost_usd));
  }
  const trend7 = [...trendMap.entries()].map(([date, cost]) => ({ date, cost }));

  // By feature (this month)
  const byFeature = new Map<string, number>();
  for (const r of monthRows) {
    const key = r.feature ?? 'unknown';
    byFeature.set(key, (byFeature.get(key) ?? 0) + Number(r.cost_usd));
  }

  // By model (this month)
  const byModel = new Map<string, number>();
  for (const r of monthRows) {
    byModel.set(r.model, (byModel.get(r.model) ?? 0) + Number(r.cost_usd));
  }

  // Top 10 users (this month) with budget usage
  const byCost = new Map<string, number>();
  for (const r of monthRows) byCost.set(r.user_id, (byCost.get(r.user_id) ?? 0) + Number(r.cost_usd));
  const topUsers = [...byCost.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, cost]) => {
      const plan   = userPlanMap.get(userId) ?? 'individual';
      const budget = PLAN_BUDGET[plan] ?? DEFAULT_BUDGET;
      const pct    = Math.min(100, Math.round((cost / budget) * 100));
      return { userId, cost, plan, budget, pct };
    });

  const todayTotal = sum(todayRows).cost;
  const dayAlert   = todayTotal > 1;

  return {
    today:    sum(todayRows),
    week:     sum(weekRows),
    month:    sum(monthRows),
    byFeature,
    byModel,
    topUsers,
    recentRows,
    trend7,
    dayAlert,
    todayTotal,
  };
}

export default async function AIUsagePage() {
  const d = await getData();
  const trendMax = Math.max(0.001, ...d.trend7.map(t => t.cost));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Uso AI — Detalle</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Tiempo real</span>
      </div>

      {/* Alert banner */}
      {d.dayAlert && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: '#dc2626', fontSize: 14 }}>Alerta: costo diario elevado</strong>
            <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d' }}>
              El gasto de hoy ya es {fmt(d.todayTotal)} — supera el umbral de $1.00/día.
            </p>
          </div>
        </div>
      )}

      {/* Period KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <PeriodCard label="Hoy"         cost={d.today.cost}  tokens={d.today.tokens}  calls={d.today.calls}  color={d.dayAlert ? '#ef4444' : '#6366f1'} />
        <PeriodCard label="Esta semana" cost={d.week.cost}   tokens={d.week.tokens}   calls={d.week.calls}   color="#10b981" />
        <PeriodCard label="Este mes"    cost={d.month.cost}  tokens={d.month.tokens}  calls={d.month.calls}  color="#f59e0b" />
      </div>

      {/* 7-day trend */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>Tendencia 7 días</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
          {d.trend7.map(({ date, cost }) => {
            const pct = Math.round((cost / trendMax) * 100);
            const isToday = date === new Date().toISOString().slice(0, 10);
            const barColor = isToday ? '#6366f1' : '#c7d2fe';
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{cost > 0 ? fmt(cost) : ''}</span>
                <div style={{ width: '100%', background: '#f3f4f6', borderRadius: 4, height: 48, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${Math.max(4, pct * 0.48)}px`, background: barColor, borderRadius: 4, transition: 'height 0.3s' }} />
                </div>
                <span style={{ fontSize: 9, color: '#9ca3af' }}>{date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* By feature */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>Costo por feature (mes)</h2>
          {d.byFeature.size === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...d.byFeature.entries()].sort((a, b) => b[1] - a[1]).map(([feature, cost]) => {
                const max = Math.max(0.001, ...[...d.byFeature.values()]);
                const pct = Math.round((cost / max) * 100);
                return (
                  <div key={feature}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{FEATURE_LABEL[feature] ?? feature}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{fmt(cost)}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, height: 6, background: '#6366f1', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By model */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 18px' }}>Costo por modelo (mes)</h2>
          {d.byModel.size === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...d.byModel.entries()].sort((a, b) => b[1] - a[1]).map(([model, cost]) => {
                const max   = Math.max(0.001, ...[...d.byModel.values()]);
                const pct   = Math.round((cost / max) * 100);
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

      {/* Top users */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>Top 10 usuarios (este mes)</h2>
        </div>
        {d.topUsers.length === 0 ? (
          <p style={{ padding: 24, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Sin datos aún.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Usuario', 'Plan', 'Costo', '% Límite', 'Barra'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.topUsers.map(({ userId, cost, plan, budget, pct }, i) => {
                const isOver80  = pct >= 80;
                const isCrit    = pct >= 100;
                const barColor  = isCrit ? '#ef4444' : isOver80 ? '#f59e0b' : '#6366f1';
                return (
                  <tr key={userId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#9ca3af', width: 32 }}>{i + 1}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{userId.slice(0, 16)}…</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>{plan} / {fmt(budget)}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, color: isCrit ? '#ef4444' : isOver80 ? '#d97706' : '#111827' }}>{fmt(cost)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                        background: isCrit ? '#fef2f2' : isOver80 ? '#fffbeb' : '#f0f4ff',
                        color:      isCrit ? '#dc2626' : isOver80 ? '#d97706' : '#4f46e5',
                      }}>
                        {pct}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', width: 140 }}>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, height: 6, background: barColor, borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Last 50 calls */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>Últimas 50 llamadas</h2>
          <ExportButton />
        </div>
        {d.recentRows.length === 0 ? (
          <p style={{ padding: 24, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Sin datos aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Fecha', 'Feature', 'Modelo', 'Tokens', 'Costo', 'Latencia', 'Usuario'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recentRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(row.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                        {FEATURE_LABEL[row.feature ?? ''] ?? row.feature ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: MODEL_COLOR[row.model] ?? '#6b7280', fontWeight: 600 }}>
                      {row.model.replace('claude-', '').replace('-20251001', '')}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#374151' }}>
                      {(row.tokens_in + row.tokens_out).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {fmt(Number(row.cost_usd))}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6b7280' }}>
                      {row.latency_ms != null ? `${row.latency_ms}ms` : '—'}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
                      {row.user_id.slice(0, 12)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodCard({ label, cost, tokens, calls, color }: {
  label: string; cost: number; tokens: number; calls: number; color: string;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderTop: `3px solid ${color}` }}>
      <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color, fontSize: 28, fontWeight: 800, margin: '0 0 6px', lineHeight: 1 }}>{fmt(cost)}</p>
      <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>{calls} llamadas · {tokens.toLocaleString()} tokens</p>
    </div>
  );
}
