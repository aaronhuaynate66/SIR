export const metadata = {
  title: 'SIR Admin',
  description: 'Panel de administración del Sistema de Inteligencia Relacional',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <nav style={{ background: '#1e1b4b', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>SIR</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ opacity: 0.8 }}>Admin</span>
        </nav>
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
