import { createSignal, getPendingSignals, markSignalProcessed } from '../repositories/signals';
import { getSupabaseClient } from '../supabase';

jest.mock('../supabase');

const mockClient = { from: jest.fn() };

const chainMock = (returnValue: unknown) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(returnValue),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(returnValue),
});

beforeEach(() => {
  jest.clearAllMocks();
  (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
});

describe('createSignal', () => {
  it('inserts a signal and returns it', async () => {
    const expected = { id: 's-1', type: 'interaction', user_id: 'u-1', processed: false };
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await createSignal({ user_id: 'u-1', type: 'interaction' });

    expect(result).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('signals');
  });

  it('throws on error', async () => {
    mockClient.from.mockReturnValue(chainMock({ data: null, error: { message: 'fail' } }));

    await expect(createSignal({ user_id: 'u-1', type: 'emotion' })).rejects.toThrow('createSignal: fail');
  });
});

describe('getPendingSignals', () => {
  it('returns unprocessed signals ordered by created_at', async () => {
    const expected = [{ id: 's-2', processed: false }];
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await getPendingSignals('u-1');

    expect(result).toEqual(expected);
  });
});

describe('markSignalProcessed', () => {
  it('marks signal as processed with memoryId', async () => {
    const chain = chainMock({ data: null, error: null });
    mockClient.from.mockReturnValue(chain);

    await markSignalProcessed('s-1', 'mem-1');

    expect(chain.update).toHaveBeenCalledWith({ processed: true, memory_id: 'mem-1' });
  });
});
