import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';
import { getMsValidToken, type MicrosoftIntegration } from '../_lib';

export const dynamic = 'force-dynamic';

interface GraphAttendee {
  emailAddress: { address: string; name?: string };
  status?:      { response?: string };
}

interface GraphEvent {
  id:         string;
  subject?:   string;
  start:      { dateTime: string; timeZone?: string };
  end:        { dateTime: string };
  attendees?: GraphAttendee[];
  organizer?: { emailAddress: { address: string } };
}

export async function POST(): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data: intRow } = await db
    .from('microsoft_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!intRow) return Response.json({ error: 'Not connected to Microsoft' }, { status: 400 });
  const integration = intRow as MicrosoftIntegration;

  let token: string;
  try {
    token = await getMsValidToken(integration, user.id);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 401 });
  }

  const { data: existingPeople } = await db
    .from('people')
    .select('id, email')
    .eq('user_id', user.id);

  type PersonRow = { id: string; email: string | null };
  const byEmail = new Map<string, string>();
  for (const p of (existingPeople ?? []) as PersonRow[]) {
    if (p.email) byEmail.set(p.email.toLowerCase(), p.id);
  }

  const sixMonthsAgo = new Date(Date.now() - 180 * 86_400_000)
    .toISOString().slice(0, 19) + 'Z';

  let meetingsProcessed  = 0;
  let interactionsCreated = 0;

  const strengthUpdates = new Map<string, number>();
  const lastContactUpdates = new Map<string, string>();

  let nextLink: string | null =
    `https://graph.microsoft.com/v1.0/me/events?$top=100&$select=id,subject,start,end,attendees,organizer` +
    `&$filter=start/dateTime ge '${sixMonthsAgo}'&$orderby=start/dateTime desc`;

  while (nextLink) {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { value?: GraphEvent[]; '@odata.nextLink'?: string };
    if (!res.ok) break;

    for (const event of (data.value ?? [])) {
      const attendees = event.attendees ?? [];
      const eventDate = new Date(event.start.dateTime).toISOString();
      let hadMatch = false;

      for (const att of attendees) {
        const email  = att.emailAddress.address?.toLowerCase();
        const personId = email ? byEmail.get(email) : undefined;
        if (!personId) continue;

        hadMatch = true;

        // Create interaction signal
        await db.from('signals').insert({
          user_id:   user.id,
          person_id: personId,
          type:      'interaction',
          payload: {
            channel:      'meeting',
            source:       'outlook_calendar',
            title:        event.subject ?? 'Reunión',
            initiated_by: 'user',
            quality:      3,
          },
          processed:  true,
          created_at: eventDate,
        });
        interactionsCreated++;

        // Accumulate strength delta (+5 per meeting, max 100)
        strengthUpdates.set(personId, Math.min(100, (strengthUpdates.get(personId) ?? 0) + 5));

        // Track most recent contact date per person
        const existing = lastContactUpdates.get(personId);
        if (!existing || eventDate > existing) {
          lastContactUpdates.set(personId, eventDate);
        }
      }

      if (hadMatch) meetingsProcessed++;
    }

    nextLink = data['@odata.nextLink'] ?? null;
  }

  // Batch apply relationship updates
  for (const [personId, strengthDelta] of strengthUpdates) {
    const { data: relRow } = await db
      .from('relationships')
      .select('strength')
      .eq('user_id', user.id)
      .eq('person_id', personId)
      .maybeSingle();

    const patch: Record<string, unknown> = {
      last_contact_at: lastContactUpdates.get(personId) ?? null,
      contact_frequency_days: 14,
    };

    if (relRow) {
      patch['strength'] = Math.min(100, ((relRow as { strength: number }).strength ?? 50) + strengthDelta);
      await db.from('relationships').update(patch).eq('user_id', user.id).eq('person_id', personId);
    } else {
      await db.from('relationships').insert({
        user_id:    user.id,
        person_id:  personId,
        strength:   Math.min(100, 50 + strengthDelta),
        reciprocity: 50,
        trust_score: 0.5,
        ...patch,
      });
    }
  }

  await db.from('microsoft_integrations').update({
    events_synced: meetingsProcessed,
    last_sync_at:  new Date().toISOString(),
  }).eq('user_id', user.id);

  return Response.json({ meetings_processed: meetingsProcessed, interactions_created: interactionsCreated });
}
