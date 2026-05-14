export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>SIR</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Sistema de Inteligencia Relacional</p>
        </div>
        {children}
      </div>
    </div>
  );
}
