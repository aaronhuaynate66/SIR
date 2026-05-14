import { handleCreateSignal } from '../handlers/signals';
import { validateCreateSignalBody, ValidationError } from '../types/api';

jest.mock('@sir/db', () => ({
  createSignal: jest.fn().mockResolvedValue({
    id: 'sig-1',
    user_id: 'u-1',
    type: 'interaction',
    payload: {},
    processed: false,
    memory_id: null,
    created_at: new Date().toISOString(),
  }),
  markSignalProcessed: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../lib/engine', () => ({
  getMemoryEngine: jest.fn().mockReturnValue({
    process: jest.fn().mockResolvedValue(undefined),
  }),
}));

beforeEach(() => jest.clearAllMocks());

describe('validateCreateSignalBody', () => {
  it('accepts a valid body without userId', () => {
    const result = validateCreateSignalBody({ type: 'interaction', payload: { msg: 'hi' } });
    expect(result.type).toBe('interaction');
    expect(result.payload).toEqual({ msg: 'hi' });
  });

  it('defaults payload to empty object when omitted', () => {
    const result = validateCreateSignalBody({ type: 'emotion' });
    expect(result.payload).toEqual({});
  });

  it('throws INVALID_SIGNAL_TYPE for unknown type', () => {
    try { validateCreateSignalBody({ type: 'unknown' }); } catch (e) {
      expect((e as ValidationError).code).toBe('INVALID_SIGNAL_TYPE');
    }
  });

  it('throws INVALID_BODY for non-object input', () => {
    try { validateCreateSignalBody(null); } catch (e) {
      expect((e as ValidationError).code).toBe('INVALID_BODY');
    }
  });

  it('throws INVALID_PAYLOAD when payload is an array', () => {
    try { validateCreateSignalBody({ type: 'task', payload: [] }); } catch (e) {
      expect((e as ValidationError).code).toBe('INVALID_PAYLOAD');
    }
  });
});

describe('handleCreateSignal', () => {
  it('creates signal with userId from JWT, processes and marks done', async () => {
    const result = await handleCreateSignal('u-1', { type: 'interaction', payload: { msg: 'hello' } });

    const { createSignal, markSignalProcessed } = await import('@sir/db');
    expect(createSignal).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u-1' }));
    expect(markSignalProcessed).toHaveBeenCalledWith('sig-1');
    expect(result).toEqual({ signalId: 'sig-1', processed: true, layersActivated: ['sensory', 'working', 'episodic', 'semantic'] });
  });

  it('returns correct layers for each signal type', async () => {
    const cases: Array<[string, string[]]> = [
      ['emotion',      ['emotional', 'working']],
      ['relationship', ['social', 'episodic']],
      ['task',         ['procedural', 'working', 'episodic']],
      ['insight',      ['semantic', 'prophetic']],
      ['external',     ['sensory', 'working']],
    ];

    for (const [type, layers] of cases) {
      const { createSignal } = await import('@sir/db');
      (createSignal as jest.Mock).mockResolvedValueOnce({
        id: `sig-${type}`, user_id: 'u-1', type,
        payload: {}, processed: false, memory_id: null,
        created_at: new Date().toISOString(),
      });
      const result = await handleCreateSignal('u-1', { type: type as never });
      expect(result.layersActivated).toEqual(layers);
    }
  });

  it('propagates DB errors', async () => {
    const { createSignal } = await import('@sir/db');
    (createSignal as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    await expect(handleCreateSignal('u-1', { type: 'interaction' })).rejects.toThrow('DB down');
  });
});
