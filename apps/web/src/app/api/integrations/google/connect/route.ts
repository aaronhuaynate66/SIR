import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { getAppUrl, GOOGLE_OAUTH_CALLBACK_URL } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const appUrl = getAppUrl();
  const isOnboarding = req.nextUrl.searchParams.get('onboarding') === '1';

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', appUrl));

  // Encode user id (+ optional onboarding flag) as CSRF state
  const statePayload = isOnboarding ? `${user.id}:onboarding` : user.id;
  const state = Buffer.from(statePayload).toString('base64url');

  const params = new URLSearchParams({
    client_id:     process.env['GOOGLE_CLIENT_ID'] ?? '',
    redirect_uri:  GOOGLE_OAUTH_CALLBACK_URL,
    response_type: 'code',
    scope:         [
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt:      'consent',
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
