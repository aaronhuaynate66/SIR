'use client';

import { useState } from 'react';

interface Props {
  connected:       boolean;
  lastSyncAt:      string | null;
  contactsSynced:  number;
  eventsSynced:    number;
}

export default function GoogleCard({ connected, lastSyncAt, contactsSynced, eventsSynced }: Props) {
  const [syncing,      setSyncing]      = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncMsg,      setSyncMsg]      = useState('');
  const [errMsg,       setErrMsg]       = useState('');

  const [localConnected,      setLocalConnected]      = useState(connected);
  const [localContactsSynced, setLocalContactsSynced] = useState(contactsSynced);
  const [localEventsSynced,   setLocalEventsSynced]   = useState(eventsSynced);
  const [localLastSync,       setLocalLastSync]        = useState(lastSyncAt);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    setErrMsg('');
    try {
      const [cRes, calRes] = await Promise.all([
        fetch('/api/integrations/google/sync-contacts', { method: 'POST' }),
        fetch('/api/integrations/google/sync-calendar', { method: 'POST' }),
      ]);
      const cData   = await cRes.json()   as { created?: number; updated?: number; error?: string };
      const calData = await calRes.json() as { meetings_processed?: number; interactions_created?: number; error?: string };

      if (!cRes.ok)   { setErrMsg(cData.error   ?? 'Error sincronizando contactos'); return; }
      if (!calRes.ok) { setErrMsg(calData.error  ?? 'Error sincronizando calendario'); return; }

      const newContacts = (cData.created ?? 0) + (cData.updated ?? 0);
      setLocalContactsSynced(prev => prev + newContacts);
      setLocalEventsSynced(prev => prev + (calData.meetings_processed ?? 0));
      setLocalLastSync(new Date().toISOString());
      setSyncMsg(`✓ ${newContacts} contactos, ${calData.meetings_processed ?? 0} reuniones`);
    } catch {
      setErrMsg('Error de red');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Google? Se eliminarán los tokens almacenados.')) return;
    setDisconnecting(true);
    setErrMsg('');
    try {
      const res = await fetch('/api/integrations/google/disconnect', { method: 'DELETE' });
      if (res.ok) {
        setLocalConnected(false);
        setSyncMsg('');
      } else {
        setErrMsg('Error al desconectar');
      }
    } catch {
      setErrMsg('Error de red');
    } finally {
      setDisconnecting(false);
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2a2d3e',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#13151f', border: '1px solid #2a2d3e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            G
          </div>
          <div>
            <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 2px', fontSize: 15 }}>
              Google Contacts &amp; Calendar
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 600,
              borderRadius: 20, padding: '2px 8px',
              background: localConnected ? '#bbf7d033' : '#f1f5f933',
              color:      localConnected ? '#86efac'   : '#64748b',
            }}>
              {localConnected ? '● Conectado' : '○ No conectado'}
            </span>
          </div>
        </div>
      </div>

      {localConnected && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 16,
          background: '#13151f', borderRadius: 8, padding: '10px 14px',
        }}>
          <div>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px' }}>Contactos importados</p>
            <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, margin: 0 }}>{localContactsSynced}</p>
          </div>
          <div style={{ width: 1, background: '#2a2d3e' }} />
          <div>
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px' }}>Reuniones procesadas</p>
            <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, margin: 0 }}>{localEventsSynced}</p>
          </div>
          {localLastSync && (
            <>
              <div style={{ width: 1, background: '#2a2d3e' }} />
              <div>
                <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px' }}>Última sync</p>
                <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, margin: 0 }}>{formatDate(localLastSync)}</p>
              </div>
            </>
          )}
        </div>
      )}

      {syncMsg && (
        <p style={{ color: '#86efac', fontSize: 13, margin: '0 0 12px', background: '#bbf7d01a', padding: '6px 10px', borderRadius: 6 }}>
          {syncMsg}
        </p>
      )}
      {errMsg && (
        <p style={{ color: '#fca5a5', fontSize: 13, margin: '0 0 12px', background: '#fca5a51a', padding: '6px 10px', borderRadius: 6 }}>
          {errMsg}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {!localConnected ? (
          <a
            href="/api/integrations/google/connect"
            style={{
              display: 'inline-block',
              padding: '9px 18px',
              background: '#6366f1',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Conectar con Google
          </a>
        ) : (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '9px 18px',
                background: syncing ? '#2a2d3e' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #2a2d3e',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: disconnecting ? 'not-allowed' : 'pointer',
              }}
            >
              {disconnecting ? 'Desconectando…' : 'Desconectar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
