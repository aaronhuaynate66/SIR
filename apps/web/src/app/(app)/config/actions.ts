'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

type SocialKey = 'linkedin_url' | 'instagram_username' | 'twitter_username' | 'tiktok_username';

export async function updateSocialProfileAction(
  key: SocialKey,
  value: string | null,
): Promise<{ matches: Record<string, number> }> {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const db = getServiceClient();
  const { error } = await db.from('users').update({ [key]: value || null }).eq('id', user.id);
  if (error) throw new Error(error.message);

  revalidatePath('/config');

  const matches: Record<string, number> = {};

  if (key === 'linkedin_url' && value) {
    const { count } = await db.from('people')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('linkedin_url', 'is', null);
    matches['linkedin'] = count ?? 0;
  }

  if (key === 'instagram_username' && value) {
    const uname = value.replace(/^@/, '');
    const { count } = await db.from('people')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('instagram_url', 'is', null)
      .ilike('instagram_url', `%${uname}%`);
    matches['instagram'] = count ?? 0;
  }

  return { matches };
}

export interface ProfilePrefs {
  name:       string;
  language:   string;
  timezone:   string;
  dnd_start_hour:     number;
  dnd_end_hour:       number;
  email_enabled:      boolean;
  push_enabled:       boolean;
}

export async function updateProfileAction(prefs: ProfilePrefs) {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await getServiceClient()
    .from('users')
    .update({
      name:           prefs.name,
      preferences:    { language: prefs.language },
      timezone:       prefs.timezone,
      dnd_start_hour: prefs.dnd_start_hour,
      dnd_end_hour:   prefs.dnd_end_hour,
      email_enabled:  prefs.email_enabled,
      push_enabled:   prefs.push_enabled,
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/config');
}
