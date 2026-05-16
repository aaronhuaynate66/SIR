export const dynamic = 'force-dynamic';

const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://sir-web.vercel.app';
const SENTRY_AUTH_TOKEN = process.env['SENTRY_AUTH_TOKEN'];
const SENTRY_ORG       = process.env['SENTRY_ORG'];
const SENTRY_PROJECT   = process.env['SENTRY_PROJECT'];

interface HealthData {
  status:    'ok' | 'degraded' | 'down';
  supabase:  'ok' | 'error';
  neo4j:     'ok' | 'error';
  env:       string;
  version:   string;
  uptime:    number;
  timestamp: string;
}

interface SentryIssue {
  id:        string;
  title:     string;
  count:     string;
  lastSeen:  string;
  level:     string;
}

async function fetchHealth(): Promise<HealthData | null> {
  try {
    const res = await fetch(`${WEB_URL}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<HealthData>;
  } catch {
    return null;
  }
}

async function fetchSentryIssues(): Promise<SentryIssue[]> {
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) return [];
  try {
    const res = await fetch(
      `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?limit=10&query=is:unresolved`,
      {
        headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as Array<{ id: string; title: string; count: string; lastSeen: string; level: string }>;
    return data.map(i => ({
      id:       i.id,
      title:    i.title,
      count:    i.count,
      lastSeen: i.lastSeen,
      level:    i.level,
    }));
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: 'ok' | 'error' | 'degraded' | 'down' }) {
  const colors: Record<string, { bg: string; text: string }> = {
    ok:       { bg: '#d1fae5', text: '#065f46' },
    error:    { bg: '#fee2e2', text: '#991b1b' },
    degraded: { bg: '#fef3c7', text: '#92400e' },
    down:     { bg: '#fee2e2', text: '#991b1b' },
  };
  const c = colors[status] ?? colors['error']!;
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: 6, padding: '3px 10px',
      fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

function ServiceRow({ label, status }: { label: string; status: 'ok' | 'error' }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{label}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default async function MonitoringPage() {
  const [health, sentryIssues] = await Promise.all([fetchHealth(), fetchSentryIssues()]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Monitoring</h1>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Actualizado: {new Date().toLocaleTimeString('es')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Services Status */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937' }}>Estado de servicios</h2>
            {health && <StatusBadge status={health.status} />}
          </div>

          {health ? (
            <>
              <ServiceRow label="Supabase" status={health.supabase} />
              <ServiceRow label="Neo4j" status={health.neo4j} />
              <ServiceRow label="Variables de entorno" status={health.env === 'ok' ? 'ok' : 'error'} />
              <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Versión</span>
                  <code style={{ fontSize: 12, color: '#374151' }}>{health.version}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Uptime instancia</span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>{formatUptime(health.uptime)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Último check</span>
                  <span style={{ color: '#374151' }}>
                    {new Date(health.timestamp).toLocaleTimeString('es')}
                  </span>
                </div>
                {health.env !== 'ok' && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626', background: '#fee2e2', borderRadius: 6, padding: '6px 10px' }}>
                    {health.env}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
              <p style={{ margin: 0, fontSize: 14 }}>No se pudo obtener el health check</p>
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>{WEB_URL}/api/health</p>
            </div>
          )}
        </div>

        {/* Quick links & meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#1f2937' }}>Links rápidos</h2>
            {[
              { label: 'Web app', url: 'https://sir-web.vercel.app' },
              { label: 'Admin panel', url: 'https://sir-admin.vercel.app' },
              { label: 'Health API', url: `${WEB_URL}/api/health` },
              { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
              { label: 'Supabase Studio', url: 'https://app.supabase.com' },
            ].map(({ label, url }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0', borderBottom: '1px solid #f3f4f6',
                  textDecoration: 'none', color: '#374151', fontSize: 14,
                }}
              >
                <span>{label}</span>
                <span style={{ color: '#6366f1', fontSize: 12 }}>→</span>
              </a>
            ))}
          </div>

          <div style={{ background: '#ede9fe', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>
              Fase 6 completa — 36/36 módulos
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6d28d9' }}>
              SIR Sistema de Inteligencia Relacional en producción.
            </p>
          </div>
        </div>
      </div>

      {/* Sentry Issues */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937' }}>
            Errores Sentry
            {sentryIssues.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fee2e2', borderRadius: 10, padding: '2px 8px' }}>
                {sentryIssues.length}
              </span>
            )}
          </h2>
          {SENTRY_ORG && SENTRY_PROJECT && (
            <a
              href={`https://sentry.io/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}
            >
              Ver en Sentry →
            </a>
          )}
        </div>

        {!SENTRY_AUTH_TOKEN ? (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
            Configura <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>SENTRY_AUTH_TOKEN</code>,{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>SENTRY_ORG</code> y{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>SENTRY_PROJECT</code> en Vercel para ver errores aquí.
          </p>
        ) : sentryIssues.length === 0 ? (
          <p style={{ color: '#10b981', fontSize: 14, fontWeight: 600, margin: 0 }}>Sin errores sin resolver.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Nivel', 'Error', 'Ocurrencias', 'Último visto'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sentryIssues.map(issue => (
                <tr key={issue.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '2px 7px',
                      background: issue.level === 'error' ? '#fee2e2' : '#fef3c7',
                      color:      issue.level === 'error' ? '#991b1b' : '#92400e',
                    }}>
                      {issue.level}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 13, color: '#111827', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.title}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {Number(issue.count).toLocaleString('es')}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#9ca3af' }}>
                    {new Date(issue.lastSeen).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
