import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, getServiceClient } from '@/lib/supabase-server';
import type { DbMemory } from '@sir/db';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = getServiceClient();
  const { data } = await db.from('memories')
    .select('id, content, metadata, importance, created_at')
    .eq('user_id', user.id)
    .eq('layer', 'social')
    .is('expires_at', null)
    .order('importance', { ascending: false });

  const contacts = (data ?? []) as DbMemory[];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>Personas</h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 32px' }}>
        {contacts.length} contacto{contacts.length !== 1 ? 's' : ''} en tu red
      </p>

      {contacts.length === 0 ? (
        <div style={{ background: '#1a1d27', border: '1px dashed #2a2d3e', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#475569', marginBottom: 8 }}>No hay personas registradas todavía.</p>
          <p style={{ color: '#334155', fontSize: 13 }}>
            Envía una señal <code style={{ color: '#818cf8' }}>relationship</code> con{' '}
            <code style={{ color: '#818cf8' }}>{'{"name":"Nombre","notes":"…"}'}</code> en el payload.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {contacts.map(contact => {
            const meta = contact.metadata as Record<string, unknown>;
            const name = typeof meta['name'] === 'string' ? meta['name'] : contact.content.slice(0, 30);
            const notes = typeof meta['notes'] === 'string' ? meta['notes'] : contact.content;
            return (
              <Link key={contact.id} href={`/people/${contact.id}`} style={{
                display: 'block',
                background: '#1a1d27',
                border: '1px solid #2a2d3e',
                borderRadius: 12,
                padding: 20,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#2a2d3e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#818cf8', fontSize: 18, fontWeight: 700,
                  }}>
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                      Importancia: {Math.round(contact.importance * 100)}%
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  {notes.slice(0, 80)}{notes.length > 80 ? '…' : ''}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
