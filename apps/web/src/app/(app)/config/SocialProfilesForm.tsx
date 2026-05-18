'use client';

import { useState, useTransition } from 'react';
import { updateSocialProfileAction } from './actions';

interface SocialProfile {
  linkedin_url:        string | null;
  instagram_username:  string | null;
  twitter_username:    string | null;
  tiktok_username:     string | null;
}

interface NetworkCardProps {
  icon:        string;
  label:       string;
  color:       string;
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
  onSave:      () => void;
  saving:      boolean;
  saved:       boolean;
  matches?:    number | null | undefined;
  error?:      string | undefined;
  hint?:       string | undefined;
}

function NetworkCard({
  icon, label, color, placeholder, value, onChange, onSave, saving, saved, matches, error, hint,
}: NetworkCardProps) {
  return (
    <div style={{
      background: '#13151f',
      border: `1px solid ${saved ? color + '55' : '#2a2d3e'}`,
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 12,
      transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 20, marginRight: 10 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{label}</span>
        {saved && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 11, fontWeight: 700,
            color: color, background: color + '22',
            padding: '2px 8px', borderRadius: 12,
            letterSpacing: '0.04em',
          }}>
            CONECTADO
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '9px 12px',
            background: '#0d0f1a', border: '1px solid #2a2d3e',
            borderRadius: 7, color: '#e2e8f0', fontSize: 14,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '9px 16px', borderRadius: 7, border: 'none',
            background: saving ? '#3730a3' : '#6366f1',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap',
          }}
        >
          {saving ? '…' : 'Guardar'}
        </button>
      </div>

      {hint && !saved && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>{hint}</p>
      )}
      {error && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>
      )}
      {saved && matches != null && matches > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: color }}>
          ✓ {matches} contacto{matches !== 1 ? 's' : ''} con este perfil en tu red
        </p>
      )}
      {saved && matches === 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>
          Ningún contacto coincide aún — SIR lo detectará automáticamente al capturar perfiles
        </p>
      )}
    </div>
  );
}

interface Props { initial: SocialProfile }

export default function SocialProfilesForm({ initial }: Props) {
  const [fields, setFields] = useState<SocialProfile>(initial);
  const [matches, setMatches] = useState<Record<string, number | null>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (initial.linkedin_url)       s.add('linkedin_url');
    if (initial.instagram_username) s.add('instagram_username');
    if (initial.twitter_username)   s.add('twitter_username');
    if (initial.tiktok_username)    s.add('tiktok_username');
    return s;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function handleSave(key: keyof SocialProfile) {
    setSavingKey(key);
    setErrors(prev => ({ ...prev, [key]: '' }));
    start(() => {
      void (async () => {
        try {
          const result = await updateSocialProfileAction(key, fields[key] || null);
          setSavedKeys(prev => {
            const next = new Set(prev);
            if (fields[key]) next.add(key); else next.delete(key);
            return next;
          });
          if (result?.matches) {
            setMatches(prev => ({ ...prev, ...result.matches }));
          }
        } catch (err) {
          setErrors(prev => ({ ...prev, [key]: String(err) }));
        } finally {
          setSavingKey(null);
        }
      })();
    });
  }

  return (
    <div>
      <NetworkCard
        icon="💼" label="LinkedIn" color="#0a66c2"
        placeholder="https://linkedin.com/in/tu-perfil"
        value={fields.linkedin_url ?? ''}
        onChange={v => setFields(p => ({ ...p, linkedin_url: v }))}
        onSave={() => handleSave('linkedin_url')}
        saving={savingKey === 'linkedin_url'}
        saved={savedKeys.has('linkedin_url')}
        matches={matches['linkedin'] ?? (savedKeys.has('linkedin_url') ? null : undefined)}
        error={errors['linkedin_url']}
        hint="La extensión de Chrome detectará automáticamente cuando visites tu propio perfil"
      />
      <NetworkCard
        icon="📸" label="Instagram" color="#e1306c"
        placeholder="@tu_usuario"
        value={fields.instagram_username ?? ''}
        onChange={v => setFields(p => ({ ...p, instagram_username: v }))}
        onSave={() => handleSave('instagram_username')}
        saving={savingKey === 'instagram_username'}
        saved={savedKeys.has('instagram_username')}
        matches={matches['instagram'] ?? (savedKeys.has('instagram_username') ? null : undefined)}
        error={errors['instagram_username']}
        hint="SIR cruzará con contactos que sigas o que te sigan"
      />
      <NetworkCard
        icon="🐦" label="Twitter / X" color="#1d9bf0"
        placeholder="@tu_usuario"
        value={fields.twitter_username ?? ''}
        onChange={v => setFields(p => ({ ...p, twitter_username: v }))}
        onSave={() => handleSave('twitter_username')}
        saving={savingKey === 'twitter_username'}
        saved={savedKeys.has('twitter_username')}
        error={errors['twitter_username']}
        hint="Conecta tu cuenta para enriquecer el contexto de tus contactos"
      />
      <NetworkCard
        icon="🎵" label="TikTok" color="#fe2c55"
        placeholder="@tu_usuario"
        value={fields.tiktok_username ?? ''}
        onChange={v => setFields(p => ({ ...p, tiktok_username: v }))}
        onSave={() => handleSave('tiktok_username')}
        saving={savingKey === 'tiktok_username'}
        saved={savedKeys.has('tiktok_username')}
        error={errors['tiktok_username']}
        hint="Próximamente: captura automática de actividad en TikTok"
      />
    </div>
  );
}
