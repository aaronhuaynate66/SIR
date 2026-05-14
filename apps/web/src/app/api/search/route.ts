import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { query?: string; userId?: string };
    const { query, userId } = body;

    if (!query || !userId) {
      return NextResponse.json({ error: 'query and userId required' }, { status: 400 });
    }

    // Genera embedding con Ollama; si falla, fallback a búsqueda textual
    let embedding: number[] | null = null;
    try {
      const ollamaUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
      const res = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: query }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json() as { embedding?: number[] };
        embedding = json.embedding ?? null;
      }
    } catch {
      // Ollama no disponible — usamos búsqueda textual
    }

    const db = getServiceClient();

    if (embedding) {
      const { data, error } = await db.rpc('search_memories', {
        p_user_id: userId,
        p_query: embedding,
        p_limit: 10,
        p_threshold: 0.5,
      });
      if (!error) {
        return NextResponse.json({ results: data ?? [], mode: 'semantic' });
      }
    }

    // Fallback: búsqueda textual simple
    const { data } = await db.from('memories')
      .select('id, layer, content, metadata, importance, created_at')
      .eq('user_id', userId)
      .ilike('content', `%${query}%`)
      .not('layer', 'in', '("sensory","working")')
      .is('expires_at', null)
      .order('importance', { ascending: false })
      .limit(10);

    const results = (data ?? []).map(m => ({ ...m, similarity: 0.5 }));
    return NextResponse.json({ results, mode: 'text' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
