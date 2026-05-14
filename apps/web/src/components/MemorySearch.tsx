'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  layer: string;
  content: string;
  similarity: number;
  created_at: string;
}

const LAYER_COLORS: Record<string, string> = {
  episodic: '#6366f1', semantic: '#8b5cf6', emotional: '#ec4899',
  procedural: '#f59e0b', social: '#10b981', prophetic: '#06b6d4',
};

export default function MemorySearch({ userId }: { userId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId }),
      });
      const json = await res.json() as { results?: SearchResult[] };
      setResults(json.results ?? []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar memorias semánticamente… ej: «reunión de trabajo»"
          style={{
            flex: 1,
            padding: '10px 16px',
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button type="submit" disabled={loading || !query.trim()} style={{
          padding: '10px 20px',
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !query.trim() ? 0.6 : 1,
        }}>
          {loading ? '…' : 'Buscar'}
        </button>
      </form>

      {searched && (
        <div style={{ marginTop: 20 }}>
          {results.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 14 }}>Sin resultados para "{query}".</p>
          ) : (
            <>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                {results.length} resultado{results.length !== 1 ? 's' : ''} semántico{results.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map(r => (
                  <div key={r.id} style={{
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderLeft: `3px solid ${LAYER_COLORS[r.layer] ?? '#475569'}`,
                    borderRadius: '0 10px 10px 0',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 6px', fontSize: 14, color: '#e2e8f0' }}>{r.content}</p>
                      <span style={{ fontSize: 11, color: LAYER_COLORS[r.layer] ?? '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {r.layer}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                        {Math.round(r.similarity * 100)}% similar
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#334155' }}>
                        {new Date(r.created_at).toLocaleDateString('es')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
