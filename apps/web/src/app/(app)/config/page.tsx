import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import ConfigForm from './ConfigForm';
import type { ProfilePrefs } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const { data } = await getServiceClient()
    .from('users')
    .select('name, preferences, timezone, dnd_start_hour, dnd_end_hour, email_enabled, push_enabled')
    .eq('id', user.id)
    .single();

  const row = data as {
    name?: string;
    preferences?: { language?: string };
    timezone?: string;
    dnd_start_hour?: number;
    dnd_end_hour?: number;
    email_enabled?: boolean;
    push_enabled?: boolean;
  } | null;

  const initial: ProfilePrefs = {
    name:           row?.name ?? '',
    language:       row?.preferences?.language ?? 'es',
    timezone:       row?.timezone ?? 'UTC',
    dnd_start_hour: row?.dnd_start_hour ?? 22,
    dnd_end_hour:   row?.dnd_end_hour ?? 8,
    email_enabled:  row?.email_enabled ?? true,
    push_enabled:   row?.push_enabled ?? true,
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
          Configuración
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
          {user.email}
        </p>
      </div>
      <ConfigForm initial={initial} />
    </div>
  );
}
