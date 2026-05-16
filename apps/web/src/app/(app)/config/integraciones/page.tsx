import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import GoogleCard from './GoogleCard';
import GmailCard from './GmailCard';
import WhatsAppCard from './WhatsAppCard';
import OutlookCard from './OutlookCard';

export const dynamic = 'force-dynamic';

interface GoogleIntegrationRow {
  access_token:       string | null;
  scopes:             string[];
  last_sync_at:       string | null;
  contacts_synced:    number;
  events_synced:      number;
  emails_synced:      number;
  gmail_last_sync_at: string | null;
}

interface MicrosoftIntegrationRow {
  access_token:    string | null;
  last_sync_at:    string | null;
  contacts_synced: number;
  events_synced:   number;
}

export default async function IntegracionesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();

  const [{ data: gData }, { data: msData }] = await Promise.all([
    db.from('google_integrations')
      .select('access_token, scopes, last_sync_at, contacts_synced, events_synced, emails_synced, gmail_last_sync_at')
      .eq('user_id', user.id)
      .single(),
    db.from('microsoft_integrations')
      .select('access_token, last_sync_at, contacts_synced, events_synced')
      .eq('user_id', user.id)
      .single(),
  ]);

  const gRow  = gData  as GoogleIntegrationRow    | null;
  const msRow = msData as MicrosoftIntegrationRow | null;
  const scopes = gRow?.scopes ?? [];

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
          Integraciones
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Conecta tus herramientas para enriquecer tu red automáticamente.
        </p>
      </div>

      <GoogleCard
        connected={!!gRow?.access_token}
        lastSyncAt={gRow?.last_sync_at ?? null}
        contactsSynced={gRow?.contacts_synced ?? 0}
        eventsSynced={gRow?.events_synced ?? 0}
      />

      <GmailCard
        connected={scopes.includes('gmail.readonly')}
        emailsSynced={gRow?.emails_synced ?? 0}
        lastSyncAt={gRow?.gmail_last_sync_at ?? null}
      />

      <OutlookCard
        connected={!!msRow?.access_token}
        lastSyncAt={msRow?.last_sync_at ?? null}
        contactsSynced={msRow?.contacts_synced ?? 0}
        eventsSynced={msRow?.events_synced ?? 0}
      />

      <WhatsAppCard />

      {/* Coming soon */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(['iCloud Contacts'] as const).map(name => (
          <div key={name} style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: 0.5,
          }}>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 2px', fontSize: 15 }}>{name}</p>
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Próximamente</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: '#2a2d3e', color: '#64748b',
              borderRadius: 6, padding: '3px 8px',
            }}>
              PRONTO
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
