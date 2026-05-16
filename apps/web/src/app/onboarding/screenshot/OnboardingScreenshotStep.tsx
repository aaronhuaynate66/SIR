'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmScreenshotAction } from '@/app/(app)/actions';
import type { AnalysisResult } from '@/app/api/people/[id]/analyze-screenshot/route';

interface Props {
  personId:   string;
  personName: string;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OnboardingScreenshotStep({ personId, personName }: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<AnalysisResult | null>(null);
  const [saved, setSaved]         = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const base64 = await toBase64(file);
      const res = await fetch(`/api/people/${personId}/analyze-screenshot`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const json = await res.json() as AnalysisResult | { error: string };
      if ('error' in json) throw new Error(json.error);
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    const res = await confirmScreenshotAction(personId, personName, result, result.data);
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setResult(null);
    }
  }

  const continueHref = `/onboarding/listo?added=1&screenshot=${saved ? '1' : '0'}`;

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {!saved ? (
        <>
          <div
            onClick={() => !analyzing && fileRef.current?.click()}
            style={{
              border: '2px dashed #2a2d3e',
              borderRadius: 12,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: analyzing ? 'wait' : 'pointer',
              marginBottom: 16,
              transition: 'border-color 0.15s',
            }}
          >
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>📷</p>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
              {analyzing ? 'Analizando…' : 'Subir screenshot'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
              LinkedIn, Instagram o WhatsApp
            </p>
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          {result && (
            <div style={{
              background: '#13151f', border: '1px solid #2a2d3e',
              borderRadius: 12, padding: '16px', marginBottom: 16,
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
                Datos detectados ({result.type})
              </p>
              {result.data.name && <p style={dataRow}><span style={dataLabel}>Nombre</span>{result.data.name}</p>}
              {result.data.role && <p style={dataRow}><span style={dataLabel}>Cargo</span>{result.data.role}</p>}
              {result.data.organization && <p style={dataRow}><span style={dataLabel}>Empresa</span>{result.data.organization}</p>}
              {result.data.raw_summary && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{result.data.raw_summary}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  marginTop: 14, width: '100%', padding: '10px',
                  background: saving ? '#3730a3' : '#6366f1',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Guardando…' : 'Guardar datos →'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{
          background: '#13151f', border: '1px solid #34d39930',
          borderRadius: 12, padding: '20px 16px', textAlign: 'center', marginBottom: 16,
        }}>
          <p style={{ fontSize: 24, margin: '0 0 6px' }}>✅</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#34d399' }}>
            Datos del perfil guardados
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <a
          href="/onboarding/listo?added=1"
          style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}
        >
          Saltar por ahora →
        </a>
        <button
          onClick={() => router.push(continueHref)}
          style={{
            padding: '10px 24px',
            background: saved ? '#6366f1' : '#1e2130',
            color: saved ? '#fff' : '#64748b',
            border: `1px solid ${saved ? '#6366f1' : '#2a2d3e'}`,
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

const dataRow: React.CSSProperties = {
  margin: '0 0 4px', fontSize: 13, color: '#94a3b8', display: 'flex', gap: 8,
};
const dataLabel: React.CSSProperties = {
  color: '#475569', fontSize: 12, minWidth: 60,
};
