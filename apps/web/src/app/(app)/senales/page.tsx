import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import type { SocialSignalType } from '@sir/db';
import CaptureForm from './CaptureForm';
import VoiceNote from '@/components/VoiceNote';

export const dynamic = 'force-dynamic';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOCIAL_TYPES: SocialSignalType[] = [
  'promotion', 'job_change', 'travel', 'birthday', 'publication',
  'life_event', 'health_event', 'achievement', 'loss',
];

const SIGNAL_LABELS: Record<SocialSignalType, string> = {
  promotion:    'Promoción',
  job_change:   'Cambio de rol',
  travel:       'Viaje',
  birthday:     'Cumpleaños',
  publication:  'Publicación',
  life_event:   'Evento vital',
  health_event: 'Salud',
  achievement:  'Logro',
  loss:         'Pérdida',
};

const SIGNAL_COLORS: Record<SocialSignalType, string> = {
  promotion:    '#34d399',
  job_change:   '#818cf8',
  travel:       '#60a5fa',
  birthday:     '#f472b6',
  publication:  '#a78bfa',
  life_event:   '#fcd34d',
  health_event: '#94a3b8',
  achievement:  '#fbbf24',
  loss:         '#6b7280',
};

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarBg(name: string) { return AVATAR_COLORS[(name.codePointAt(0) ?? 0) % AVATAR_COLORS.length] ?? '#6366f1'; }
function initials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase(); }
function scoreColor(v: number) { return v >= 70 ? '#34d399' : v >= 40 ? '#fbbf24' : '#f87171'; }

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalRow {
  id: string;
  signal_type: SocialSignalType;
  opportunity_score: number;
  action_recommendation: string;
  person_id: string | null;
  source: string;
  created_at: string;
  payload: Record<string, unknown>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: { type?: string; person_id?: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db         = getServiceClient();
  const typeFilter = searchParams.type as SocialSignalType | undefined;
  const personFilter = searchParams.person_id;

  // Fetch signals
  let query = db.from('signals')
    .select('id, signal_type, opportunity_score, action_recommendation, person_id, source, created_at, payload')
    .eq('user_id', user.id)
    .not('signal_type', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60);

  if (typeFilter)   query = query.eq('signal_type', typeFilter);
  if (personFilter) query = query.eq('person_id', personFilter);

  const { data: rawSignals } = await query;
  const signals = (rawSignals ?? []) as SignalRow[];

  // Fetch people for the filter sidebar and for name resolution
  const personIds = [...new Set(signals.filter(s => s.person_id).map(s => s.person_id as string))];
  const [signalPeopleRes, allPeopleRes] = await Promise.all([
    personIds.length > 0
      ? db.from('people').select('id, name, organization').in('id', personIds)
      : Promise.resolve({ data: [] }),
    db.from('people').select('id, name').eq('user_id', user.id).order('name').limit(60),
  ]);

  const peopleMap = new Map(
    ((signalPeopleRes.data ?? []) as Array<{ id: string; name: string; organization: string | null }>)
      .map(p => [p.id, p])
  );
  const allPeople = (allPeopleRes.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Señales sociales</h1>
        <span style={{
          background: '#818cf8', color: '#fff', borderRadius: 20,
          padding: '2px 10px', fontSize: 12, fontWeight: 700,
        }}>
          {signals.length}
        </span>
      </div>

      {/* Capture form + Voice note */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1 }}><CaptureForm /></div>
        <VoiceNote />
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link href="/senales" style={filterChip(!typeFilter, '#818cf8')}>Todas</Link>
        {SOCIAL_TYPES.map(t => (
          <Link
            key={t}
            href={`/senales?type=${t}${personFilter ? `&person_id=${personFilter}` : ''}`}
            style={filterChip(typeFilter === t, SIGNAL_COLORS[t])}
          >
            {SIGNAL_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* Person filter */}
      {allPeople.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: '#475569', alignSelf: 'center', marginRight: 4 }}>
            Persona:
          </span>
          {personFilter && (
            <Link
              href={typeFilter ? `/senales?type=${typeFilter}` : '/senales'}
              style={filterChip(false, '#94a3b8')}
            >
              ✕ Limpiar
            </Link>
          )}
          {allPeople.slice(0, 12).map(p => (
            <Link
              key={p.id}
              href={`/senales?person_id=${p.id}${typeFilter ? `&type=${typeFilter}` : ''}`}
              style={filterChip(personFilter === p.id, '#ec4899')}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {/* Feed */}
      {signals.length === 0 ? (
        <div style={emptyCard}>
          <p style={{ color: '#475569', fontSize: 14, margin: '0 0 6px' }}>
            {typeFilter || personFilter ? 'No hay señales con estos filtros.' : 'No hay señales aún.'}
          </p>
          <p style={{ color: '#334155', fontSize: 12, margin: 0 }}>
            Usa el formulario de arriba para capturar una señal social de tu red.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {signals.map(signal => {
            const person = signal.person_id ? peopleMap.get(signal.person_id) : null;
            const color  = SIGNAL_COLORS[signal.signal_type] ?? '#94a3b8';
            const summary = typeof signal.payload['summary'] === 'string'
              ? signal.payload['summary']
              : null;

            return (
              <div key={signal.id} style={{
                background: '#1a1d27',
                border: '1px solid #2a2d3e',
                borderLeft: `3px solid ${color}`,
                borderRadius: '0 12px 12px 0',
                padding: '14px 18px',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {/* Signal type pill */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: color + '22', color, border: `1px solid ${color}44`,
                  }}>
                    {SIGNAL_LABELS[signal.signal_type]}
                  </span>

                  {/* Person */}
                  {person ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: avatarBg(person.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 9, fontWeight: 700,
                      }}>
                        {initials(person.name)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                        {person.name}
                      </span>
                      {person.organization && (
                        <span style={{ fontSize: 12, color: '#475569' }}>· {person.organization}</span>
                      )}
                    </div>
                  ) : null}

                  {/* Score */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 800,
                      color: scoreColor(signal.opportunity_score),
                    }}>
                      {signal.opportunity_score}
                    </div>
                    <span style={{ fontSize: 10, color: '#475569' }}>/ 100</span>
                    <span style={{ fontSize: 11, color: '#334155' }}>
                      {new Date(signal.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Content preview */}
                {summary && (
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                    {summary.slice(0, 160)}{summary.length > 160 ? '…' : ''}
                  </p>
                )}

                {/* Action recommendation */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
                    <span style={{ fontWeight: 600, color: color }}>Acción: </span>
                    {signal.action_recommendation}
                  </p>

                  {person && (
                    <Link
                      href={`/red/${person.id}`}
                      style={{
                        flexShrink: 0, padding: '6px 14px',
                        background: color + '22', border: `1px solid ${color}44`,
                        borderRadius: 8, color, fontSize: 12, fontWeight: 600,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      Actuar →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function filterChip(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 400,
    textDecoration: 'none',
    background: active ? color + '33' : '#1a1d27',
    color: active ? color : '#64748b',
    border: `1px solid ${active ? color + '66' : '#2a2d3e'}`,
  };
}

const emptyCard: React.CSSProperties = {
  background: '#1a1d27', border: '1px dashed #2a2d3e',
  borderRadius: 12, padding: 28, textAlign: 'center',
};
