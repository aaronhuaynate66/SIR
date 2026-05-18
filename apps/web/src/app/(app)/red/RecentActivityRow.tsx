import Link from 'next/link';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? '#6366f1'; }
function initials(name: string) { return name.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase(); }

export interface RecentPerson {
  id: string;
  name: string;
  organization: string | null;
  role: string | null;
  slug: string | null;
  activityLabel: string;
  activityAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7)   return `hace ${days}d`;
  if (days < 30)  return `hace ${Math.floor(days / 7)}sem`;
  return `hace ${Math.floor(days / 30)}mes`;
}

export default function RecentActivityRow({
  people,
  title,
}: {
  people: RecentPerson[];
  title: string;
}) {
  if (people.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
        {title}
      </h2>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}>
        {people.map(p => (
          <Link
            key={p.id}
            href={`/red/${p.slug ?? p.id}`}
            style={{
              flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              width: 160, padding: '14px 14px 12px',
              background: '#1a1d27', border: '1px solid #2a2d3e',
              borderRadius: 12, textDecoration: 'none',
              gap: 8,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: avatarColor(p.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>
              {initials(p.name)}
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </p>
              {(p.role || p.organization) && (
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[p.role, p.organization].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid #2a2d3e', paddingTop: 8 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#6366f1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.activityLabel}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#475569' }}>
                {timeAgo(p.activityAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
