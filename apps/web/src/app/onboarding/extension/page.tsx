import Link from 'next/link';

interface Props {
  searchParams: { added?: string };
}

export default function ExtensionPage({ searchParams }: Props) {
  const added = searchParams.added === '1';
  const nextHref = `/onboarding/listo?added=${added ? '1' : '0'}&extension=1`;
  const skipHref = `/onboarding/listo?added=${added ? '1' : '0'}&extension=0`;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>
        Instala la extensión
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        Captura perfiles de LinkedIn e Instagram en un clic, directo a tu red
      </p>

      {/* What it does */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { icon: '🔍', text: 'Detecta perfiles al navegar LinkedIn e Instagram' },
          { icon: '⚡', text: 'Importa nombre, cargo, empresa y foto en segundos' },
          { icon: '🔔', text: 'Te avisa cuando un contacto publica algo relevante' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '10px 14px', background: '#13151f',
            border: '1px solid #2a2d3e', borderRadius: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Install steps */}
      <div style={{
        background: '#13151f', border: '1px solid #2a2d3e',
        borderRadius: 12, padding: '16px 18px', marginBottom: 24,
      }}>
        <p style={{
          margin: '0 0 12px', fontSize: 12, fontWeight: 700,
          color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Instalación — Modo desarrollador
        </p>
        {[
          'Descarga el ZIP y descomprímelo en una carpeta',
          'Abre Chrome → chrome://extensions → activa "Modo desarrollador"',
          'Haz clic en "Cargar descomprimida" y selecciona la carpeta',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#6366f133',
              color: '#818cf8', fontSize: 12, fontWeight: 700, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Download button */}
      <a
        href="/api/download/extension"
        download="sir-extension.zip"
        style={{
          display: 'block', textAlign: 'center',
          padding: '12px', background: '#1e2130',
          border: '1px solid #6366f144', borderRadius: 10,
          color: '#818cf8', fontSize: 14, fontWeight: 600,
          textDecoration: 'none', marginBottom: 12,
        }}
      >
        ⬇ Descargar extensión (.zip)
      </a>

      {/* Main CTA */}
      <Link
        href={nextHref}
        style={{
          display: 'block', textAlign: 'center',
          padding: '13px', background: '#6366f1',
          color: '#fff', borderRadius: 10, textDecoration: 'none',
          fontSize: 15, fontWeight: 700, marginBottom: 16,
        }}
      >
        Ya la instalé ✓
      </Link>

      <div style={{ textAlign: 'center' }}>
        <Link href={skipHref} style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>
          Saltar por ahora →
        </Link>
      </div>
    </div>
  );
}
