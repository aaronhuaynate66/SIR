import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import ProgressBar from './ProgressBar';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: '#0f1117',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#818cf8', letterSpacing: '-0.5px' }}>SIR</span>
        </div>
        <ProgressBar />
        <div style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: 20,
          padding: '40px 44px',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
