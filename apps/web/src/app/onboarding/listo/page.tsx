import { completeOnboardingAction } from '../actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { added?: string; source?: string; extension?: string };
}

export default function ListoPage({ searchParams }: Props) {
  const added     = searchParams.added     === '1';
  const extension = searchParams.extension === '1';
  const source    = searchParams.source;
  const imported  = source === 'google' || source === 'whatsapp' || added;

  const items = [
    { label: 'Cuenta creada',                         done: true      },
    { label: 'Red importada o primera persona añadida', done: imported  },
    { label: 'Primera persona enriquecida',            done: added     },
    { label: 'Extensión de Chrome instalada',          done: extension  },
  ];

  const doneCount = items.filter(i => i.done).length;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎉</p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' }}>
        ¡Listo para empezar!
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>
        {doneCount === 4 ? 'Setup completo — todo configurado' : `${doneCount} de ${items.length} pasos completados`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36, textAlign: 'left' }}>
        {items.map(({ label, done }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: '#13151f',
            border: `1px solid ${done ? '#34d39930' : '#2a2d3e'}`, borderRadius: 10,
          }}>
            <span style={{ fontSize: 18 }}>{done ? '✅' : '⬜'}</span>
            <span style={{ fontSize: 14, color: done ? '#e2e8f0' : '#475569', fontWeight: done ? 500 : 400 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {!extension && (
        <div style={{
          background: '#13151f', border: '1px solid #6366f133',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
            💡 Tip: instala la extensión después
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
            Ve a <strong style={{ color: '#94a3b8' }}>/config</strong> → Mis Redes Sociales para descargarla cuando quieras
          </p>
        </div>
      )}

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
