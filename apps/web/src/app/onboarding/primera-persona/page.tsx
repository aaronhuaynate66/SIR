import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import OnboardingPersonForm from './OnboardingPersonForm';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { source?: string };
}

export default async function PrimeraPersonaPage({ searchParams }: Props) {
  const source = searchParams.source ?? 'manual';
  const imported = source === 'google' || source === 'whatsapp';

  let people: { id: string; name: string; role?: string | null }[] = [];
  let total = 0;

  if (imported) {
    const user = await getAuthUser();
    if (user) {
      const db = getServiceClient();
      const { data, count } = await db
        .from('people')
        .select('id, name, role', { count: 'exact' })
        .eq('user_id', user.id)
        .order('name')
        .limit(8);
      people = (data ?? []) as typeof people;
      total  = count ?? 0;
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>
        {imported ? 'Elige una persona clave' : 'Agrega tu primera persona'}
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        {imported
          ? `${total} contacto${total !== 1 ? 's' : ''} importado${total !== 1 ? 's' : ''} — ¿con quién quieres empezar?`
          : 'Empieza con alguien importante para ti'}
      </p>

      {imported && people.length > 0 ? (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {people.map(p => (
              <Link
                key={p.id}
                href={`/onboarding/extension?added=1`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#13151f',
                  border: '1px solid #2a2d3e', borderRadius: 10,
                  textDecoration: 'none', transition: 'border-color 0.15s',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                    {p.name}
                  </p>
                  {p.role && (
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{p.role}</p>
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>Elegir →</span>
              </Link>
            ))}
          </div>

          {total > 8 && (
            <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginBottom: 16 }}>
              y {total - 8} contactos más en tu red
            </p>
          )}

          <div style={{ borderTop: '1px solid #2a2d3e', paddingTop: 20, marginBottom: 4 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
              ¿O prefieres agregar alguien que no está en la lista?
            </p>
            <OnboardingPersonForm />
          </div>
        </div>
      ) : (
        <>
          <OnboardingPersonForm />
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/onboarding/extension?added=0"
              style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}
            >
              Saltar por ahora →
            </Link>
          </div>
        </>
      )}

      {imported && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/onboarding/extension?added=0" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>
            Saltar por ahora →
          </Link>
        </div>
      )}
    </div>
  );
}
