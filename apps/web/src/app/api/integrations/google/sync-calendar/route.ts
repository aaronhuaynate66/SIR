import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';
import { getValidToken, type GoogleIntegration } from '../_lib';

export const dynamic = 'force-dynamic';

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; self?: boolean }>;
}

export async function POST(): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data: intRow } = await db
    .from('google_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!intRow) return Response.json({ error: 'Not connected to Google' }, { status: 400 });
  const integration = intRow as GoogleIntegration;

  let token: string;
  try {
    token = await getValidToken(integration, user.id);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 401 });
  }

  // Pre-load people with emails for matching
  const { data: people } = await db
    .from('people')
    .select('id, email')
    .eq('user_id', user.id);

  const emailToPersonId = new Map<string, string>();
  for (const p of (people ?? []) as Array<{ id: string; email: string | null }>) {
    if (p.email) emailToPersonId.set(p.email.toLowerCase(), p.id);
  }

  // Fetch last 6 months of calendar events
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const params = new URLSearchParams({
    timeMin:       sixMonthsAgo.toISOString(),
    maxResults:    '500',
    singleEvents:  'true',
    orderBy:       'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json() as { items?: CalendarEvent[] };
  if (!res.ok) return Response.json({ error: 'Failed to fetch calendar events' }, { status: 502 });

  let meetingsProcessed = 0;
  let interactionsCreated = 0;

  for (const event of (data.items ?? [])) {
    const attendees = (event.attendees ?? []).filter(a => !a.self);
    if (attendees.length < 1) continue; // need at least 1 other attendee

    const startIso = event.start?.dateTime ?? event.start?.date;
    if (!startIso) continue;

    meetingsProcessed++;

    for (const attendee of attendees) {
      const personId = emailToPersonId.get(attendee.email.toLowerCase());
      if (!personId) continue;

      // Create signal record for this meeting
      await db.from('signals').insert({
        user_id:   user.id,
        person_id: personId,
        type:      'interaction',
        payload:   {
          source:      'google_calendar',
          event_title: event.summary ?? 'Reunión',
          event_date:  startIso,
        },
        created_at: new Date(startIso).toISOString(),
      });
      interactionsCreated++;

      // Update relationship strength (+5 per meeting, max 100)
      const { data: rel } = await db
        .from('relationships')
        .select('id, strength')
        .eq('user_id', user.id)
        .eq('person_id', personId)
        .single();

      if (rel) {
        const r = rel as { id: string; strength: number };
        await db.from('relationships').update({
          strength:        Math.min(100, (r.strength ?? 0) + 5),
          last_contact_at: new Date(startIso).toISOString(),
        }).eq('id', r.id);
      }
    }
  }

  await db.from('google_integrations').update({
    events_synced: meetingsProcessed,
    last_sync_at:  new Date().toISOString(),
  }).eq('user_id', user.id);

  return Response.json({ meetings_processed: meetingsProcessed, interactions_created: interactionsCreated });
}
