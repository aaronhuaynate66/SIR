import { completeOnboardingAction } from '../actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { added?: string; screenshot?: string };
}

export default function ListoPage({ searchParams }: Props) {
  const added      = searchParams.added === '1';
  const screenshot = searchParams.screenshot === '1';

  const items = [
    { label: 'Cuenta creada',                    done: true              },
    { label: 'Primera persona agregada',          done: added             },
    { label: 'Perfil enriquecido con screenshot', done: screenshot        },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎉</p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' }}>
        ¡Listo para empezar!
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>
        Tu cuenta está configurada
      </p>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        marginBottom: 36, textAlign: 'left',
      }}>
        {items.map(({ label, done }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: '#13151f', border: '1px solid #2a2d3e', borderRadius: 10,
          }}>
            <span style={{ fontSize: 18 }}>{done ? '✅' : '⬜'}</span>
            <span style={{ fontSize: 14, color: done ? '#e2e8f0' : '#475569', fontWeight: done ? 500 : 400 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <form action={completeOnboardingAction}>
        <button
          type="submit"
          style={{
            width: '100%', padding: '13px',
            background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Ir al dashboard →
        </button>
      </form>
    </div>
  );
}
