'use client';

import { useState, useCallback } from 'react';
import ActionCard from './ActionCard';
import type { ActionWithPerson } from './generate';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? '#6366f1'; }
function initials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase(); }

interface Props {
  initialPending:   ActionWithPerson[];
  initialCompleted: ActionWithPerson[];
}

export default function ActionsClient({ initialPending, initialCompleted }: Props) {
  console.log('[CLIENT] Received props — pending:', initialPending.length, 'completed:', initialCompleted.length);
  const [pending,   setPending]   = useState<ActionWithPerson[]>(initialPending);
  const [completed, setCompleted] = useState<ActionWithPerson[]>(initialCompleted);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Diagnostic: confirm state matches props on every render
  console.log('[CLIENT] pending state length:', pending.length, '— hasPending will be:', pending.length > 0);

  const handleComplete = useCallback((id: string, _personId: string) => {
    const action = pending.find(a => a.id === id);
    if (!action) return;
    setPending(p   => p.filter(a => a.id !== id));
    setCompleted(c => [{ ...action, status: 'completed' as const }, ...c]);
  }, [pending]);

  const handlePostpone = useCallback((id: string) => {
    setPending(p => p.filter(a => a.id !== id));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setPending(p => p.filter(a => a.id !== id));
  }, []);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setFetchError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const res  = await fetch('/api/actions/suggest', { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { actions?: ActionWithPerson[] };
      if (data.actions) {
        const newPending = data.actions.filter(a => a.status === 'pending');
        setPending(newPending);
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setFetchError(isAbort ? 'Tiempo agotado. Intenta de nuevo.' : 'Error al generar. Intenta de nuevo.');
    } finally {
      clearTimeout(timeout);
      setRefreshing(false);
    }
  }

  const hasPending  = pending.length > 0;
  const hasCompleted = completed.length > 0;

  return (
    <div>
      {/* Pending actions */}
      {hasPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {pending.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              onComplete={handleComplete}
              onPostpone={handlePostpone}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: '#1a1d27', border: '1px dashed #2a2d3e',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>⚡</div>
          <p style={{ color: '#475569', fontSize: 15, margin: '0 0 6px' }}>
            No hay acciones pendientes por ahora.
          </p>
          <p style={{ color: '#334155', fontSize: 13, margin: '0 0 20px' }}>
            Las acciones se generan diariamente basadas en tu actividad relacional.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '8px 20px', background: '#6366f1', border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing ? 'Generando…' : 'Generar nuevas acciones'}
          </button>
          {fetchError && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#ef4444' }}>{fetchError}</p>
          )}
        </div>
      )}

      {/* Completed today */}
      {hasCompleted && (
        <div>
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: '#334155',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 12px',
          }}>
            Completadas hoy · {completed.length}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completed.map(action => (
              <div
                key={action.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: '#13151f', border: '1px solid #1e2130',
                  borderLeft: '4px solid #22c55e40',
                  borderRadius: '0 8px 8px 0', opacity: 0.7,
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: avatarColor(action.person_name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                }}>
                  {initials(action.person_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action.action_text}
                  </p>
                </div>
                <span style={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
