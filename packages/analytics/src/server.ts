import { getSupabaseClient } from '@sir/db';

export function trackServerEvent(
  userId: string,
  event: string,
  properties: Record<string, unknown> = {},
): void {
  getSupabaseClient()
    .from('analytics_events')
    .insert({ user_id: userId, event_name: event, properties })
    .then(undefined, () => undefined);
}
