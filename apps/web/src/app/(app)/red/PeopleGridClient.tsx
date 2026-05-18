'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PersonRelationshipType } from '@sir/db';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? '#6366f1'; }
function initials(name: string) { return name.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase(); }

const STAGE_LABEL: Record<string, string> = {
  active: 'Activa', strategic: 'Estratégica', prospect: 'Prospecto', dormant: 'Dormida',
};
const STAGE_COLOR: Record<string, string> = {
  active: '#86efac', strategic: '#fcd34d', prospect: '#93c5fd', dormant: '#d1d5db',
};
const REL_TYPE_COLORS: Record<PersonRelationshipType, string> = {
  strategic:    '#a855f7',
  professional: '#3b82f6',
  personal:     '#22c55e',
  family:       '#f97316',
  networking:   '#94a3b8',
  developing:   '#eab308',
};
const REL_TYPE_LABELS: Record<PersonRelationshipType, string> = {
  networking:   '🤝 Networking',
  professional: '👔 Profesional',
  strategic:    '🎯 Estratégico',
  personal:     '❤️ Personal',
  family:       '👨‍👩‍👧 Familia',
  developing:   '🌱 Por desarrollar',
};

export interface PersonRow {
  id: string;
  name: string;
  organization: string | null;
  role: string | null;
  notes: string | null;
  relationship_type: PersonRelationshipType;
  slug: string | null;
  health: number;
  strength: number | null;
  stage: string | null;
  lastContact: string | null;
}

type SortKey = 'name' | 'activity' | 'health';

export default function PeopleGridClient({ people }: { people: PersonRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort]   = useState<SortKey>('name');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = q
      ? people.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.organization ?? '').toLowerCase().includes(q) ||
          (p.role ?? '').toLowerCase().includes(q)
        )
      : [...people];

    if (sort === 'name')     list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'activity') list.sort((a, b) => {
      const ta = a.lastContact ? new Date(a.lastContact).getTime() : 0;
      const tb = b.lastContact ? new Date(b.lastContact).getTime() : 0;
      return tb - ta;
    });
    if (sort === 'health')   list.sort((a, b) => b.health - a.health);

    return list;
  }, [people, query, sort]);

  function healthDotColor(health: number) {
    return health >= 70 ? '#34d399' : health >= 40 ? '#fbbf24' : '#f87171';
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#475569', pointerEvents: 'none' }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar contactos…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12,
              paddingTop: 7, paddingBottom: 7,
              background: '#13151f', border: '1px solid #2a2d3e',
              borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          style={{
            padding: '7px 10px', background: '#13151f',
            border: '1px solid #2a2d3e', borderRadius: 8,
            color: '#94a3b8', fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="name">Nombre A-Z</option>
          <option value="activity">Última actividad</option>
          <option value="health">Salud relacional</option>
        </select>
        <span style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
          {filtered.length} de {people.length}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: '#475569', fontSize: 14, padding: '24px 0' }}>
          {query ? `Sin resultados para "${query}".` : 'Sin contactos.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(person => {
            const relType  = person.relationship_type ?? 'networking';
            const typeColor = REL_TYPE_COLORS[relType];
            return (
              <Link
                key={person.id}
                href={`/red/${person.slug ?? person.id}`}
                style={{
                  display: 'block',
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderRadius: 14,
                  padding: 18,
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(person.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 16, fontWeight: 700,
                  }}>
                    {initials(person.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                      <div title="Salud relacional" style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: healthDotColor(person.health),
                      }} />
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {person.name}
                      </p>
                    </div>
                    {(person.organization || person.role) ? (
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[person.role, person.organization].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: typeColor + '22',
                    border: `1px solid ${typeColor}44`,
                    color: typeColor,
                    borderRadius: 10, padding: '2px 8px',
                  }}>
                    {REL_TYPE_LABELS[relType]}
                  </span>
                  {person.stage && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: STAGE_COLOR[person.stage] ?? '#d1d5db',
                      color: '#111', borderRadius: 10, padding: '2px 8px',
                    }}>
                      {STAGE_LABEL[person.stage] ?? person.stage}
                    </span>
                  )}
                  {person.strength !== null && (
                    <span style={{ fontSize: 12, color: person.strength >= 70 ? '#34d399' : person.strength >= 40 ? '#fbbf24' : '#f87171', fontWeight: 600, marginLeft: 'auto' }}>
                      {person.strength} fuerza
                    </span>
                  )}
                </div>

                {person.notes && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {person.notes}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
