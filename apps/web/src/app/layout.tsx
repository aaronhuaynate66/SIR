import { GoogleAnalytics } from 'next/third-parties/google';

export const metadata = {
  title: 'SIR — Sistema de Inteligencia Relacional',
  description: 'Tu inteligencia relacional personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env['NEXT_PUBLIC_GA4_MEASUREMENT_ID'];
  return (
    <html lang="es">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#0f1117',
        color: '#e2e8f0',
        minHeight: '100vh',
      }}>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
