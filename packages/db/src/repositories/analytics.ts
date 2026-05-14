import { getSupabaseClient } from '../supabase';

export async function trackEvent(
  userId: string,
  eventName: string,
  properties: Record<string, unknown> = {},
  sessionId?: string,
): Promise<void> {
  await getSupabaseClient()
    .from('analytics_events')
    .insert({
      user_id:    userId,
      event_name: eventName,
      properties,
      ...(sessionId ? { session_id: sessionId } : {}),
    });
}
