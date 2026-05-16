import Link from 'next/link';

export default function BienvenidaPage() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' }}>
        Bienvenido a SIR
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 36px' }}>
        Tu sistema de inteligencia relacional
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40, textAlign: 'left' }}>
        {[
          { icon: '🧠', title: 'Recuerda todo', desc: 'Guarda contexto de personas importantes en tu vida profesional y personal.' },
          { icon: '💡', title: 'Briefings inteligentes', desc: 'Genera resúmenes antes de cada conversación con información actualizada.' },
          { icon: '📡', title: 'Detecta oportunidades', desc: 'Identifica señales y momentos clave para fortalecer tus relaciones.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: 'flex', gap: 14, padding: '14px 16px',
            background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 12,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{title}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/onboarding/primera-persona" style={{
        display: 'inline-block',
        padding: '12px 32px',
        background: '#6366f1',
        color: '#fff',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.01em',
      }}>
        Empezar →
      </Link>
    </div>
  );
}
