'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

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
