import { createMemory, getMemoriesByLayer, searchMemories, deleteMemory } from '../repositories/memories';
import { getSupabaseClient } from '../supabase';

jest.mock('../supabase');

const mockClient = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const chainMock = (returnValue: unknown) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(returnValue),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(returnValue),
  maybeSingle: jest.fn().mockResolvedValue(returnValue),
});

beforeEach(() => {
  jest.clearAllMocks();
  (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
});

describe('createMemory', () => {
  it('inserts a memory and returns it', async () => {
    const expected = { id: 'mem-1', layer: 'episodic', content: 'test', user_id: 'u-1' };
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await createMemory({
      user_id: 'u-1',
      layer: 'episodic',
      content: 'test',
    });

    expect(result).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('memories');
  });

  it('throws on supabase error', async () => {
    mockClient.from.mockReturnValue(chainMock({ data: null, error: { message: 'DB error' } }));

    await expect(
      createMemory({ user_id: 'u-1', layer: 'working', content: 'x' })
    ).rejects.toThrow('createMemory: DB error');
  });
});

describe('getMemoriesByLayer', () => {
  it('returns memories filtered by layer', async () => {
    const expected = [{ id: 'mem-2', layer: 'semantic' }];
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await getMemoriesByLayer('u-1', 'semantic');

    expect(result).toEqual(expected);
  });

  it('returns empty array when no memories exist', async () => {
    mockClient.from.mockReturnValue(chainMock({ data: null, error: null }));

    const result = await getMemoriesByLayer('u-1', 'procedural');

    expect(result).toEqual([]);
  });
});

describe('searchMemories', () => {
  it('calls search_memories RPC with correct params', async () => {
    const expected = [{ id: 'mem-3', similarity: 0.9 }];
    mockClient.rpc.mockResolvedValue({ data: expected, error: null });

    const embedding = new Array(768).fill(0.1);
    const result = await searchMemories('u-1', embedding, { layer: 'semantic', limit: 5 });

    expect(mockClient.rpc).toHaveBeenCalledWith('search_memories', {
      p_user_id: 'u-1',
      p_layer: 'semantic',
      p_query: embedding,
      p_limit: 5,
      p_threshold: 0.7,
    });
    expect(result).toEqual(expected);
  });

  it('throws on RPC error', async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    await expect(searchMemories('u-1', [], {})).rejects.toThrow('searchMemories: RPC failed');
  });
});
