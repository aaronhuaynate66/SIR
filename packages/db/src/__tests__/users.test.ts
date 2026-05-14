import { createUser, getUserById, getUserByEmail } from '../repositories/users';
import { getSupabaseClient } from '../supabase';

jest.mock('../supabase');

const mockClient = { from: jest.fn() };

const chainMock = (returnValue: unknown) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(returnValue),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(returnValue),
  update: jest.fn().mockReturnThis(),
});

beforeEach(() => {
  jest.clearAllMocks();
  (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
});

describe('createUser', () => {
  it('creates and returns a user', async () => {
    const expected = { id: 'u-1', email: 'a@b.com', name: 'Aaron' };
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await createUser({ email: 'a@b.com', name: 'Aaron' });

    expect(result).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('users');
  });

  it('throws on duplicate email', async () => {
    mockClient.from.mockReturnValue(chainMock({ data: null, error: { message: 'duplicate key' } }));

    await expect(createUser({ email: 'a@b.com', name: 'Aaron' })).rejects.toThrow('createUser: duplicate key');
  });
});

describe('getUserById', () => {
  it('returns null when user not found', async () => {
    mockClient.from.mockReturnValue(chainMock({ data: null, error: null }));

    const result = await getUserById('nonexistent');

    expect(result).toBeNull();
  });

  it('returns user when found', async () => {
    const expected = { id: 'u-1', email: 'a@b.com', name: 'Aaron' };
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await getUserById('u-1');

    expect(result).toEqual(expected);
  });
});

describe('getUserByEmail', () => {
  it('returns user by email', async () => {
    const expected = { id: 'u-1', email: 'a@b.com' };
    mockClient.from.mockReturnValue(chainMock({ data: expected, error: null }));

    const result = await getUserByEmail('a@b.com');

    expect(result).toEqual(expected);
  });
});
