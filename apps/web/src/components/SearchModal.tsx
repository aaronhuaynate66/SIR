'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { GlobalSearchResult } from '@/app/api/search/route';

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  relationship: 'nueva relación', job_change: 'cambio de trabajo',
  promotion: 'promoción', birthday: 'cumpleaños', achievement: 'logro',
  life_event: 'evento de vida', travel: 'viaje', publication: 'publicación',
  health_event: 'evento de salud', loss: 'pérdida', interaction: 'interacción',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as GlobalSearchResult;
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current  = setTimeout(() => search(val), 300);
  }

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  if (!open) return null;

  const hasResults = results && (results.people.length + results.memories.length + results.signals.length) > 0;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.6)',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #2a2d3e' }}>
          <span style={{ fontSize: 16, color: '#475569' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Buscar personas, memorias, señales…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: 15,
            }}
          />
          {loading && <span style={{ fontSize: 12, color: '#475569' }}>Buscando…</span>}
          <kbd style={{
            fontSize: 11, color: '#334155', background: '#2a2d3e',
            borderRadius: 5, padding: '2px 7px', fontFamily: 'inherit',
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {!query || query.length < 2 ? (
            <p style={{ padding: '20px 18px', fontSize: 13, color: '#475569', margin: 0 }}>
              Escribe al menos 2 caracteres para buscar…
            </p>
          ) : loading && !results ? (
            <SkeletonRows />
          ) : !hasResults ? (
            <p style={{ padding: '20px 18px', fontSize: 13, color: '#475569', margin: 0 }}>
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {results.people.length > 0 && (
                <Section label="Personas">
                  {results.people.map(p => (
                    <ResultRow
                      key={p.id}
                      icon="👤"
                      title={p.name}
                      sub={[p.role, p.organization].filter(Boolean).join(' · ') || undefined}
                      onClick={() => navigate(`/red/${p.slug ?? p.id}`)}
                    />
                  ))}
                </Section>
              )}
              {results.memories.length > 0 && (
                <Section label="Memorias">
                  {results.memories.map(m => (
                    <ResultRow
                      key={m.id}
                      icon="🧠"
                      title={m.content.slice(0, 80) + (m.content.length > 80 ? '…' : '')}
                      sub={m.layer}
                      onClick={() => navigate('/memorias')}
                    />
                  ))}
                </Section>
              )}
              {results.signals.length > 0 && (
                <Section label="Señales">
                  {results.signals.map(s => (
                    <ResultRow
                      key={s.id}
                      icon="📡"
                      title={s.recommendation?.slice(0, 80) ?? SIGNAL_TYPE_LABELS[s.type] ?? s.type}
                      sub={SIGNAL_TYPE_LABELS[s.type] ?? s.type}
                      onClick={() => navigate('/senales')}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: 0, padding: '10px 18px 4px', fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, sub, onClick }: { icon: string; title: string; sub?: string | undefined; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 18px', textAlign: 'left',
        background: hovered ? '#2a2d3e' : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </p>
        {sub && (
          <p style={{ margin: 0, fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[80, 60, 70].map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#2a2d3e' }} />
          <div style={{ height: 12, borderRadius: 4, background: '#2a2d3e', width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}
