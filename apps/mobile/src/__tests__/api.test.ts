import { sendSignal, checkHealth } from '../lib/api';
import * as authStore from '../lib/auth-store';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  authStore.setSession('test-token', 'u-1');
});

afterEach(() => authStore.clearSession());

describe('sendSignal', () => {
  it('posts to /api/signals with Bearer token', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ signalId: 's1', processed: true, layersActivated: ['working'] }),
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
