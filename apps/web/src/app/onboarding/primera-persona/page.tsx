import Link from 'next/link';
import OnboardingPersonForm from './OnboardingPersonForm';

export default function PrimeraPersonaPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>
        Agrega tu primera persona
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px' }}>
        Empieza con alguien importante para ti
      </p>

      <OnboardingPersonForm />

      <div style={{ textAlign: 'center' }}>
        <Link
          href="/onboarding/listo?added=0"
          style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}
        >
          Saltar por ahora →
        </Link>
      </div>
    </div>
  );
}
