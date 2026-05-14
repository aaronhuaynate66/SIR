import { createSignal, markSignalProcessed } from '@sir/db';
import { getMemoryEngine } from '@/lib/engine';
import type { CreateSignalBody, CreateSignalResponse } from '@/types/api';

const LAYER_MAP: Record<string, string[]> = {
  interaction:  ['sensory', 'working', 'episodic', 'semantic'],
  emotion:      ['emotional', 'working'],
  location:     ['episodic', 'working'],
  relationship: ['social', 'episodic'],
  task:         ['procedural', 'working', 'episodic'],
  insight:      ['semantic', 'prophetic'],
  external:     ['sensory', 'working'],
};

export async function handleCreateSignal(
  userId: string,
  body: CreateSignalBody
): Promise<CreateSignalResponse> {
  const signal = await createSignal({
    user_id: userId,
    type: body.type,
    payload: body.payload ?? {},
  });

  await getMemoryEngine().process(signal);
  await markSignalProcessed(signal.id);

  return {
    signalId: signal.id,
    processed: true,
    layersActivated: LAYER_MAP[body.type] ?? [],
  };
}
