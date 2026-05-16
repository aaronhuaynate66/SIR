import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getAppUrl, getMsCallbackUrl, MS_SCOPES } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const appUrl = getAppUrl();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', appUrl));

  const state = Buffer.from(user.id).toString('base64url');

  const params = new URLSearchParams({
    client_id:     process.env['MICROSOFT_CLIENT_ID'] ?? '',
    redirect_uri:  getMsCallbackUrl(),
    response_type: 'code',
    scope:         MS_SCOPES.join(' '),
    response_mode: 'query',
    state,
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}
