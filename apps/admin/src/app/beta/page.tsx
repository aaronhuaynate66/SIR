export const dynamic = 'force-dynamic';

import { getAdminClient } from '@/lib/supabase-server';

interface BetaRow {
  id:           string;
  name:         string;
  email:        string;
  linkedin_url: string | null;
  role:         string | null;
  company:      string | null;
  reason:       string | null;
  status:       'pending' | 'approved' | 'rejected';
  created_at:   string;
  reviewed_at:  string | null;
}

async function getData() {
  const db = getAdminClient();
  const { data, error } = await db.from('beta_applications')
    .select('id, name, email, linkedin_url, role, company, reason, status, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return (data ?? []) as BetaRow[];
}

const STATUS_LABELS: Record<BetaRow['status'], [string, string, string]> = {
  pending:  ['#fef9c3', '#854d0e', 'Pendiente'],
  approved: ['#dcfce7', '#15803d', 'Aprobado'],
  rejected: ['#fee2e2', '#991b1b', 'Rechazado'],
};

export default async function BetaAdminPage() {
  const rows    = await getData();
  const total    = rows.length;
  const pending  = rows.filter(r => r.status === 'pending').length;
  const approved = rows.filter(r => r.status === 'approved').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Aplicaciones Beta</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Chip label={`${total} total`}      color="#6366f1" />
          <Chip label={`${pending} pendientes`} color="#f59e0b" />
          <Chip label={`${approved} aprobados`} color="#10b981" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 48 }}>Aún no hay aplicaciones.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(r => {
            const [bg, color, label] = STATUS_LABELS[r.status];
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${color}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{r.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: bg, color, padding: '2px 8px', borderRadius: 20 }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                      {r.email}
                      {r.role && ` · ${r.role}`}
                      {r.company && ` @ ${r.company}`}
                      {r.linkedin_url && (
                        <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: '#6366f1', textDecoration: 'none', fontSize: 12 }}>LinkedIn →</a>
                      )}
                    </div>
                    {r.reason && (
                      <p style={{ fontSize: 13, color: '#374151', background: '#f9fafb', borderRadius: 6, padding: '10px 12px', margin: 0, lineHeight: 1.6 }}>
                        &ldquo;{r.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>
                      {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <ActionNote action="approve" id={r.id} />
                        <ActionNote action="reject"  id={r.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
        <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
          <strong>Para aprobar/rechazar:</strong> actualiza el campo <code>status</code> en la tabla <code>beta_applications</code> directamente en Supabase.
          Al aprobar, crea el usuario en Supabase Auth y envía las credenciales por email.
        </p>
      </div>
    </div>
  );
}

function ActionNote({ action, id }: { action: 'approve' | 'reject'; id: string }) {
  const isApprove = action === 'approve';
  return (
    <span
      title={`Actualiza status='${isApprove ? 'approved' : 'rejected'}' WHERE id='${id}' en Supabase`}
      style={{
        fontSize: 11, fontWeight: 600,
        background: isApprove ? '#dcfce7' : '#fee2e2',
        color:      isApprove ? '#15803d' : '#991b1b',
        padding: '3px 10px', borderRadius: 6, cursor: 'default',
        display: 'block', textAlign: 'center',
      }}
    >
      {isApprove ? 'Aprobar ✓' : 'Rechazar ✗'}
    </span>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 20, padding: '3px 12px' }}>
      {label}
    </span>
  );
}
