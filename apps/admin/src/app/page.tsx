export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';
import type { MemoryLayer } from '@sir/db';

const LAYERS: Array<{ layer: MemoryLayer; label: string; color: string }> = [
  { layer: 'episodic',   label: 'Episódica',   color: '#dcfce7' },
  { layer: 'semantic',   label: 'Semántica',   color: '#ede9fe' },
  { layer: 'procedural', label: 'Procedural',  color: '#fce7f3' },
  { layer: 'emotional',  label: 'Emocional',   color: '#ffedd5' },
  { layer: 'prophetic',  label: 'Profética',   color: '#f0fdf4' },
];

async function getStats() {
  const db = getAdminClient();

  const [layerCounts, totalSignals, totalUsers, pendingSignals, recentSignals] =
    await Promise.all([
      Promise.all(
        LAYERS.map(async ({ layer }) => {
          const { count } = await db
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('layer', layer);
          return { layer, count: count ?? 0 };
        })
      ),
      db.from('signals').select('*', { count: 'exact', head: true }),
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('signals').select('*', { count: 'exact', head: true }).eq('processed', false),
      db.from('signals').select('id, type, user_id, created_at, processed').order('created_at', { ascending: false }).limit(10),
    ]);

  return {
    layerCounts,
    totalSignals: totalSignals.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    pendingSignals: pendingSignals.count ?? 0,
    recentSignals: recentSignals.data ?? [],
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        Dashboard
      </h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Usuarios', value: stats.totalUsers, color: '#6366f1' },
          { label: 'Señales totales', value: stats.totalSignals, color: '#10b981' },
          { label: 'Señales pendientes', value: stats.pendingSignals, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 32, fontWeight: 700, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Capas de memoria */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Memorias por capa</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {LAYERS.map(({ layer, label, color }) => {
          const count = stats.layerCounts.find((l) => l.layer === layer)?.count ?? 0;
          return (
            <div key={layer} style={{ background: color, borderRadius: 10, padding: 16 }}>
              <p style={{ color: '#374151', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
              <p style={{ color: '#1f2937', fontSize: 28, fontWeight: 700, margin: 0 }}>{count}</p>
            </div>
          );
        })}
        <div style={{ background: '#e0f2fe', borderRadius: 10, padding: 16 }}>
          <p style={{ color: '#374151', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Social (Neo4j)</p>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Ver Neo4j Browser</p>
        </div>
      </div>

      {/* Señales recientes */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Señales recientes</h2>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {['ID', 'Tipo', 'Usuario', 'Procesada', 'Fecha'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.recentSignals.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Sin señales aún</td></tr>
            ) : (
              stats.recentSignals.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{s.id.slice(0, 8)}…</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>{s.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>{s.user_id.slice(0, 8)}…</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ color: s.processed ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.processed ? '✓' : '⏳'}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(s.created_at).toLocaleString('es')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
