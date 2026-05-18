import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import ImportarRedForm from './ImportarRedForm';

export const dynamic = 'force-dynamic';

export default async function ImportarRedPage() {
  const user = await getAuthUser();

  let contactCount = 0;
  let alreadyConnected = false;

  if (user) {
    const db = getServiceClient();
    const { data: integrations } = await db
      .from('google_integrations')
      .select('contacts_synced')
      .eq('user_id', user.id);

    if (integrations && integrations.length > 0) {
      alreadyConnected = true;
      contactCount = (integrations as { contacts_synced: number }[])
        .reduce((s, r) => s + (r.contacts_synced ?? 0), 0);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>
        Importa tu red
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        Elige cómo quieres agregar tus contactos a SIR
      </p>
      <ImportarRedForm alreadyConnected={alreadyConnected} contactCount={contactCount} />
    </div>
  );
}
