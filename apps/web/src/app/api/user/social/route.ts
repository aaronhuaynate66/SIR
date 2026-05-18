import { type NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, AuthError } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SocialFields = {
  linkedin_url?:       string | null;
  instagram_username?: string | null;
  twitter_username?:   string | null;
  tiktok_username?:    string | null;
};

// GET — used by Chrome extension to know user's own profiles
export async function GET(req: NextRequest): Promise<NextResponse> {
  let userId: string;
  try { userId = await getUserFromRequest(req); }
  catch (err) {
    return NextResponse.json({ error: err instanceof AuthError ? err.message : 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();
  const { data } = await db.from('users')
    .select('linkedin_url, instagram_username, twitter_username, tiktok_username')
    .eq('id', userId)
    .single();

  return NextResponse.json(data ?? {});
}

// PATCH — saves one or more social fields (used by extension + config page)
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  let userId: string;
  try { userId = await getUserFromRequest(req); }
  catch (err) {
    return NextResponse.json({ error: err instanceof AuthError ? err.message : 'Unauthorized' }, { status: 401 });
  }

  let body: SocialFields;
  try { body = await req.json() as SocialFields; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const allowed: (keyof SocialFields)[] = ['linkedin_url', 'instagram_username', 'twitter_username', 'tiktok_username'];
  const update: Partial<SocialFields> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await db.from('users').update(update).eq('id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cross-reference: count matching contacts in people
  const matches: Record<string, number> = {};

  if (update.linkedin_url) {
    const { count } = await db.from('people')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('linkedin_url', 'is', null);
    matches['linkedin'] = count ?? 0;
  }

  if (update.instagram_username) {
    const uname = update.instagram_username.replace(/^@/, '');
    const { count } = await db.from('people')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('instagram_url', 'is', null)
      .ilike('instagram_url', `%${uname}%`);
    matches['instagram'] = count ?? 0;
  }

  return NextResponse.json({ ok: true, matches });
}
