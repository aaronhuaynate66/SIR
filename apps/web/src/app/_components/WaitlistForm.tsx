'use client';

import { useState } from 'react';

type State = 'idle' | 'loading' | 'success' | 'already' | 'error';

export default function WaitlistForm({ initialCount }: { initialCount: number }) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [state, setState]     = useState<State>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [count, setCount]     = useState(initialCount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), name: name.trim(), source: 'landing' }),
      });
      const data = await res.json() as { position?: number; already?: boolean; error?: string };
      if (!res.ok) { setState('error'); return; }
      setPosition(data.position ?? null);
      setState(data.already ? 'already' : 'success');
      if (!data.already) setCount(c => c + 1);
    } catch {
      setState('error');
    }
  }

  if (state === 'success' || state === 'already') {
    return (
      <div style={s.successBox}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0', marginBottom: 6 }}>
          {state === 'already' ? '¡Ya estás en la lista!' : '¡Listo! Estás en la lista'}
        </p>
        {position && (
          <p style={{ color: '#818cf8', fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
            Posición #{position}
          </p>
        )}
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Te avisaremos cuando tu acceso esté disponible.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} style={s.form}>
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={s.input}
          disabled={state === 'loading'}
        />
        <div style={s.row}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ ...s.input, flex: 1, marginTop: 0 }}
            disabled={state === 'loading'}
          />
          <button type="submit" style={s.btn} disabled={state === 'loading'}>
            {state === 'loading' ? '…' : 'Quiero acceso →'}
          </button>
        </div>
        {state === 'error' && (
          <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>
            Algo salió mal. Intenta de nuevo.
          </p>
        )}
      </form>
      <p style={s.count}>
        <span style={{ color: '#818cf8', fontWeight: 700 }}>{count.toLocaleString()}</span>
        {' '}personas en lista de espera
      </p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 460, margin: '0 auto' },
  row:  { display: 'flex', gap: 8 },
  input: {
    background:   '#1a1d27',
    border:       '1px solid #2a2d3e',
    borderRadius: 8,
    color:        '#e2e8f0',
    fontSize:     15,
    padding:      '11px 14px',
    outline:      'none',
    width:        '100%',
  },
  btn: {
    background:   '#6366f1',
    border:       'none',
    borderRadius: 8,
    color:        '#fff',
    cursor:       'pointer',
    fontSize:     14,
    fontWeight:   700,
    padding:      '11px 20px',
    whiteSpace:   'nowrap',
    flexShrink:   0,
  },
  successBox: {
    background:   '#1a1d27',
    border:       '1px solid #6366f130',
    borderRadius: 12,
    padding:      '24px',
    textAlign:    'center',
    maxWidth:     360,
    margin:       '0 auto',
  },
  count: {
    fontSize: 13,
    color:    '#475569',
    textAlign: 'center',
    marginTop: 10,
  },
};
