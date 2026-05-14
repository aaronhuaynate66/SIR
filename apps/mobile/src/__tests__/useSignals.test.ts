import { renderHook, act } from '@testing-library/react';
import { useSignals } from '../hooks/useSignals';
import * as api from '../lib/api';

jest.mock('../lib/api');

const mockSendSignal = api.sendSignal as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useSignals', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useSignals());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResponse).toBeNull();
  });

  it('stores response on success', async () => {
    const response = { signalId: 's1', processed: true, layersActivated: ['working'] };
    mockSendSignal.mockResolvedValue(response);

    const { result } = renderHook(() => useSignals());

    await act(async () => {
      await result.current.send('interaction', { message: 'hi' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResponse).toEqual(response);
  });

  it('sets error and returns null on failure', async () => {
    mockSendSignal.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSignals());

    let returned: unknown;
    await act(async () => { returned = await result.current.send('emotion'); });

    expect(returned).toBeNull();
    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('clearError resets the error state', async () => {
    mockSendSignal.mockRejectedValue(new Error('oops'));
    const { result } = renderHook(() => useSignals());

    await act(async () => { await result.current.send('task'); });
    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });
});
