import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';
import { getAppUrl, getMsCallbackUrl, MS_SCOPES } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const appUrl = getAppUrl();
  const base   = (path: string) => new URL(path, appUrl);
  const { searchParams } = req.nextUrl;

  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(base('/config/integraciones?error=ms_cancelled'));
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(base('/login'));

  const expectedState = Buffer.from(user.id).toString('base64url');
  if (state !== expectedState) {
    return NextResponse.redirect(base('/config/integraciones?error=ms_invalid_state'));
  }

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env['MICROSOFT_CLIENT_ID']!,
      client_secret: process.env['MICROSOFT_CLIENT_SECRET']!,
      redirect_uri:  getMsCallbackUrl(),
      grant_type:    'authorization_code',
      scope:         MS_SCOPES.join(' '),
    }),
  });

  const tokens = await tokenRes.json() as {
    access_token?:  string;
    refresh_token?: string;
    expires_in?:    number;
    scope?:         string;
    error?:         string;
  };

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(base('/config/integraciones?error=ms_token_failed'));
  }

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
  const grantedScopes = (tokens.scope ?? '').split(' ').filter(Boolean);

  await getServiceClient()
    .from('microsoft_integrations')
    .upsert(
      {
        user_id:       user.id,
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expiry:  expiry.toISOString(),
        scopes:        grantedScopes,
      },
      { onConflict: 'user_id' }
    );

  return NextResponse.redirect(base('/config/integraciones?ms_connected=1'));
}
