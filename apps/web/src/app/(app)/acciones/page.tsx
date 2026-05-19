import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import { generateDailyActions, type ActionWithPerson } from './generate';
import ActionsClient from './ActionsClient';

export const dynamic = 'force-dynamic';

export default async function AccionesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  let actions: ActionWithPerson[] = [];
  try {
    actions = await generateDailyActions(user.id);
  } catch (err) {
    console.error('[AccionesPage] generateDailyActions error:', err);
  }

  console.log('[PAGE] Actions received:', actions.length,
    JSON.stringify(actions.map(a => ({ id: a.id, status: a.status, urgency: a.urgency }))));

  const pending   = actions.filter(a => a.status === 'pending');
  const completed = actions.filter(a => a.status === 'completed');

  console.log('[PAGE] Pending:', pending.length, 'Completed:', completed.length);

  const highCount = pending.filter(a => a.urgency === 'high').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            Acciones inteligentes
          </h1>
          {highCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
              background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444',
            }}>
              {highCount} urgente{highCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          {pending.length > 0
            ? `${pending.length} acción${pending.length !== 1 ? 'es' : ''} recomendada${pending.length !== 1 ? 's' : ''} para hoy · basadas en tu red real`
            : 'Acciones generadas diariamente según tu actividad relacional'}
        </p>
      </div>

      {/* Info strip */}
      <div style={{
        display: 'flex', gap: 20, padding: '10px 16px',
        background: '#13151f', border: '1px solid #1e2130',
        borderRadius: 10, marginBottom: 20,
      }}>
        {[
          { label: 'Pendientes', value: pending.length,   color: '#818cf8' },
          { label: 'Completadas', value: completed.length, color: '#22c55e' },
          { label: 'Urgentes',    value: highCount,         color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>{label}</p>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#334155', maxWidth: 180, textAlign: 'right', lineHeight: 1.4 }}>
            Máx. 5 acciones/día · Se actualizan a medianoche
          </p>
        </div>
      </div>

      <ActionsClient initialPending={pending} initialCompleted={completed} />
    </div>
  );
}
