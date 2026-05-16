'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import { createPerson } from '@sir/db';
import { generateSlug } from '@sir/shared';
import { trackServerEvent, EVENTS } from '@sir/analytics';
import type { PersonRelationshipType } from '@sir/db';

export type OnboardingResult = { error?: string; personId?: string; personName?: string };

export async function createOnboardingPersonAction(formData: FormData): Promise<OnboardingResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'No autenticado' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'El nombre es requerido' };

  const relType = ((formData.get('relationship_type') as string) || 'networking') as PersonRelationshipType;

  try {
    const db = getServiceClient();
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await db.from('people').select('id').eq('user_id', user.id).eq('slug', slug).maybeSingle();
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const person = await createPerson({
      user_id: user.id,
      name,
      relationship_type: relType,
      slug,
    });

    void trackServerEvent(user.id, EVENTS.PERSON_CREATED, { relationship_type: relType });

    return { personId: person.id, personName: name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al crear persona' };
  }
}

export async function completeOnboardingAction(): Promise<void> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  await getServiceClient()
    .from('users')
    .update({ onboarding_completed: true })
    .eq('id', user.id);

  revalidatePath('/inicio');
  redirect('/inicio');
}
