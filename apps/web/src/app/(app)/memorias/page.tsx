import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import MemorySearch from '@/components/MemorySearch';
import type { DbMemory, MemoryLayer } from '@sir/db';

export const dynamic = 'force-dynamic';

const LAYERS: Array<{ layer: MemoryLayer; label: string; color: string }> = [
  { layer: 'episodic',   label: 'Episódica',   color: '#6366f1' },
  { layer: 'semantic',   label: 'Semántica',   color: '#8b5cf6' },
  { layer: 'emotional',  label: 'Emocional',   color: '#ec4899' },
  { layer: 'procedural', label: 'Procedural',  color: '#f59e0b' },
  { layer: 'social',     label: 'Social',      color: '#10b981' },
  { layer: 'prophetic',  label: 'Profética',   color: '#06b6d4' },
];

export default async function MemoriesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();
  const { data } = await db.from('memories')
    .select('id, layer, content, metadata, importance, created_at')
    .eq('user_id', user.id)
    .not('layer', 'in', '("sensory","working")')
    .is('expires_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  const memories = (data ?? []) as DbMemory[];

  const byLayer = LAYERS.map(({ layer, label, color }) => ({
    layer, label, color,
    items: memories.filter(m => m.layer === layer),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>Memorias</h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 28px' }}>
        {memories.length} memorias permanentes en {LAYERS.filter(l => memories.some(m => m.layer === l.layer)).length} capas
      </p>

      {/* Buscador semántico */}
      <MemorySearch userId={user.id} />

      {/* Memorias por capa */}
      <div style={{ marginTop: 36 }}>
        {byLayer.map(({ layer, label, color, items }) => (
          items.length === 0 ? null : (
            <section key={layer} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                  {label}
                </h2>
                <span style={{ fontSize: 12, color: '#475569' }}>({items.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(mem => (
                  <div key={mem.id} style={{
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '0 10px 10px 0',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
                        {mem.content}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#334155' }}>
                        {new Date(mem.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: color }}>
                        {Math.round(mem.importance * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        ))}

        {memories.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ fontSize: 15 }}>No hay memorias permanentes todavía.</p>
            <p style={{ fontSize: 13, color: '#334155' }}>Las memorias se crean automáticamente al procesar señales.</p>
          </div>
        )}
      </div>
    </div>
  );
}
