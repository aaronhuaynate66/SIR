import { sendSignal, checkHealth, saveHumanState, createPerson, registerInteraction, getAdvisor } from '../lib/api';
import * as authStore from '../lib/auth-store';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  authStore.setSession('test-token', 'u-1');
});

afterEach(() => authStore.clearSession());

// ─── sendSignal ───────────────────────────────────────────────────────────────

describe('sendSignal', () => {
  it('posts to /api/signals with Bearer token', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signalId: 's1', processed: true, layersActivated: ['working'], response: 'ok' }),
    });

    const result = await sendSignal('interaction', { message: 'hi' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/signals'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
    expect(result.signalId).toBe('s1');
  });

  it('throws when no active session', async () => {
    authStore.clearSession();
    await expect(sendSignal('interaction')).rejects.toThrow('No active session');
  });

  it('throws with server error message on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid token', code: 'UNAUTHORIZED' }),
    });

    await expect(sendSignal('emotion')).rejects.toThrow('Invalid token');
  });
});

// ─── saveHumanState ───────────────────────────────────────────────────────────

describe('saveHumanState', () => {
  const body = { mood_score: 3, energy_score: 7, physical_tags: [], emotional_tags: [] };
  const mockLog = { id: 'log-1', user_id: 'u-1', mood_score: 3, energy_score: 7, physical_tags: [], emotional_tags: [], notes: null, composite_score: 60, availability_score: 70, interaction_risk: 30, created_at: new Date().toISOString() };

  it('posts state and returns log', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockLog) });
    const result = await saveHumanState(body);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/human-state'),
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
    expect(result.composite_score).toBe(60);
  });

  it('throws when no session', async () => {
    authStore.clearSession();
    await expect(saveHumanState(body)).rejects.toThrow('No active session');
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Server error', code: 'INTERNAL' }) });
    await expect(saveHumanState(body)).rejects.toThrow('Server error');
  });
});

// ─── createPerson ─────────────────────────────────────────────────────────────

describe('createPerson', () => {
  const mockPerson = { id: 'p-1', user_id: 'u-1', name: 'Ana', email: null, phone: null, organization: null, role: null, linkedin_url: null, avatar_url: null, notes: null, tags: [], language: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  it('posts to /api/people and returns person', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockPerson) });
    const result = await createPerson({ name: 'Ana' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/people'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.name).toBe('Ana');
  });

  it('throws when no session', async () => {
    authStore.clearSession();
    await expect(createPerson({ name: 'Ana' })).rejects.toThrow('No active session');
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Bad request', code: 'BAD_REQUEST' }) });
    await expect(createPerson({ name: '' })).rejects.toThrow('Bad request');
  });
});

// ─── registerInteraction ─────────────────────────────────────────────────────

describe('registerInteraction', () => {
  const mockRel = { id: 'r-1', user_id: 'u-1', person_id: 'p-1', strength: 70, reciprocity: 60, trust_score: 0.75, relationship_type: 'professional', last_contact_at: null, contact_frequency_days: 30, stage: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  it('posts interaction and returns relationship', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockRel) });
    const result = await registerInteraction({ person_id: 'p-1', quality: 4 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/interactions'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.strength).toBe(70);
  });

  it('throws when no session', async () => {
    authStore.clearSession();
    await expect(registerInteraction({ person_id: 'p-1', quality: 3 })).rejects.toThrow('No active session');
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({ error: 'Person not found', code: 'NOT_FOUND' }) });
    await expect(registerInteraction({ person_id: 'bad', quality: 3 })).rejects.toThrow('Person not found');
  });
});

// ─── getAdvisor ──────────────────────────────────────────────────────────────

describe('getAdvisor', () => {
  const mockAdvisor = { user_available: true, availability_score: 80, interaction_risk: 10, suggestions: [], generated_at: new Date().toISOString() };

  it('fetches advisor with auth header', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockAdvisor) });
    const result = await getAdvisor();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/advisor'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
    expect(result.user_available).toBe(true);
  });

  it('throws when no session', async () => {
    authStore.clearSession();
    await expect(getAdvisor()).rejects.toThrow('No active session');
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Internal error', code: 'INTERNAL' }) });
    await expect(getAdvisor()).rejects.toThrow('Internal error');
  });
});

// ─── checkHealth ─────────────────────────────────────────────────────────────

describe('checkHealth', () => {
  it('returns true when server responds ok', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    expect(await checkHealth()).toBe(true);
  });

  it('returns false when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    expect(await checkHealth()).toBe(false);
  });
});
