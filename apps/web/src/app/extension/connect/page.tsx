'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type ConnectState = 'loading' | 'unauthenticated' | 'ready' | 'copying' | 'connected' | 'error';

export default function ExtensionConnectPage() {
  const [state, setState]   = useState<ConnectState>('loading');
  const [token, setToken]   = useState<string | null>(null);
  const [email, setEmail]   = useState('');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    );
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null;
      if (!t) { setState('unauthenticated'); return; }
      setToken(t);
      setEmail(data.session?.user?.email ?? '');
      setState('ready');

      // Attempt automatic connection via content script bridge
      window.dispatchEvent(new CustomEvent('sir-connect-token', { detail: { token: t } }));
    });

    // Listen for confirmation from connect_bridge.js
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.ok) setState('connected');
    };
    window.addEventListener('sir-connect-result', handler);
    return () => window.removeEventListener('sir-connect-result', handler);
  }, []);

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setState('copying');
      setTimeout(() => setState('ready'), 2500);
    } catch {
      setState('error');
    }
  }

  if (state === 'loading') {
    return (
      <div style={s.page}>
        <p style={s.muted}>Cargando…</p>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div style={s.page}>
        <Logo />
        <h1 style={s.h1}>Conectar extensión</h1>
        <p style={s.muted}>Debes iniciar sesión en SIR para conectar la extensión.</p>
        <a href="/login" style={s.btnPrimary}>Iniciar sesión →</a>
      </div>
    );
  }

  if (state === 'connected') {
    return (
      <div style={s.page}>
        <Logo />
        <h1 style={s.h1}>¡Extensión conectada! ✓</h1>
        <p style={s.muted}>
          Ya puedes cerrar esta pestaña. La extensión capturará perfiles de LinkedIn e Instagram automáticamente.
        </p>
        <div style={s.successCard}>
          <span style={{ fontSize: 32 }}>🧠</span>
          <p style={{ fontWeight: 600, color: '#34d399' }}>Conectado como {email}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Logo />
      <h1 style={s.h1}>Conectar extensión SIR</h1>
      <p style={s.muted}>Conectado como <strong>{email}</strong></p>

      {/* Auto connect notice */}
      <div style={s.infoCard}>
        <p style={{ fontSize: 13, color: '#93c5fd', marginBottom: 8, fontWeight: 600 }}>
          🔄 Conexión automática en progreso…
        </p>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Si la extensión está instalada, se conectará automáticamente.
          Si no ocurre en 5 segundos, usa el token manual abajo.
        </p>
      </div>

      {/* Manual token */}
      <div style={s.tokenCard}>
        <p style={s.label}>Token de conexión manual</p>
        <div style={s.tokenBox}>
          <code style={s.tokenCode}>{token?.slice(0, 48)}…</code>
        </div>
        <button onClick={copyToken} style={s.btnPrimary}>
          {state === 'copying' ? '✓ Copiado al portapapeles' : 'Copiar token completo'}
        </button>
      </div>

      {/* Instructions */}
      <div style={s.steps}>
        <p style={s.stepsTitle}>Conexión manual:</p>
        <ol style={{ paddingLeft: 20, color: '#9ca3af', lineHeight: 2, fontSize: 13 }}>
          <li>Copia el token</li>
          <li>Abre el popup de la extensión SIR en Chrome</li>
          <li>Pega el token en el campo "O pega tu token aquí"</li>
          <li>Haz clic en <strong style={{ color: '#fff' }}>OK</strong></li>
        </ol>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      <span style={{ fontSize: 36 }}>🧠</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#a78bfa' }}>SIR</div>
        <div style={{ fontSize: 12, color: '#4b5563' }}>Relationship Intelligence</div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth:   480,
    margin:     '60px auto',
    padding:    '0 24px 60px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color:      '#e5e7eb',
    background: '#0f0f1a',
    minHeight:  '100vh',
  },
  h1: {
    fontSize:     24,
    fontWeight:   700,
    marginBottom: 8,
  },
  muted: {
    color:        '#9ca3af',
    fontSize:     14,
    marginBottom: 24,
    lineHeight:   1.6,
  },
  infoCard: {
    background:   '#1e3a5f',
    border:       '1px solid #1d4ed8',
    borderRadius: 10,
    padding:      16,
    marginBottom: 20,
  },
  tokenCard: {
    background:   '#1a1a2e',
    border:       '1px solid #2d2d44',
    borderRadius: 12,
    padding:      20,
    marginBottom: 20,
  },
  label: {
    fontSize:     11,
    fontWeight:   700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color:        '#4b5563',
    marginBottom: 10,
  },
  tokenBox: {
    background:   '#0a0a14',
    border:       '1px solid #2d2d44',
    borderRadius: 8,
    padding:      '12px 14px',
    marginBottom: 14,
    overflowX:    'auto',
  },
  tokenCode: {
    color:       '#34d399',
    fontSize:    12,
    wordBreak:   'break-all' as const,
    fontFamily:  '"Fira Code", "Courier New", monospace',
  },
  btnPrimary: {
    display:      'inline-block',
    background:   '#6c63ff',
    color:        '#fff',
    padding:      '10px 20px',
    borderRadius: 8,
    border:       'none',
    cursor:       'pointer',
    fontWeight:   600,
    fontSize:     14,
    textDecoration: 'none',
  },
  successCard: {
    display:      'flex',
    alignItems:   'center',
    gap:          16,
    background:   '#064e3b',
    border:       '1px solid #065f46',
    borderRadius: 12,
    padding:      20,
    marginTop:    24,
  },
  steps: {
    background:   '#111827',
    border:       '1px solid #1f2937',
    borderRadius: 10,
    padding:      16,
  },
  stepsTitle: {
    fontWeight:   600,
    fontSize:     13,
    color:        '#d1d5db',
    marginBottom: 8,
  },
};
