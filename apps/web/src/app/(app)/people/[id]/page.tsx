import { redirect, notFound } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import BriefingButton from '@/components/BriefingButton';
import type { DbMemory, DbSignal } from '@sir/db';

export const dynamic = 'force-dynamic';

const LAYER_COLORS: Record<string, string> = {
  episodic:   '#6366f1',
  semantic:   '#8b5cf6',
  emotional:  '#ec4899',
  procedural: '#f59e0b',
  social:     '#10b981',
  prophetic:  '#06b6d4',
  working:    '#94a3b8',
  sensory:    '#64748b',
};

export default async function PersonPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();

  const { data: contactData } = await db.from('memories')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .eq('layer', 'social')
    .single();

  if (!contactData) notFound();
  const contact = contactData as DbMemory;
  const meta = contact.metadata as Record<string, unknown>;
  const name = typeof meta['name'] === 'string' ? meta['name'] : contact.content.slice(0, 30);

  // Memorias relacionadas con esta persona
  const { data: memories } = await db.from('memories')
    .select('id, layer, content, metadata, importance, created_at')
    .eq('user_id', user.id)
    .neq('layer', 'sensory')
    .neq('layer', 'working')
    .order('created_at', { ascending: false })
    .limit(20);

  // Señales de relación con esta persona (por nombre en payload)
  const { data: signals } = await db.from('signals')
    .select('id, type, payload, created_at, processed')
    .eq('user_id', user.id)
    .in('type', ['interaction', 'relationship', 'emotion'])
    .order('created_at', { ascending: false })
    .limit(20);

  const personMemories = ((memories ?? []) as DbMemory[]).filter(m => {
    const c = m.content.toLowerCase();
    const n = name.toLowerCase();
    return c.includes(n) || JSON.stringify(m.metadata).toLowerCase().includes(n);
  });

  const personSignals = ((signals ?? []) as DbSignal[]).filter(s => {
    return JSON.stringify(s.payload).toLowerCase().includes(name.toLowerCase());
  });

  // Estado emocional: última memoria emocional relacionada
  const emotional = personMemories.find(m => m.layer === 'emotional');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#2a2d3e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#818cf8', fontSize: 26, fontWeight: 700,
        }}>
          {name[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>{name}</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Importancia: {Math.round(contact.importance * 100)}% ·{' '}
            Conocido desde {new Date(contact.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <BriefingButton personName={name} memoryId={contact.id} />
      </div>

      {/* Estado emocional */}
      {emotional && (
        <div style={{
          background: '#1a1d27',
          border: '1px solid #ec4899',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 28,
        }}>
          <p style={{ color: '#ec4899', fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estado emocional actual
          </p>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: 0 }}>{emotional.content}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Timeline de memorias */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
            Memorias ({personMemories.length})
          </h2>
          {personMemories.length === 0 ? (
            <div style={emptyCard}>
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Sin memorias asociadas a esta persona.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {personMemories.map(mem => (
                <div key={mem.id} style={{
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderLeft: `3px solid ${LAYER_COLORS[mem.layer] ?? '#475569'}`,
                  borderRadius: '0 10px 10px 0',
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: LAYER_COLORS[mem.layer] ?? '#475569',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {mem.layer}
                    </span>
                    <span style={{ color: '#334155', fontSize: 11, marginLeft: 'auto' }}>
                      {new Date(mem.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                    {mem.content.slice(0, 120)}{mem.content.length > 120 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Señales */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
            Señales ({personSignals.length})
          </h2>
          {personSignals.length === 0 ? (
            <div style={emptyCard}>
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Sin señales que mencionan esta persona.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personSignals.map(signal => {
                const payload = signal.payload as Record<string, unknown>;
                const summary = typeof payload['summary'] === 'string'
                  ? payload['summary']
                  : JSON.stringify(payload).slice(0, 80);
                return (
                  <div key={signal.id} style={{
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        background: '#2a2d3e', color: '#818cf8',
                        borderRadius: 4, padding: '1px 6px',
                      }}>
                        {signal.type}
                      </span>
                      <span style={{ color: '#334155', fontSize: 11, marginLeft: 'auto' }}>
                        {new Date(signal.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      {summary}{summary.length >= 80 ? '…' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const emptyCard: React.CSSProperties = {
  background: '#1a1d27',
  border: '1px dashed #2a2d3e',
  borderRadius: 10,
  padding: 20,
};
