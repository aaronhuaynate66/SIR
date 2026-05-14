export type MemoryLayer =
  | 'sensory'
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'procedural'
  | 'emotional'
  | 'social'
  | 'prophetic';

export type SignalType =
  | 'interaction'
  | 'emotion'
  | 'location'
  | 'relationship'
  | 'task'
  | 'insight'
  | 'external';

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbMemory {
  id: string;
  user_id: string;
  layer: MemoryLayer;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  importance: number;
  accessed_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSignal {
  id: string;
  user_id: string;
  type: SignalType;
  payload: Record<string, unknown>;
  processed: boolean;
  memory_id: string | null;
  created_at: string;
}

export interface DbSearchResult {
  id: string;
  layer: MemoryLayer;
  content: string;
  metadata: Record<string, unknown>;
  importance: number;
  similarity: number;
  created_at: string;
}

// Tipos de inserción (sin campos auto-generados)
export type InsertUser = Pick<DbUser, 'email' | 'name'> &
  Partial<Pick<DbUser, 'avatar_url' | 'preferences'>>;

export type InsertMemory = Pick<DbMemory, 'user_id' | 'layer' | 'content'> &
  Partial<Pick<DbMemory, 'embedding' | 'metadata' | 'importance' | 'expires_at' | 'accessed_at'>>;

export type InsertSignal = Pick<DbSignal, 'user_id' | 'type'> &
  Partial<Pick<DbSignal, 'payload' | 'memory_id'>>;
