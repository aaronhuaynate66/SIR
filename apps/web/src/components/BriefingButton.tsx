'use client';

import { useState } from 'react';

interface Props {
  personName: string;
  memoryId: string;
}

export default function BriefingButton({ personName, memoryId }: Props) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function generate() {
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personName, memoryId }),
      });
      const json = await res.json() as { briefing?: string; error?: string };
      setBriefing(json.briefing ?? json.error ?? 'Sin respuesta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={generate} disabled={loading} style={{
        padding: '10px 18px',
        background: '#6366f1',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Generando…' : '✦ Briefing IA'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                Briefing — {personName}
              </h3>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18,
              }}>✕</button>
            </div>
            {loading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Generando con IA…</p>
            ) : (
              <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {briefing}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
