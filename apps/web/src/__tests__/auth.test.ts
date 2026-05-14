import { getUserFromRequest, AuthError } from '../lib/auth';

jest.mock('../lib/supabase-server', () => ({
  getServiceClient: jest.fn(),
}));

import { getServiceClient } from '../lib/supabase-server';

const mockGetUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getServiceClient as jest.Mock).mockReturnValue({
    auth: { getUser: mockGetUser },
  });
});

describe('getUserFromRequest', () => {
  it('returns userId from a valid Bearer token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const userId = await getUserFromRequest(req);

    expect(userId).toBe('u-1');
    expect(mockGetUser).toHaveBeenCalledWith('valid-token');
  });

  it('throws UNAUTHORIZED when Authorization header is missing', async () => {
    const req = new Request('http://localhost');

    await expect(getUserFromRequest(req)).rejects.toThrow(AuthError);
    await expect(getUserFromRequest(req)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws UNAUTHORIZED when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer bad-token' },
    });

    await expect(getUserFromRequest(req)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('strips Bearer prefix before calling getUser', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2' } }, error: null });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer my-jwt-token' },
    });

    await getUserFromRequest(req);

    expect(mockGetUser).toHaveBeenCalledWith('my-jwt-token');
  });
});
