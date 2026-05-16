'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { updateProfileAction, type ProfilePrefs } from './actions';

const TIMEZONES = [
  'UTC', 'America/Lima', 'America/Bogota', 'America/Santiago',
  'America/Buenos_Aires', 'America/Mexico_City', 'America/New_York',
  'America/Los_Angeles', 'Europe/Madrid', 'Europe/London',
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props { initial: ProfilePrefs }

export default function ConfigForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProfilePrefs>(initial);
  const [saved, setSaved]    = useState(false);
  const [error, setError]    = useState('');
  const [isPending, start]   = useTransition();
  const [loggingOut, setOut] = useState(false);

  function set<K extends keyof ProfilePrefs>(key: K, val: ProfilePrefs[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    start(async () => {
      try {
        await updateProfileAction(form);
        setSaved(true);
      } catch (err) {
        setError(String(err));
      }
    });
  }

  async function handleLogout() {
    setOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Profile */}
      <Section title="Perfil">
        <Field label="Nombre">
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
        <Field label="Idioma">
          <select value={form.language} onChange={e => set('language', e.target.value)} style={inputStyle}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="Zona horaria">
          <select value={form.timezone} onChange={e => set('timezone', e.target.value)} style={inputStyle}>
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Notifications */}
      <Section title="Notificaciones">
        <ToggleField
          label="Emails de resumen semanal"
          desc="Recibe un resumen semanal de tu actividad relacional"
          checked={form.email_enabled}
          onChange={v => set('email_enabled', v)}
        />
        <ToggleField
          label="Notificaciones push"
          desc="Alertas en tiempo real sobre señales y cumpleaños"
          checked={form.push_enabled}
          onChange={v => set('push_enabled', v)}
        />
      </Section>

      {/* DND */}
      <Section title="Horario de silencio (DND)">
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
          No recibirás notificaciones entre estas horas
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Field label="Desde">
            <select value={form.dnd_start_hour} onChange={e => set('dnd_start_hour', Number(e.target.value))} style={{ ...inputStyle, width: 'auto' }}>
              {HOURS.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
            </select>
          </Field>
          <Field label="Hasta">
            <select value={form.dnd_end_hour} onChange={e => set('dnd_end_hour', Number(e.target.value))} style={{ ...inputStyle, width: 'auto' }}>
              {HOURS.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '10px 24px', background: isPending ? '#3730a3' : '#6366f1',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>

      {/* Footer links */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #2a2d3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/settings/privacy" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
          Privacidad y datos →
        </a>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid #2a2d3e',
            borderRadius: 7, color: '#94a3b8',
            fontSize: 13, cursor: loggingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #2a2d3e' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', background: '#13151f', border: '1px solid #2a2d3e',
      borderRadius: 10, marginBottom: 10, cursor: 'pointer',
    }}
      onClick={() => onChange(!checked)}
    >
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>{desc}</p>
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? '#6366f1' : '#2a2d3e',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3,
          left: checked ? 18 : 3, transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', background: '#13151f',
  border: '1px solid #2a2d3e', borderRadius: 7,
  color: '#e2e8f0', fontSize: 14, outline: 'none',
};
