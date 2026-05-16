import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import OnboardingScreenshotStep from './OnboardingScreenshotStep';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { personId?: string; personName?: string };
}

export default async function OnboardingScreenshotPage({ searchParams }: Props) {
  const personId = searchParams.personId;
  if (!personId) redirect('/onboarding/listo?added=0');

  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();
  const { data: person } = await db
    .from('people')
    .select('id, name')
    .eq('id', personId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!person) redirect('/onboarding/listo?added=1');

  const typedPerson = person as { id: string; name: string };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>
        Enriquece el perfil
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        Sube un screenshot de LinkedIn, Instagram o WhatsApp para completar el perfil de{' '}
        <strong style={{ color: '#94a3b8' }}>{typedPerson.name}</strong>
      </p>
      <OnboardingScreenshotStep personId={typedPerson.id} personName={typedPerson.name} />
    </div>
  );
}
