import { getServiceClient } from '@/lib/supabase-server';

export interface MicrosoftIntegration {
  id:              string;
  user_id:         string;
  access_token:    string;
  refresh_token:   string | null;
  token_expiry:    string | null;
  scopes:          string[];
  last_sync_at:    string | null;
  contacts_synced: number;
  events_synced:   number;
  created_at:      string;
}

export function getAppUrl(): string {
  return process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://sir-web.vercel.app';
}

export function getMsCallbackUrl(): string {
  return `${getAppUrl()}/api/integrations/microsoft/callback`;
}

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/** Returns a valid access token, refreshing if expired (5-min buffer). */
export async function getMsValidToken(integration: MicrosoftIntegration, userId: string): Promise<string> {
  const expiry = integration.token_expiry ? new Date(integration.token_expiry) : null;
  const isExpired = !expiry || expiry.getTime() - Date.now() < 5 * 60 * 1000;
  if (!isExpired) return integration.access_token;
  if (!integration.refresh_token) throw new Error('No refresh token — user must reconnect');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env['MICROSOFT_CLIENT_ID']!,
      client_secret: process.env['MICROSOFT_CLIENT_SECRET']!,
      refresh_token: integration.refresh_token,
      grant_type:    'refresh_token',
      scope:         MS_SCOPES.join(' '),
    }),
  });

  const data = await res.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${data.error ?? 'unknown'}`);
  }

  const newExpiry = new Date(Date.now() + (data.expires_in ?? 3600) * 1000);
  await getServiceClient()
    .from('microsoft_integrations')
    .update({ access_token: data.access_token, token_expiry: newExpiry.toISOString() })
    .eq('user_id', userId);

  return data.access_token;
}

export const MS_SCOPES = [
  'offline_access',
  'User.Read',
  'Contacts.Read',
  'Calendars.Read',
  'Mail.Read',
];
