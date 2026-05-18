import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import ConfigForm from './ConfigForm';
import SocialProfilesForm from './SocialProfilesForm';
import type { ProfilePrefs } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const { data } = await getServiceClient()
    .from('users')
    .select('name, preferences, timezone, dnd_start_hour, dnd_end_hour, email_enabled, push_enabled, linkedin_url, instagram_username, twitter_username, tiktok_username')
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
    linkedin_url?: string | null;
    instagram_username?: string | null;
    twitter_username?: string | null;
    tiktok_username?: string | null;
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

  const socialInitial = {
    linkedin_url:       row?.linkedin_url       ?? null,
    instagram_username: row?.instagram_username ?? null,
    twitter_username:   row?.twitter_username   ?? null,
    tiktok_username:    row?.tiktok_username    ?? null,
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

      {/* Social profiles section */}
      <div style={{ marginTop: 32 }}>
        <div style={{ paddingTop: 24, borderTop: '1px solid #2a2d3e', marginBottom: 20 }}>
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: '#64748b',
            margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Mis redes sociales
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            Conecta tus perfiles para que SIR enriquezca tu actividad y la cruce con tus contactos
          </p>
        </div>
        <SocialProfilesForm initial={socialInitial} />
      </div>
    </div>
  );
}
