'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

interface Props {
  alreadyConnected: boolean;
  contactCount: number;
}

type Mode = 'idle' | 'whatsapp-loading' | 'whatsapp-done' | 'whatsapp-error';

export default function ImportarRedForm({ alreadyConnected, contactCount }: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [mode, setMode]       = useState<Mode>('idle');
  const [waCount, setWaCount] = useState(0);
  const [errMsg, setErrMsg]   = useState('');

  async function handleWhatsApp(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setMode('whatsapp-loading');
    setErrMsg('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const path = `${user.id}/${Date.now()}-chat.txt`;
      const { error: uploadErr } = await supabase.storage
        .from('whatsapp-exports')
        .upload(path, file, { contentType: 'text/plain', upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      const res  = await fetch('/api/integrations/whatsapp/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storage_path: path }),
      });
      const data = await res.json() as { matched?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      setWaCount(data.matched ?? 0);
      setMode('whatsapp-done');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error al procesar');
      setMode('whatsapp-error');
    }
  }

  return (
    <div>
      {/* Google Contacts */}
      <OptionCard
        icon="🔵"
        title="Google Contacts"
        badge={alreadyConnected ? `${contactCount} contactos importados` : undefined}
        badgeColor="#34d399"
        description="El más rápido — importa todos tus contactos de Gmail en segundos"
      >
        {alreadyConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
              ✅ {contactCount} contactos ya importados
            </span>
            <button
              onClick={() => router.push('/onboarding/primera-persona?source=google')}
              style={btnPrimary}
            >
              Continuar →
            </button>
          </div>
        ) : (
          <a
            href="/api/integrations/google/connect?onboarding=1"
            style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-block' }}
          >
            Conectar Google →
          </a>
        )}
      </OptionCard>

      {/* WhatsApp */}
      <OptionCard
        icon="💬"
        title="Chat de WhatsApp"
        description="Exporta un chat grupal o individual → SIR extrae los contactos automáticamente"
      >
        <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleWhatsApp} />
        {mode === 'idle' || mode === 'whatsapp-error' ? (
          <div>
            <button onClick={() => fileRef.current?.click()} style={btnSecondary}>
              Subir chat .txt
            </button>
            {errMsg && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f87171' }}>{errMsg}</p>}
          </div>
        ) : mode === 'whatsapp-loading' ? (
          <p style={{ fontSize: 13, color: '#818cf8' }}>Procesando chat…</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
              ✅ {waCount} contactos importados
            </span>
            <button
              onClick={() => router.push('/onboarding/primera-persona?source=whatsapp')}
              style={btnPrimary}
            >
              Continuar →
            </button>
          </div>
        )}
      </OptionCard>

      {/* Manual */}
      <OptionCard
        icon="✏️"
        title="Agregar manualmente"
        description="Escribe el nombre de una persona importante para empezar sin conectar nada"
      >
        <a
          href="/onboarding/primera-persona?source=manual"
          style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-block' }}
        >
          Agregar persona →
        </a>
      </OptionCard>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a href="/onboarding/primera-persona?source=skip" style={skipStyle}>
          Saltar por ahora →
        </a>
      </div>
    </div>
  );
}

function OptionCard({
  icon, title, badge, badgeColor = '#818cf8', description, children,
}: {
  icon: string;
  title: string;
  badge?: string | undefined;
  badgeColor?: string | undefined;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#13151f', border: '1px solid #2a2d3e',
      borderRadius: 12, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: badgeColor,
            background: badgeColor + '22', padding: '2px 8px',
            borderRadius: 10, marginLeft: 'auto',
          }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
        {description}
      </p>
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px', background: '#6366f1', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', whiteSpace: 'nowrap',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', background: 'transparent', color: '#818cf8',
  border: '1px solid #6366f144', borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
};
const skipStyle: React.CSSProperties = {
  fontSize: 13, color: '#475569', textDecoration: 'none',
};
