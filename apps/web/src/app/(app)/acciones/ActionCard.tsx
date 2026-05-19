'use client';

import { useState, useCallback } from 'react';
import { Check, Clock, X, TrendingUp, ClipboardCopy, ClipboardCheck, ChevronDown } from 'lucide-react';
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
const URGENCY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
const URGENCY_LABEL = { high: 'URGENTE', medium: 'PRONTO', low: 'NORMAL' };

interface Props {
  action:     ActionWithPerson;
  onComplete: (id: string, personId: string) => void;
  onPostpone: (id: string) => void;
  onDismiss:  (id: string) => void;
  disabled?:  boolean;
}

export default function ActionCard({ action, onComplete, onPostpone, onDismiss, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [hovered,  setHovered]  = useState(false);

  const urgencyColor = URGENCY_COLOR[action.urgency] ?? '#94a3b8';
  const urgencyLabel = URGENCY_LABEL[action.urgency] ?? action.urgency.toUpperCase();
  const typeColor    = PR_COLORS[action.person_type]  ?? '#94a3b8';
  const typeLabel    = PR_LABELS[action.person_type]  ?? action.person_type;

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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(8px)',
        border:        `1px solid rgba(255,255,255,${hovered ? '0.12' : '0.07'})`,
        borderLeft:    `3px solid ${urgencyColor}`,
        borderRadius:  '0 14px 14px 0',
        padding:       '20px 22px',
        opacity:       disabled ? 0.6 : 1,
        transition:    'all 0.18s ease',
      }}
    >
      {/* Header: avatar + person info + urgency pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        {/* Avatar with type-colored ring */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: avatarColor(action.person_name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700,
          boxShadow: `0 0 0 2px #0d0f1a, 0 0 0 4px ${typeColor}55`,
        }}>
          {initials(action.person_name)}
        </div>

        {/* Name + category + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
              {action.person_name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: typeColor + '18', color: typeColor,
              border: `1px solid ${typeColor}30`,
            }}>
              {typeLabel}
            </span>
          </div>
          {(action.person_role ?? action.person_org) && (
            <p style={{ margin: 0, fontSize: 12, color: '#64748b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[action.person_role, action.person_org].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Urgency pill */}
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          padding: '4px 11px', borderRadius: 20,
          background: urgencyColor + '18', color: urgencyColor,
          border: `1px solid ${urgencyColor}30`,
          letterSpacing: '0.06em',
        }}>
          {urgencyLabel}
        </span>
      </div>

      {/* Action text */}
      <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4 }}>
        {action.action_text}
      </p>

      {/* Why now */}
      <p style={{ margin: '0 0 18px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>¿Por qué ahora?&nbsp;</span>
        {action.timing_reason}
      </p>

      {/* Suggested message — expandable */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, marginBottom: 10, overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 12, fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ opacity: 0.6 }}>💬</span> Mensaje sugerido
          </span>
          <ChevronDown
            size={13}
            style={{
              color: '#475569',
              transition: 'transform 0.15s',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>

        {expanded && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 14px' }}>
            <div style={{ position: 'relative' }}>
              <p style={{
                margin: 0, paddingRight: 32,
                fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
                fontSize: 12, color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap',
              }}>
                {action.message_suggestion}
              </p>
              <button
                type="button"
                onClick={copyMessage}
                title={copied ? 'Copiado' : 'Copiar mensaje'}
                style={{
                  position: 'absolute', top: 0, right: 0,
                  padding: '5px',
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  color: copied ? '#22c55e' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? <ClipboardCheck size={14} /> : <ClipboardCopy size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Impact */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 9,
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.14)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 18,
      }}>
        <TrendingUp size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.55 }}>
          {action.impact_prediction}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading || disabled}
          style={{
            flex: 2, padding: '8px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: '#16a34a', border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          <Check size={14} strokeWidth={2.5} />
          {loading ? 'Guardando…' : 'Hecho'}
        </button>
        <button
          type="button"
          onClick={() => handleStatus('postponed')}
          disabled={loading || disabled}
          style={{
            flex: 1, padding: '8px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, color: '#64748b', fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <Clock size={12} /> Posponer
        </button>
        <button
          type="button"
          onClick={() => handleStatus('dismissed')}
          disabled={loading || disabled}
          style={{
            flex: 1, padding: '8px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, color: '#475569', fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <X size={12} /> Descartar
        </button>
      </div>
    </div>
  );
}
