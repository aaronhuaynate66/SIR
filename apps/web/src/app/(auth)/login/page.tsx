'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={card}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', margin: '0 0 24px' }}>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={field}>
          <label style={label}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={input}
            placeholder="tu@correo.com"
          />
        </div>
        <div style={field}>
          <label style={label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={input}
            placeholder="••••••••"
          />
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</p>}
        <button type="submit" disabled={loading} style={btn(loading)}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
        ¿No tienes cuenta?{' '}
        <Link href="/signup" style={{ color: '#818cf8', textDecoration: 'none' }}>Regístrate</Link>
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#1a1d27',
  borderRadius: 16,
  padding: 32,
  border: '1px solid #2a2d3e',
};
const field: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 };
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  background: '#0f1117',
  border: '1px solid #2a2d3e',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
};
const btn = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '11px',
  background: disabled ? '#3730a3' : '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
});
