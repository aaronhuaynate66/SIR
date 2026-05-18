import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import type { DbPerson, PersonRelationshipType } from '@sir/db';
import NewPersonButton from './NewPersonButton';
import PeopleGridClient, { type PersonRow } from './PeopleGridClient';
import RecentActivityRow, { type RecentPerson } from './RecentActivityRow';

export const dynamic = 'force-dynamic';

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

const FILTER_CHIPS: Array<{ value: PersonRelationshipType | 'all'; label: string }> = [
  { value: 'all',          label: 'Todos' },
  { value: 'strategic',    label: '🎯 Estratégico' },
  { value: 'professional', label: '👔 Profesional' },
  { value: 'personal',     label: '❤️ Personal' },
  { value: 'family',       label: '👨‍👩‍👧 Familia' },
  { value: 'networking',   label: '🤝 Networking' },
  { value: 'developing',   label: '🌱 Por desarrollar' },
];

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  relationship: 'Nueva relación', job_change: 'Cambio de trabajo',
  promotion: 'Promoción', birthday: 'Cumpleaños', achievement: 'Logro',
  life_event: 'Evento de vida', travel: 'Viaje', publication: 'Publicación',
  health_event: 'Evento de salud', loss: 'Pérdida', interaction: 'Interacción',
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();
  const typeFilter = (searchParams?.type ?? '') as PersonRelationshipType | '';
  const activeFilter = typeFilter || 'all';

  // Build people query (with optional type filter)
  let peopleQuery = db
    .from('people')
    .select('id, name, organization, role, email, notes, relationship_type, slug, created_at')
    .eq('user_id', user.id)
    .order('name');

  if (typeFilter) {
    peopleQuery = peopleQuery.eq('relationship_type', typeFilter) as typeof peopleQuery;
  }

  const [
    { data: peopleData },
    { data: relsData },
    { data: signalsData },
  ] = await Promise.all([
    peopleQuery,
    db.from('relationships')
      .select('person_id, strength, stage, last_contact_at, contact_frequency_days')
      .eq('user_id', user.id),
    // Most recent social signals per person (person_id set by social intelligence pipeline)
    db.from('signals')
      .select('person_id, signal_type, created_at')
      .eq('user_id', user.id)
      .not('person_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const people = (peopleData ?? []) as (DbPerson & { relationship_type: PersonRelationshipType })[];
  const relMap = new Map(
    ((relsData ?? []) as Array<{ person_id: string; strength: number; stage: string; last_contact_at: string | null; contact_frequency_days: number | null }>)
      .map(r => [r.person_id, r])
  );

  // Compute health score
  function healthScore(personId: string): number {
    const rel = relMap.get(personId);
    if (!rel) return 0;
    let freqScore = 50;
    if (rel.last_contact_at) {
      const days = (Date.now() - new Date(rel.last_contact_at).getTime()) / 86_400_000;
      const expected = rel.contact_frequency_days ?? 30;
      freqScore = Math.max(0, Math.min(100, 100 - (days / expected) * 50));
    }
    return Math.round(freqScore * 0.4 + (rel.strength ?? 50) * 0.6);
  }

  // Build PersonRow list for client grid
  const personRows: PersonRow[] = people.map(p => {
    const rel = relMap.get(p.id);
    return {
      id:               p.id,
      name:             p.name,
      organization:     p.organization ?? null,
      role:             p.role ?? null,
      notes:            p.notes ?? null,
      relationship_type: p.relationship_type ?? 'networking',
      slug:             (p as DbPerson & { slug?: string | null }).slug ?? null,
      health:           healthScore(p.id),
      strength:         rel?.strength ?? null,
      stage:            rel?.stage ?? null,
      lastContact:      rel?.last_contact_at ?? null,
    };
  });

  // Build "Actividad reciente": top 10 people by most recent signal
  const peopleById = new Map(people.map(p => [p.id, p]));
  const activityMap = new Map<string, { label: string; at: string }>();

  type SignalRow = { person_id: string | null; signal_type: string | null; created_at: string };
  for (const s of (signalsData ?? []) as SignalRow[]) {
    if (!s.person_id) continue;
    if (!activityMap.has(s.person_id)) {
      activityMap.set(s.person_id, {
        label: SIGNAL_TYPE_LABELS[s.signal_type ?? ''] ?? 'Nueva señal',
        at:    s.created_at,
      });
    }
  }

  // Fallback 1: people with recent last_contact_at
  if (activityMap.size < 8) {
    const sorted = [...relMap.entries()]
      .filter(([, r]) => r.last_contact_at)
      .sort((a, b) => new Date(b[1].last_contact_at!).getTime() - new Date(a[1].last_contact_at!).getTime());
    for (const [pid, r] of sorted) {
      if (activityMap.size >= 10) break;
      if (!activityMap.has(pid) && peopleById.has(pid)) {
        activityMap.set(pid, { label: 'Último contacto', at: r.last_contact_at! });
      }
    }
  }

  // Determine title and whether we're in activity vs recency mode
  const hasSignalActivity = activityMap.size > 0;

  // Fallback 2: most recently added people (created_at DESC) — always fills the row
  let recentPeople: RecentPerson[] = [...activityMap.entries()]
    .sort((a, b) => new Date(b[1].at).getTime() - new Date(a[1].at).getTime())
    .slice(0, 10)
    .flatMap(([pid, act]) => {
      const p = peopleById.get(pid);
      if (!p) return [];
      return [{
        id:            p.id,
        name:          p.name,
        organization:  p.organization ?? null,
        role:          p.role ?? null,
        slug:          (p as DbPerson & { slug?: string | null }).slug ?? null,
        activityLabel: act.label,
        activityAt:    act.at,
      }];
    });

  // If still empty, use newest people from the people array
  if (recentPeople.length === 0 && people.length > 0) {
    const byCreated = [...people]
      .sort((a, b) => new Date((b as DbPerson & { created_at?: string }).created_at ?? 0).getTime()
                    - new Date((a as DbPerson & { created_at?: string }).created_at ?? 0).getTime())
      .slice(0, 8);
    recentPeople = byCreated.map(p => ({
      id:            p.id,
      name:          p.name,
      organization:  p.organization ?? null,
      role:          p.role ?? null,
      slug:          (p as DbPerson & { slug?: string | null }).slug ?? null,
      activityLabel: 'Nuevo contacto',
      activityAt:    (p as DbPerson & { created_at?: string }).created_at ?? new Date().toISOString(),
    }));
  }

  const activityRowTitle = hasSignalActivity ? 'Actividad reciente' : 'Agregados recientemente';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Personas</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            {people.length} contacto{people.length !== 1 ? 's' : ''} en tu red
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/red/salud" style={{ color: '#818cf8', fontSize: 12, textDecoration: 'none', padding: '5px 10px', border: '1px solid #2a2d3e', borderRadius: 6 }}>
            Ver salud →
          </Link>
          <NewPersonButton />
        </div>
      </div>

      {/* Actividad reciente / Agregados recientemente */}
      <RecentActivityRow people={recentPeople} title={activityRowTitle} />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTER_CHIPS.map(chip => {
          const isActive = activeFilter === chip.value;
          const color = chip.value !== 'all' ? REL_TYPE_COLORS[chip.value as PersonRelationshipType] : '#818cf8';
          return (
            <Link
              key={chip.value}
              href={chip.value === 'all' ? '/red' : `/red?type=${chip.value}`}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? color + '33' : '#1a1d27',
                border: `1px solid ${isActive ? color : '#2a2d3e'}`,
                color: isActive ? color : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      {/* Grid */}
      {people.length === 0 ? (
        <div>
          {activeFilter === 'all' && (
            <Link href="/config/integraciones" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1a1d27',
              border: '1px solid #6366f1',
              borderRadius: 12,
              padding: '14px 20px',
              textDecoration: 'none',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>G</span>
                <div>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 2px', fontSize: 14 }}>
                    Importa tus contactos de Google en un click
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                    Conecta Google Contacts y Calendar para poblar tu red automáticamente
                  </p>
                </div>
              </div>
              <span style={{ color: '#818cf8', fontSize: 18 }}>→</span>
            </Link>
          )}
          <div style={{ background: '#1a1d27', border: '1px dashed #2a2d3e', borderRadius: 14, padding: 48, textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: 16, marginBottom: 8 }}>
              {activeFilter !== 'all' ? `Sin contactos de tipo "${REL_TYPE_LABELS[activeFilter as PersonRelationshipType]}".` : 'No hay personas registradas todavía.'}
            </p>
            <p style={{ color: '#334155', fontSize: 13 }}>
              {activeFilter !== 'all' ? (
                <Link href="/red" style={{ color: '#818cf8', textDecoration: 'none' }}>Ver todos los contactos →</Link>
              ) : (
                'Crea tu primer contacto con el botón de arriba.'
              )}
            </p>
          </div>
        </div>
      ) : (
        <PeopleGridClient people={personRows} />
      )}
    </div>
  );
}
