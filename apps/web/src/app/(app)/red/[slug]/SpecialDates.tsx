'use client';

import { useState, useEffect } from 'react';

interface DateEntry {
  id:        string;
  label:     string;
  date:      string;
  recurring: boolean;
  notes:     string | null;
}

interface Props {
  personId: string;
}

function daysUntil(dateStr: string, recurring: boolean): number {
  const d = new Date(dateStr + 'T00:00:00');
  if (!recurring) {
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  }
  let next = new Date(new Date().getFullYear(), d.getMonth(), d.getDate());
  if (next.getTime() < Date.now() - 86_400_000)
    next = new Date(next.getFullYear() + 1, d.getMonth(), d.getDate());
  return Math.ceil((next.getTime() - Date.now()) / 86_400_000);
}

export default function SpecialDates({ personId }: Props) {
  const [dates,      setDates]      = useState<DateEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [label,      setLabel]      = useState('');
  const [date,       setDate]       = useState('');
  const [recurring,  setRecurring]  = useState(true);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [errMsg,     setErrMsg]     = useState('');

  useEffect(() => {
    fetch(`/api/people/${personId}/dates`)
      .then(r => r.json() as Promise<DateEntry[]>)
      .then(setDates)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [personId]);

  async function handleAdd() {
    if (!label.trim() || !date) { setErrMsg('Etiqueta y fecha requeridas'); return; }
    setSaving(true);
    setErrMsg('');
    try {
      const res  = await fetch(`/api/people/${personId}/dates`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ label, date, recurring, notes: notes || null }),
      });
      const data = await res.json() as DateEntry & { error?: string };
      if (!res.ok) { setErrMsg(data.error ?? 'Error al guardar'); return; }
      setDates(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setLabel(''); setDate(''); setNotes(''); setRecurring(true);
      setShowModal(false);
    } catch {
      setErrMsg('Error de red');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDates(prev => prev.filter(d => d.id !== id));
    await fetch(`/api/people/${personId}/dates`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>FECHAS ESPECIALES</h3>
        <button
          onClick={() => { setShowModal(true); setErrMsg(''); }}
          style={{
            padding: '4px 10px', background: '#6366f133', color: '#818cf8',
            border: '1px solid #6366f133', borderRadius: 6, fontSize: 11,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Añadir
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#334155', fontSize: 13 }}>Cargando…</p>
      ) : dates.length === 0 ? (
        <p style={{ color: '#334155', fontSize: 13 }}>Sin fechas especiales registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dates.map(d => {
            const days = daysUntil(d.date, d.recurring);
            const urgent = days >= 0 && days <= 14;
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#13151f', borderRadius: 8, padding: '8px 12px',
                border: urgent ? '1px solid #818cf833' : '1px solid transparent',
              }}>
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: 13, margin: '0 0 1px', fontWeight: 500 }}>{d.label}</p>
                  <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                    {d.recurring ? ' (anual)' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: days === 0 ? '#86efac' : days > 0 && days <= 7 ? '#fbbf24' : '#64748b',
                  }}>
                    {days === 0 ? '¡Hoy!' : days > 0 ? `en ${days}d` : `hace ${Math.abs(days)}d`}
                  </span>
                  <button
                    onClick={() => void handleDelete(d.id)}
                    style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3e',
            borderRadius: 14, padding: 24, width: 360, maxWidth: '90vw',
          }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 16px', fontSize: 16 }}>Añadir fecha especial</h3>

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Etiqueta</label>
            <input
              type="text"
              placeholder="Ej: Cuando nos conocimos"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 6, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 }}
            />

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 6, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
              Recordar cada año
            </label>

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 6, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' as const, resize: 'none', marginBottom: 14 }}
            />

            {errMsg && <p style={{ color: '#fca5a5', fontSize: 12, marginBottom: 10 }}>{errMsg}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => void handleAdd()}
                disabled={saving}
                style={{ flex: 1, padding: '9px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #2a2d3e', color: '#64748b', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
