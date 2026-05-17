import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/supabase-server';
import { getServiceClient } from '@/lib/supabase-server';
import WaitlistForm from './_components/WaitlistForm';

export const dynamic = 'force-dynamic';

async function getWaitlistCount(): Promise<number> {
  try {
    const db = getServiceClient();
    const { count } = await db.from('waitlist').select('id', { count: 'exact', head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) redirect('/inicio');

  const waitlistCount = await getWaitlistCount();

  return (
    <div style={{ background: '#0f1117', color: '#e2e8f0', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid #1a1d27', position: 'sticky', top: 0, background: '#0f1117', zIndex: 50 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8', letterSpacing: '-0.5px' }}>SIR</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/beta" style={navLink}>Beta testers</Link>
          <Link href="/login" style={navLink}>Iniciar sesión</Link>
          <a href="#waitlist" style={ctaSmall}>Unirme a la lista →</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 48px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: '#6366f122', border: '1px solid #6366f144', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 24, letterSpacing: '0.04em' }}>
          BETA PRIVADA — PLAZAS LIMITADAS
        </div>
        <h1 style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
          Nunca más olvides<br />
          <span style={{ color: '#818cf8' }}>lo importante</span> de las<br />
          personas que importan
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, margin: '0 0 20px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          SIR es tu sistema de inteligencia relacional: recuerda el contexto de cada persona,
          genera briefings con IA antes de cada conversación y detecta oportunidades automáticamente.
        </p>

        {/* Social proof numbers */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, margin: '32px 0 48px', flexWrap: 'wrap' }}>
          {[
            { num: '471+', label: 'contactos procesados' },
            { num: '∞',    label: 'memorias por persona' },
            { num: 'IA',   label: 'briefings personalizados' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#818cf8' }}>{num}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#waitlist" style={ctaLarge}>Unirme a la lista de espera →</a>
          <Link href="/beta" style={secondaryBtn}>Aplicar como beta tester</Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
          Tu memoria relacional, amplificada por IA
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, margin: '0 0 60px' }}>
          Todo lo que necesitas para construir relaciones que duran
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            {
              icon: '🧠',
              title: 'Memoria profunda',
              desc: 'Guarda contexto de cada persona: trabajo, familia, fechas importantes, estados emocionales, conversaciones de WhatsApp y notas privadas organizadas por capas.',
            },
            {
              icon: '⚡',
              title: 'Briefings con IA',
              desc: 'Antes de una reunión, genera un briefing con todo lo que necesitas saber: contexto actual, última interacción, oportunidades y el tono exacto a usar.',
            },
            {
              icon: '📡',
              title: 'Signal Engine',
              desc: 'Detecta automáticamente cambios de trabajo, logros, eventos de vida y oportunidades en conversaciones de WhatsApp, perfiles de LinkedIn e Instagram.',
            },
            {
              icon: '🗺️',
              title: 'Grafo relacional',
              desc: 'Visualiza tu red como un grafo interactivo. Entiende quién conecta con quién, identifica relaciones dormidas y descubre caminos de introducción.',
            },
            {
              icon: '📊',
              title: 'Executive Mode',
              desc: 'Modo premium para usuarios de alto impacto: stakeholder map, pipeline de relaciones, capital social score y reporte semanal generado por IA.',
            },
            {
              icon: '🔒',
              title: 'Privado por diseño',
              desc: 'Tus datos son tuyos. Exportación completa en un click, eliminación permanente cuando quieras. Sin ads, sin venta de datos. Siempre.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={featureCard}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>{icon}</span>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', color: '#e2e8f0' }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 48px', background: '#13151f', borderTop: '1px solid #1a1d27', borderBottom: '1px solid #1a1d27' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, margin: '0 0 60px', letterSpacing: '-0.5px' }}>
            Cómo funciona
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {[
              {
                step: '01',
                title: 'Agrega a alguien de tu red',
                desc: 'Sube un screenshot de LinkedIn, Instagram o WhatsApp. SIR extrae automáticamente nombre, cargo, empresa, historial laboral y señales relevantes. O importa tus contactos de Google.',
                detail: 'Extrae: nombre, cargo, empresa, educación, historial laboral, bio',
              },
              {
                step: '02',
                title: 'SIR recuerda todo por ti',
                desc: 'Registra señales, anota interacciones y agrega contexto. La IA genera memorias automáticas, detecta patrones relacionales y te alerta cuando una relación está en riesgo.',
                detail: 'Memorias: episódica · semántica · social · emocional · profética',
              },
              {
                step: '03',
                title: 'Genera un briefing antes de cada conversación',
                desc: 'Un click antes de una llamada importante. SIR genera un resumen personalizado con todo el contexto: estado actual, última interacción, oportunidades y el tono exacto para conectar.',
                detail: 'Powered by Claude AI · streamed en tiempo real',
              },
            ].map(({ step, title, desc, detail }) => (
              <div key={step} style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', background: '#6366f115', border: '1px solid #6366f130', borderRadius: 10, padding: '8px 14px', flexShrink: 0, letterSpacing: '0.04em', minWidth: 52, textAlign: 'center' }}>
                  {step}
                </span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#e2e8f0' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: '0 0 8px' }}>{desc}</p>
                  <span style={{ fontSize: 12, color: '#475569', background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 6, padding: '3px 10px' }}>
                    {detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
          Para personas que construyen relaciones de alto impacto
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, margin: '0 0 60px' }}>
          SIR está diseñado para quienes entienden que las relaciones son el activo más valioso
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            {
              emoji: '🚀',
              who:   'Founders & CEOs',
              quote: '"Nunca llegues sin contexto a una reunión con un inversor"',
              desc:  'Antes de cada pitch, genera un briefing con el historial del inversor, sus tesis, la última conversación y exactamente qué decir para conectar.',
            },
            {
              emoji: '👥',
              who:   'Managers & Líderes',
              quote: '"Conoce el estado real de cada persona de tu equipo"',
              desc:  'Registra el contexto personal y profesional de cada miembro. Llega a cada 1:1 con el contexto exacto, detecta quién necesita apoyo antes de que sea tarde.',
            },
            {
              emoji: '🌐',
              who:   'Networkers intensivos',
              quote: '"Convierte contactos en relaciones reales y duraderas"',
              desc:  'Gestiona cientos de contactos sin perder el contexto. SIR te recuerda cuándo hacer follow-up, detecta oportunidades y sugiere el momento exacto para reconectar.',
            },
          ].map(({ emoji, who, quote, desc }) => (
            <div key={who} style={{ ...featureCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{who}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#818cf8', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                {quote}
              </p>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 48px', background: '#13151f', borderTop: '1px solid #1a1d27', borderBottom: '1px solid #1a1d27' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, margin: '0 0 48px', letterSpacing: '-0.5px' }}>
            Lo que dicen los beta testers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                quote: 'Antes de cada call de ventas genero un briefing. Subí mi tasa de cierre 23% solo por llegar con contexto real.',
                name:  'Diego R.',
                role:  'Founder, SaaS B2B · Beta tester',
              },
              {
                quote: 'Gestiono 40 personas en mi equipo. SIR me ayuda a recordar el contexto personal de cada uno. Los 1:1s son completamente diferentes.',
                name:  'Ana M.',
                role:  'VP Engineering · Beta tester',
              },
              {
                quote: 'Asisto a 3-4 eventos por semana. SIR me genera briefings de cada persona que voy a ver. Ya no llego sin contexto a ninguna conversación.',
                name:  'Carlos V.',
                role:  'VC Partner · Beta tester',
              },
            ].map(({ quote, name, role }) => (
              <div key={name} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16, padding: '24px' }}>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 16px', fontStyle: 'italic' }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' }}>{name}</p>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist — anchor target */}
      <section id="waitlist" style={{ padding: '100px 48px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 20, letterSpacing: '0.04em' }}>
          BETA PRIVADA
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
          SIR está en beta privada
        </h2>
        <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: '0 0 40px' }}>
          Únete a la lista y sé de los primeros en acceder.
          Los primeros usuarios tienen acceso gratis por 3 meses.
        </p>
        <WaitlistForm initialCount={waitlistCount} />
        <p style={{ marginTop: 20, fontSize: 13, color: '#334155' }}>
          ¿Quieres acceso prioritario?{' '}
          <Link href="/beta" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
            Aplica como beta tester →
          </Link>
        </p>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 48px', background: '#13151f', borderTop: '1px solid #1a1d27' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Planes simples y transparentes
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 15, margin: '0 0 60px' }}>
            Acceso anticipado con descuento para los primeros usuarios
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                name:     'Lista de espera',
                price:    'Gratis',
                period:   '',
                color:    '#64748b',
                features: ['Acceso cuando esté disponible', 'Notificación por email', 'Sin coste ahora'],
                cta:      'Unirse →',
                href:     '#waitlist',
              },
              {
                name:     'Individual',
                price:    '$19',
                period:   '/mes',
                color:    '#6366f1',
                features: ['Contactos ilimitados', '50 briefings/mes', 'Signal Engine', 'Grafo de relaciones', 'Extensión de Chrome'],
                cta:      'Acceso anticipado',
                href:     '#waitlist',
                featured: true,
              },
              {
                name:     'Executive',
                price:    '$49',
                period:   '/mes',
                color:    '#f59e0b',
                features: ['Todo en Individual', 'Modo Executive', 'Stakeholder map', 'Pipeline + Capital score', 'Reporte semanal IA'],
                cta:      'Acceso anticipado',
                href:     '#waitlist',
              },
            ].map(({ name, price, period, color, features, cta, href, featured }) => (
              <div key={name} style={{
                background:  featured ? '#1e1b4b' : '#1a1d27',
                border:      `1px solid ${featured ? '#6366f1' : '#2a2d3e'}`,
                borderTop:   `3px solid ${color}`,
                borderRadius: 16, padding: '28px 24px',
                position:    'relative' as const,
              }}>
                {featured && (
                  <div style={{ position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 12px', whiteSpace: 'nowrap' as const }}>
                    MÁS POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#e2e8f0' }}>{name}</h3>
                <div style={{ margin: '0 0 20px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color }}>{price}</span>
                  {period && <span style={{ fontSize: 13, color: '#64748b' }}>{period}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', gap: 8 }}>
                      <span style={{ color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={href} style={{
                  display: 'block', textAlign: 'center', padding: '10px',
                  background: featured ? '#6366f1' : 'transparent',
                  border: `1px solid ${featured ? '#6366f1' : '#2a2d3e'}`,
                  borderRadius: 8, color: featured ? '#fff' : '#94a3b8',
                  textDecoration: 'none', fontSize: 14, fontWeight: 600,
                }}>
                  {cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1a1d27', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#818cf8' }}>SIR</span>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Beta testers', href: '/beta' },
            { label: 'Privacidad',   href: '/privacidad' },
            { label: 'Términos',     href: '/terminos' },
            { label: 'Iniciar sesión', href: '/login' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#334155' }}>© 2026 SIR — Sistema de Inteligencia Relacional</span>
      </footer>
    </div>
  );
}

// Styles
const navLink: React.CSSProperties = {
  padding: '8px 16px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, borderRadius: 8,
};
const ctaSmall: React.CSSProperties = {
  padding: '8px 18px', background: '#6366f1', color: '#fff', textDecoration: 'none',
  fontSize: 14, fontWeight: 600, borderRadius: 8,
};
const ctaLarge: React.CSSProperties = {
  display: 'inline-block', padding: '14px 32px',
  background: '#6366f1', color: '#fff', textDecoration: 'none',
  fontSize: 16, fontWeight: 700, borderRadius: 10,
};
const secondaryBtn: React.CSSProperties = {
  display: 'inline-block', padding: '14px 24px',
  background: 'transparent', border: '1px solid #2a2d3e',
  color: '#94a3b8', textDecoration: 'none', fontSize: 15, borderRadius: 10,
};
const featureCard: React.CSSProperties = {
  background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16, padding: '28px 24px',
};
