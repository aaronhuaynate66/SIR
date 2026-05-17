'use client';

import { useState } from 'react';
import Link from 'next/link';

type State = 'idle' | 'loading' | 'success' | 'already' | 'error';

const BENEFITS = [
  { icon: '🆓', title: 'Acceso gratis 3 meses',    desc: 'Sin tarjeta de crédito. Acceso completo a todas las features incluyendo Executive Mode.' },
  { icon: '🎯', title: 'Influir en el producto',   desc: 'Sesión mensual con el equipo para dar feedback directo. Tus ideas se implementan.' },
  { icon: '⭐', title: 'Badge de Beta Tester',     desc: 'Reconocimiento permanente en tu perfil y en el launch oficial de SIR.' },
  { icon: '💰', title: 'Precio early adopter 50%', desc: 'Cuando SIR salga, mantén el precio de early adopter para siempre.' },
];

export default function BetaPage() {
  const [form, setForm]   = useState({ name: '', email: '', role: '', company: '', linkedin_url: '', reason: '' });
  const [state, setState] = useState<State>('idle');

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setState('loading');
    try {
      const res  = await fetch('/api/beta', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json() as { already?: boolean; error?: string };
      if (!res.ok) { setState('error'); return; }
      setState(data.already ? 'already' : 'success');
    } catch {
      setState('error');
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>SIR</Link>
        <Link href="/#waitlist" style={s.navBtn}>Lista de espera</Link>
      </nav>

      <div style={s.content}>
        {/* Left — info */}
        <div style={s.left}>
          <div style={s.badge}>BETA PROGRAM</div>
          <h1 style={s.h1}>Sé parte de los<br /><span style={{ color: '#818cf8' }}>primeros usuarios</span><br />de SIR</h1>
          <p style={s.desc}>
            Buscamos 20 personas que construyen relaciones de alto impacto y quieren probar SIR antes del lanzamiento público.
          </p>

          <div style={s.benefits}>
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} style={s.benefit}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={s.benefitTitle}>{title}</p>
                  <p style={s.benefitDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={s.criteria}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>BUSCAMOS PERSONAS QUE:</p>
            {['Gestionan 50+ contactos profesionales activos', 'Asisten a eventos, conferencias o hacen networking regular', 'Tienen reuniones importantes donde el contexto importa', 'Quieren dar feedback real y honesto'].map(c => (
              <div key={c} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#34d399', fontSize: 14 }}>✓</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={s.right}>
          {(state === 'success' || state === 'already') ? (
            <div style={s.successBox}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
                {state === 'already' ? '¡Ya aplicaste!' : '¡Solicitud enviada!'}
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                {state === 'already'
                  ? 'Tu solicitud ya está registrada. Revisamos las aplicaciones semanalmente.'
                  : 'Revisamos tu solicitud esta semana. Si eres seleccionado recibirás un email con las instrucciones de acceso.'}
              </p>
              <Link href="/" style={{ color: '#818cf8', fontSize: 14, textDecoration: 'none' }}>← Volver al inicio</Link>
            </div>
          ) : (
            <form onSubmit={submit} style={s.form}>
              <h2 style={s.formTitle}>Aplicar al programa beta</h2>
              <p style={s.formSubtitle}>Plazas limitadas — respondemos en menos de 48h</p>

              <label style={s.label}>Nombre completo *</label>
              <input required style={s.input} value={form.name} onChange={update('name')} placeholder="Tu nombre" disabled={state === 'loading'} />

              <label style={s.label}>Email *</label>
              <input required type="email" style={s.input} value={form.email} onChange={update('email')} placeholder="tu@email.com" disabled={state === 'loading'} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Cargo</label>
                  <input style={s.input} value={form.role} onChange={update('role')} placeholder="CEO, Manager, VP..." disabled={state === 'loading'} />
                </div>
                <div>
                  <label style={s.label}>Empresa</label>
                  <input style={s.input} value={form.company} onChange={update('company')} placeholder="Tu empresa" disabled={state === 'loading'} />
                </div>
              </div>

              <label style={s.label}>LinkedIn (opcional)</label>
              <input style={s.input} value={form.linkedin_url} onChange={update('linkedin_url')} placeholder="linkedin.com/in/tuperfil" disabled={state === 'loading'} />

              <label style={s.label}>¿Por qué quieres acceso a SIR?</label>
              <textarea
                style={{ ...s.input, height: 100, resize: 'vertical' as const }}
                value={form.reason}
                onChange={update('reason')}
                placeholder="Cuéntanos sobre las relaciones que gestionas y por qué SIR te sería útil..."
                disabled={state === 'loading'}
              />

              {state === 'error' && (
                <p style={{ color: '#f87171', fontSize: 13, margin: '4px 0' }}>Algo salió mal. Intenta de nuevo.</p>
              )}

              <button type="submit" style={s.submitBtn} disabled={state === 'loading'}>
                {state === 'loading' ? 'Enviando…' : 'Enviar solicitud →'}
              </button>

              <p style={{ fontSize: 12, color: '#374151', textAlign: 'center', marginTop: 12 }}>
                No spam. Solo te contactamos si eres seleccionado.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:         { background: '#0f1117', color: '#e2e8f0', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  nav:          { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid #1a1d27' },
  logo:         { fontSize: 22, fontWeight: 800, color: '#818cf8', textDecoration: 'none' },
  navBtn:       { padding: '8px 16px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, border: '1px solid #2a2d3e', borderRadius: 8 },
  content:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, maxWidth: 1100, margin: '0 auto', padding: '60px 48px' },
  left:         {},
  right:        {},
  badge:        { display: 'inline-block', background: '#818cf822', border: '1px solid #818cf844', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: '#818cf8', fontWeight: 700, marginBottom: 20, letterSpacing: '0.06em' },
  h1:           { fontSize: 42, fontWeight: 900, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-1px' },
  desc:         { fontSize: 16, color: '#64748b', lineHeight: 1.7, margin: '0 0 36px' },
  benefits:     { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 },
  benefit:      { display: 'flex', gap: 14, alignItems: 'flex-start' },
  benefitTitle: { fontWeight: 600, fontSize: 14, color: '#e2e8f0', margin: '0 0 3px' },
  benefitDesc:  { fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 },
  criteria:     { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 12, padding: '20px' },
  form:         { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 12 },
  formTitle:    { fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0 },
  formSubtitle: { fontSize: 13, color: '#64748b', margin: '4px 0 8px' },
  label:        { fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: -4 },
  input:        { background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '10px 12px', outline: 'none', width: '100%', fontFamily: 'inherit' },
  submitBtn:    { background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: '12px', marginTop: 4 },
  successBox:   { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16, padding: '48px 32px', textAlign: 'center' },
};
