import { redirect } from 'next/navigation';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import RelationshipGraph from './RelationshipGraph';
import type { DbPerson, DbRelationship } from '@sir/db';
import { trackServerEvent, EVENTS } from '@sir/analytics';

export const dynamic = 'force-dynamic';

// Relationship types that imply a real relationship regardless of activity
const ACTIVE_TYPES = new Set(['strategic', 'personal', 'family']);

export default async function GraphPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();

  const [{ data: peopleData }, { data: relsData }, { data: signalsData }] = await Promise.all([
    db.from('people').select('*').eq('user_id', user.id).order('name'),
    db.from('relationships').select('*').eq('user_id', user.id),
    db.from('signals')
      .select('person_id')
      .eq('user_id', user.id)
      .not('person_id', 'is', null),
  ]);

  const allPeople = (peopleData ?? []) as DbPerson[];
  const rels      = (relsData   ?? []) as DbRelationship[];

  // Build lookup structures
  const relMap = new Map(rels.map(r => [r.person_id, r]));

  const signalCountMap = new Map<string, number>();
  for (const s of (signalsData ?? []) as Array<{ person_id: string | null }>) {
    if (s.person_id) signalCountMap.set(s.person_id, (signalCountMap.get(s.person_id) ?? 0) + 1);
  }

  // Filter: only contacts with at least one real interaction signal
  const people = allPeople.filter(p => {
    if (ACTIVE_TYPES.has(p.relationship_type)) return true;
    if (relMap.get(p.id)?.last_contact_at)     return true;
    if (signalCountMap.has(p.id))              return true;
    return false;
  });

  trackServerEvent(user.id, EVENTS.GRAPH_VIEWED, {
    total_contacts: allPeople.length,
    graph_contacts: people.length,
  });

  // Serialize signal counts as plain object for the client component
  const signalCounts: Record<string, number> = Object.fromEntries(signalCountMap);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Grafo de relaciones</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          {people.length} persona{people.length !== 1 ? 's' : ''} con interacciones reales
          {allPeople.length > people.length && (
            <span style={{ color: '#334155' }}> · {allPeople.length - people.length} contactos sin actividad ocultos</span>
          )}
        </p>
      </div>
      <RelationshipGraph
        userName={user.email?.split('@')[0] ?? 'Tú'}
        people={people}
        relationships={rels}
        signalCounts={signalCounts}
      />
    </div>
  );
}
