import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userEmail={user.email ?? ''} />
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
