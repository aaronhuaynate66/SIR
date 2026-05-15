const mockInsert = jest.fn(() => Promise.resolve({ data: null, error: null }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('@sir/db', () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

import { EVENTS, trackServerEvent } from '../index';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── EVENTS ──────────────────────────────────────────────────────────────────

describe('EVENTS', () => {
  it('has all required event name constants', () => {
    expect(EVENTS.USER_SIGNED_UP).toBe('user_signed_up');
    expect(EVENTS.PERSON_CREATED).toBe('person_created');
    expect(EVENTS.PERSON_VIEWED).toBe('person_viewed');
    expect(EVENTS.SCREENSHOT_ANALYZED).toBe('screenshot_analyzed');
    expect(EVENTS.SCREENSHOT_SAVED).toBe('screenshot_saved');
    expect(EVENTS.BRIEFING_GENERATED).toBe('briefing_generated');
    expect(EVENTS.SIGNAL_CREATED).toBe('signal_created');
    expect(EVENTS.STATE_LOGGED).toBe('state_logged');
    expect(EVENTS.GRAPH_VIEWED).toBe('graph_viewed');
    expect(EVENTS.INTERACTION_REGISTERED).toBe('interaction_registered');
    expect(EVENTS.SIDEBAR_NAV).toBe('sidebar_nav');
  });

  it('exports exactly 22 events', () => {
    expect(Object.keys(EVENTS)).toHaveLength(22);
  });
});

// ─── trackServerEvent ─────────────────────────────────────────────────────────

describe('trackServerEvent', () => {
  it('writes event to Supabase analytics_events', async () => {
    trackServerEvent('user-1', 'test_event', { foo: 'bar' });
    await new Promise(r => setImmediate(r));
    expect(mockFrom).toHaveBeenCalledWith('analytics_events');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id:    'user-1',
      event_name: 'test_event',
      properties: { foo: 'bar' },
    });
  });

  it('uses empty properties object by default', async () => {
    trackServerEvent('user-1', 'test_event');
    await new Promise(r => setImmediate(r));
    expect(mockInsert).toHaveBeenCalledWith({
      user_id:    'user-1',
      event_name: 'test_event',
      properties: {},
    });
  });

  it('does not throw', () => {
    expect(() => trackServerEvent('user-1', 'test_event', { x: 1 })).not.toThrow();
  });

  it('writes a typed EVENTS constant correctly', async () => {
    trackServerEvent('user-2', EVENTS.PERSON_CREATED, { relationship_type: 'personal' });
    await new Promise(r => setImmediate(r));
    expect(mockInsert).toHaveBeenCalledWith({
      user_id:    'user-2',
      event_name: 'person_created',
      properties: { relationship_type: 'personal' },
    });
  });
});
