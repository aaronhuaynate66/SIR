import { GET } from '../app/api/memories/route';

jest.mock('../lib/supabase-server', () => ({ getAdminClient: jest.fn() }));

import { getAdminClient } from '../lib/supabase-server';

const mockData = [
  { id: 'm1', user_id: 'u1', layer: 'episodic', content: 'test', importance: 0.7, created_at: '2026-05-14T00:00:00Z', metadata: {} },
];

function makeChain(result: { data: unknown; error: unknown }) {
  // All methods return this; chain is a thenable (like real Supabase builder)
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq:     jest.fn().mockReturnThis(),
    order:  jest.fn().mockReturnThis(),
    limit:  jest.fn().mockReturnThis(),
    // thenable so `await chain.limit()` resolves
    then: (resolve: (v: unknown) => void) =>
      Promise.resolve(result).then(resolve),
  } as unknown;
  // make limit() return chain itself (thenable)
  const c = chain as Record<string, jest.Mock>;
  c['limit']!.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/memories', () => {
  it('returns memories without filters', async () => {
    const chain = makeChain({ data: mockData, error: null });
    (getAdminClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const req = new Request('http://localhost/api/memories');
    const res = await GET(req);
    const body = await res.json() as { memories: unknown[]; total: number };

    expect(res.status).toBe(200);
    expect(body.memories).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns 400 for invalid layer', async () => {
    const req = new Request('http://localhost/api/memories?layer=invalid');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('INVALID_LAYER');
  });

  it('calls eq with layer when filter provided', async () => {
    const chain = makeChain({ data: [], error: null });
    (getAdminClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const req = new Request('http://localhost/api/memories?layer=semantic');
    await GET(req);

    expect((chain as Record<string, jest.Mock>)['eq']).toHaveBeenCalledWith('layer', 'semantic');
  });

  it('caps limit at 200', async () => {
    const chain = makeChain({ data: [], error: null });
    (getAdminClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const req = new Request('http://localhost/api/memories?limit=9999');
    await GET(req);

    expect((chain as Record<string, jest.Mock>)['limit']).toHaveBeenCalledWith(200);
  });
});
