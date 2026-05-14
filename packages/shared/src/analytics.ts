export const EVENT_NAMES = {
  SIGNAL_CAPTURED:  'signal_captured',
  BRIEFING_VIEWED:  'briefing_viewed',
  PERSON_CONTACTED: 'person_contacted',
  MEMORY_RECALLED:  'memory_recalled',
  STATE_UPDATED:    'state_updated',
  GRAPH_VIEWED:     'graph_viewed',
} as const;

export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];

export interface AnalyticsEvent<P extends Record<string, unknown> = Record<string, unknown>> {
  userId:     string;
  eventName:  EventName;
  properties: P;
  sessionId?: string;
}
