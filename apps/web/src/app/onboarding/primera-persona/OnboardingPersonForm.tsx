'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOnboardingPersonAction } from '../actions';

const REL_TYPES = [
  { value: 'networking',   label: '🤝 Networking' },
  { value: 'professional', label: '👔 Profesional' },
  { value: 'strategic',    label: '🎯 Estratégico' },
  { value: 'personal',     label: '❤️ Personal' },
  { value: 'family',       label: '👨‍👩‍👧 Familia' },
  { value: 'developing',   label: '🌱 Por desarrollar' },
];

export default function OnboardingPersonForm() {
  const router  = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError('');
    const result = await createOnboardingPersonAction(new FormData(formRef.current));
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else if (result.personId) {
      const params = new URLSearchParams({ personId: result.personId, personName: result.personName ?? '' });
      router.push(`/onboarding/screenshot?${params.toString()}`);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nombre *</label>
        <input
          name="name"
          required
          placeholder="Ana García"
          autoFocus
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Tipo de relación *</label>
        <select name="relationship_type" defaultValue="networking" required style={{ ...inputStyle, cursor: 'pointer' }}>
          {REL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width: '100%', padding: '12px',
          background: saving ? '#3730a3' : '#6366f1',
          color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1, marginBottom: 14,
        }}
      >
        {saving ? 'Creando…' : 'Agregar persona →'}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', background: '#13151f',
  border: '1px solid #2a2d3e', borderRadius: 8,
  color: '#e2e8f0', fontSize: 14, outline: 'none',
};
