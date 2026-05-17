export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface WaitlistRow {
  id:         string;
  email:      string;
  name:       string | null;
  source:     string | null;
  position:   number;
  invited:    boolean;
  invited_at: string | null;
  created_at: string;
}

async function getData() {
  const db = getAdminClient();
  const { data, error } = await db.from('waitlist')
    .select('id, email, name, source, position, invited, invited_at, created_at')
    .order('position', { ascending: true })
    .limit(500);
  if (error) return [];
  return (data ?? []) as WaitlistRow[];
}

export default async function WaitlistAdminPage() {
  const rows = await getData();
  const total    = rows.length;
  const invited  = rows.filter(r => r.invited).length;
  const pending  = total - invited;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Lista de espera</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Chip label={`${total} total`}     color="#6366f1" />
          <Chip label={`${pending} pendientes`} color="#f59e0b" />
          <Chip label={`${invited} invitados`}  color="#10b981" />
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty text="Aún no hay nadie en la lista de espera." />
      ) : (
        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Email', 'Nombre', 'Fuente', 'Estado', 'Fecha'].map(h => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <Td>{r.position}</Td>
                  <Td bold>{r.email}</Td>
                  <Td>{r.name ?? '—'}</Td>
                  <Td><SourceBadge source={r.source} /></Td>
                  <Td>
                    {r.invited
                      ? <span style={badge('#dcfce7', '#15803d')}>Invitado</span>
                      : <span style={badge('#fef9c3', '#854d0e')}>Pendiente</span>
                    }
                  </Td>
                  <Td>{new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
        <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
          <strong>Para invitar a alguien:</strong> aplica la migración SQL en Supabase y luego actualiza el campo <code>invited = true</code> en la tabla <code>waitlist</code>. Sistema de invitación por email via Resend (configura RESEND_API_KEY).
        </p>
      </div>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 20, padding: '3px 12px' }}>
      {label}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: '#9ca3af', textAlign: 'center', padding: 48 }}>{text}</p>;
}

function SourceBadge({ source }: { source: string | null }) {
  const label = source ?? 'landing';
  const colors: Record<string, [string, string]> = {
    landing: ['#ede9fe', '#6d28d9'],
    beta:    ['#dcfce7', '#15803d'],
    referral:['#dbeafe', '#1d4ed8'],
  };
  const [bg, text] = colors[label] ?? ['#f3f4f6', '#374151'];
  return <span style={badge(bg, text)}>{label}</span>;
}

function badge(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 };
}

const tableWrap: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden',
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}

function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: 13, color: bold ? '#111827' : '#6b7280', fontWeight: bold ? 600 : 400 }}>
      {children}
    </td>
  );
}
