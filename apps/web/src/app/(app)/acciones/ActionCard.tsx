'use client';

import { useState, useCallback } from 'react';
import type { ActionWithPerson } from './generate';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? '#6366f1'; }
function initials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase(); }

const PR_COLORS: Record<string, string> = {
  strategic: '#f59e0b', professional: '#3b82f6', personal: '#22c55e',
  family: '#ef4444', networking: '#94a3b8', developing: '#64748b',
};
const PR_LABELS: Record<string, string> = {
  strategic: 'Estratégico', professional: 'Profesional', personal: 'Personal',
  family: 'Familia', networking: 'Networking', developing: 'Desarrollo',
};
const URGENCY_COLOR = { high: '#ef4444', medium: '#fbbf24', low: '#34d399' };
const URGENCY_LABEL = { high: 'URGENTE', medium: 'PRONTO', low: 'FLEXIBLE' };
const URGENCY_BORDER = { high: '#ef444440', medium: '#fbbf2440', low: '#34d39940' };

interface Props {
  action:     ActionWithPerson;
  onComplete: (id: string, personId: string) => void;
  onPostpone: (id: string) => void;
  onDismiss:  (id: string) => void;
  disabled?:  boolean;
}

export default function ActionCard({ action, onComplete, onPostpone, onDismiss, disabled }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [copied,   setCopied]     = useState(false);
  const [loading,  setLoading]    = useState(false);

  const urgencyColor  = URGENCY_COLOR[action.urgency]  ?? '#94a3b8';
  const urgencyLabel  = URGENCY_LABEL[action.urgency]  ?? action.urgency.toUpperCase();
  const urgencyBorder = URGENCY_BORDER[action.urgency] ?? '#94a3b840';
  const typeColor     = PR_COLORS[action.person_type]  ?? '#94a3b8';
  const typeLabel     = PR_LABELS[action.person_type]  ?? action.person_type;

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(action.message_suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard access denied */ }
  }, [action.message_suggestion]);

  async function handleComplete() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await fetch('/api/actions/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ actionId: action.id, personId: action.person_id }),
      });
      onComplete(action.id, action.person_id);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(status: 'postponed' | 'dismissed') {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await fetch('/api/actions/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ actionId: action.id, status }),
      });
      if (status === 'postponed') onPostpone(action.id);
      else onDismiss(action.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background:  '#1a1d27',
      border:      `1px solid ${urgencyBorder}`,
      borderLeft:  `4px solid ${urgencyColor}`,
      borderRadius: '0 12px 12px 0',
      padding:     '16px 18px',
      opacity:     disabled ? 0.6 : 1,
      transition:  'opacity 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: avatarColor(action.person_name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700,
        }}>
          {initials(action.person_name)}
        </div>

        {/* Person info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
              {action.person_name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
              background: typeColor + '22', color: typeColor,
              border: `1px solid ${typeColor}44`,
            }}>
              {typeLabel}
            </span>
          </div>
          {(action.person_role ?? action.person_org) && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[action.person_role, action.person_org].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Urgency badge */}
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 800,
          padding: '3px 8px', borderRadius: 6,
          background: urgencyColor + '22', color: urgencyColor,
          border: `1px solid ${urgencyColor}44`,
          letterSpacing: '0.05em',
        }}>
          {urgencyLabel}
        </span>
      </div>

      {/* Action text */}
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
        {action.action_text}
      </p>

      {/* Why now */}
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
        <span style={{ color: '#475569', fontWeight: 600 }}>¿Por qué ahora? </span>
        {action.timing_reason}
      </p>

      {/* Expandable message */}
      <div style={{
        background: '#13151f', border: '1px solid #2a2d3e',
        borderRadius: 8, marginBottom: 12, overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', fontSize: 12, fontWeight: 600,
          }}
        >
          <span>💬 Mensaje sugerido</span>
          <span style={{ fontSize: 10, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>

        {expanded && (
          <div style={{ borderTop: '1px solid #2a2d3e', padding: '12px 14px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {action.message_suggestion}
            </p>
            <button
              type="button"
              onClick={copyMessage}
              style={{
                padding: '5px 12px', background: copied ? '#22c55e22' : '#6366f122',
                border: `1px solid ${copied ? '#22c55e44' : '#6366f144'}`,
                borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                color: copied ? '#22c55e' : '#818cf8',
                transition: 'all 0.15s',
              }}
            >
              {copied ? '✓ Copiado' : '📋 Copiar mensaje'}
            </button>
          </div>
        )}
      </div>

      {/* Impact prediction */}
      <div style={{
        background: '#6366f10a', border: '1px solid #6366f122',
        borderRadius: 8, padding: '8px 12px', marginBottom: 14,
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>Impacto: </span>
          {action.impact_prediction}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading || disabled}
          style={{
            flex: 2, padding: '8px 12px',
            background: '#22c55e', border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {loading ? '…' : '✓ Hecho'}
        </button>
        <button
          type="button"
          onClick={() => handleStatus('postponed')}
          disabled={loading || disabled}
          style={{
            flex: 1, padding: '8px 8px',
            background: 'transparent', border: '1px solid #2a2d3e',
            borderRadius: 8, color: '#64748b', fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          Posponer
        </button>
        <button
          type="button"
          onClick={() => handleStatus('dismissed')}
          disabled={loading || disabled}
          style={{
            flex: 1, padding: '8px 8px',
            background: 'transparent', border: '1px solid #2a2d3e',
            borderRadius: 8, color: '#475569', fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
