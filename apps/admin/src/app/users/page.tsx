export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string | null;
}

async function getUsersWithStats() {
  const db = getAdminClient();

  const { data: users, error } = await db
    .from('users')
    .select('id, email, created_at, last_sign_in_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !users) return [];

  const stats = await Promise.all(
    (users as UserRow[]).map(async (u) => {
      const [signals, memories, people, briefings, actionsCompleted, lastEvent] = await Promise.all([
        db.from('signals').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        db.from('memories').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        db.from('people').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        db.from('briefing_logs').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        db.from('action_suggestions').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'completed'),
        db.from('analytics_events').select('created_at').eq('user_id', u.id).order('created_at', { ascending: false }).limit(1),
      ]);
      return {
        ...u,
        signalCount:          signals.count         ?? 0,
        memoryCount:          memories.count        ?? 0,
        peopleCount:          people.count          ?? 0,
        briefingCount:        briefings.count       ?? 0,
        actionsCompleted:     actionsCompleted.count ?? 0,
        lastActivity:         (lastEvent.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null,
      };
    })
  );

  return stats;
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60)   return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

export default async function UsersPage() {
  const users = await getUsersWithStats();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Usuarios</h1>
        <span style={{ fontSize: 13, color: '#6b7280', background: '#e5e7eb', borderRadius: 20, padding: '4px 12px', fontWeight: 600 }}>
          {users.length} registrado{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Email', 'Contactos', 'Briefings', 'Acciones ✓', 'Señales', 'Último acceso', 'Últ. actividad', 'Registro'].map(h => (
                <th
                  key={h}
                  style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  Sin usuarios registrados
                </td>
              </tr>
            ) : users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.email}</div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', marginTop: 1 }}>{u.id.slice(0, 10)}…</div>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Chip value={u.peopleCount}       color="#dcfce7" text="#15803d" />
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Chip value={u.briefingCount}     color="#ede9fe" text="#6d28d9" />
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Chip value={u.actionsCompleted}  color="#d1fae5" text="#065f46" />
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Chip value={u.signalCount}       color="#dbeafe" text="#1d4ed8" />
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>
                  {relTime(u.last_sign_in_at)}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: u.lastActivity ? '#6b7280' : '#d1d5db' }}>
                  {relTime(u.lastActivity)}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#9ca3af' }}>
                  {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ value, color, text }: { value: number; color: string; text: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color, color: text,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 12, fontWeight: 700,
      minWidth: 28, textAlign: 'center',
    }}>
      {value}
    </span>
  );
}
