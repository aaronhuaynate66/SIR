'use client';

import { useState } from 'react';

interface Props {
  connected:       boolean;
  lastSyncAt:      string | null;
  contactsSynced:  number;
  eventsSynced:    number;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function OutlookCard({ connected, lastSyncAt, contactsSynced, eventsSynced }: Props) {
  const [syncing, setSyncing]       = useState(false);
  const [contacts, setContacts]     = useState(contactsSynced);
  const [events, setEvents]         = useState(eventsSynced);
  const [lastSync, setLastSync]     = useState(lastSyncAt);
  const [isConn, setIsConn]         = useState(connected);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg]               = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMsg(null);
    try {
      const [cr, er] = await Promise.all([
        fetch('/api/integrations/microsoft/sync-contacts', { method: 'POST' }),
        fetch('/api/integrations/microsoft/sync-calendar', { method: 'POST' }),
      ]);
      const [cd, ed] = await Promise.all([
        cr.json() as Promise<{ created?: number; updated?: number }>,
        er.json() as Promise<{ meetings_processed?: number }>,
      ]);
      setContacts(prev => prev + (cd.created ?? 0) + (cd.updated ?? 0));
      setEvents(ed.meetings_processed ?? events);
      setLastSync(new Date().toISOString());
      setMsg(`Sync completado: ${(cd.created ?? 0) + (cd.updated ?? 0)} contactos, ${ed.meetings_processed ?? 0} reuniones`);
    } catch {
      setMsg('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await fetch('/api/integrations/microsoft/disconnect', { method: 'POST' });
    setIsConn(false);
    setConfirming(false);
    setContacts(0);
    setEvents(0);
    setLastSync(null);
  }

  return (
    <div style={{
      background: '#1a1d27',
      border: `1px solid ${isConn ? '#0078d4' : '#2a2d3e'}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isConn ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#0078d4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>
            O
          </div>
          <div>
            <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 2px', fontSize: 15 }}>
              Outlook / Microsoft 365
            </p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              {isConn
                ? `Contactos y Calendario · Última sync: ${fmt(lastSync)}`
                : 'Importa contactos de Outlook y reuniones de calendario'}
            </p>
          </div>
        </div>

        {!isConn ? (
          <a
            href="/api/integrations/microsoft/connect"
            style={{
              background: '#0078d4', color: '#fff',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Conectar con Microsoft
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: '#0078d422', color: '#60a5fa',
              borderRadius: 6, padding: '3px 8px',
            }}>
              CONECTADO
            </span>
          </div>
        )}
      </div>

      {/* Connected stats + actions */}
      {isConn && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contactos</p>
              <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, margin: 0 }}>{contacts}</p>
            </div>
            <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reuniones</p>
              <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, margin: 0 }}>{events}</p>
            </div>
          </div>

          {msg && (
            <p style={{ fontSize: 12, color: msg.startsWith('Error') ? '#f87171' : '#34d399', margin: '0 0 10px', background: '#0f1117', borderRadius: 6, padding: '6px 10px' }}>
              {msg}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                background: '#0078d4', color: '#fff',
                border: 'none', borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.6 : 1,
              }}
            >
              {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>

            {confirming ? (
              <>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>¿Seguro?</span>
                <button
                  onClick={handleDisconnect}
                  style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Sí, desconectar
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  style={{ background: '#2a2d3e', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                style={{ background: 'none', color: '#64748b', border: '1px solid #2a2d3e', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
              >
                Desconectar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
