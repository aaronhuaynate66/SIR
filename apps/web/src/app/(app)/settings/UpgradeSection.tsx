'use client';

import { useState } from 'react';

const FEATURES = [
  'Grafo de relaciones ilimitado',
  'Briefing ejecutivo semanal',
  'Análisis de señales avanzado',
  'Exportación de datos completa',
];

export default function UpgradeSection({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isPro) {
    return (
      <div style={{ marginTop: 24, background: '#0f2d1f', border: '1px solid #166534', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>✓ SIR Pro activo</span>
          <p style={{ color: '#6ee7b7', fontSize: 12, margin: '2px 0 0' }}>Todas las funciones desbloqueadas</p>
        </div>
        <button
          onClick={handlePortal}
          disabled={loading}
          style={{ background: 'transparent', border: '1px solid #166534', color: '#34d399', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          {loading ? '…' : 'Gestionar plan'}
        </button>
      </div>
    );
  }

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) { window.location.href = json.url; return; }
      setError(json.error ?? 'Error al iniciar el pago');
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const json = await res.json() as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 24, background: '#1a1d27', border: '1px solid #312e81', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, margin: 0 }}>SIR Pro</p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>$9.99 / mes</p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{ background: '#6366f1', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '…' : 'Actualizar a Pro'}
        </button>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {FEATURES.map((f) => (
          <li key={f} style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>✦ {f}</li>
        ))}
      </ul>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
