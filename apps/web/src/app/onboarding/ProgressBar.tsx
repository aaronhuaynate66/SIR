'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  '/onboarding/bienvenida',
  '/onboarding/importar-red',
  '/onboarding/primera-persona',
  '/onboarding/extension',
  '/onboarding/listo',
];

export default function ProgressBar() {
  const path = usePathname();
  const current = STEPS.findIndex(s => path.startsWith(s));
  const step = current === -1 ? 0 : current;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i < step ? '#6366f1' : i === step ? '#818cf8' : '#2a2d3e',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#475569' }}>
        Paso {step + 1} de {STEPS.length}
      </span>
    </div>
  );
}
