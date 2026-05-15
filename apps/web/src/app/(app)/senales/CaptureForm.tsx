'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CaptureResult {
  signalType: string;
  opportunityScore: number;
  actionRecommendation: string;
}

export default function CaptureForm() {
  const router   = useRouter();
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<CaptureResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/signals/capture', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Error al capturar');
      }

      const data = await res.json() as CaptureResult;
      setResult(data);
      setText('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 14,
      padding: 20, marginBottom: 28,
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
        Capturar señal
      </h3>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Ej: "Vi en LinkedIn que María García fue promovida a Directora de Producto en Acme Corp."'
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 8,
            color: '#e2e8f0', fontSize: 13, padding: '10px 12px',
            resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#334155' }}>
            La IA extraerá tipo, persona y oportunidad automáticamente
          </span>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            style={{
              padding: '8px 20px', background: loading ? '#2a2d3e' : '#818cf8',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              opacity: !text.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Procesando…' : 'Capturar'}
          </button>
        </div>
      </form>

      {result && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: '#0d2818', border: '1px solid #166534', borderRadius: 8,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#34d399', fontWeight: 600 }}>
            Señal capturada · {LABELS[result.signalType] ?? result.signalType} · score {result.opportunityScore}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#86efac' }}>{result.actionRecommendation}</p>
        </div>
      )}

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>
      )}
    </div>
  );
}

const LABELS: Record<string, string> = {
  promotion:    'Promoción',
  job_change:   'Cambio de rol',
  travel:       'Viaje',
  birthday:     'Cumpleaños',
  publication:  'Publicación',
  life_event:   'Evento vital',
  health_event: 'Salud',
  achievement:  'Logro',
  loss:         'Pérdida',
};
