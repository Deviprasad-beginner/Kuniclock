import type { ReactNode } from 'react';
import NavBar from '@/components/NavBar';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata = {
  title: 'Kuni Clock — Study Timer',
  description: 'Track your study sessions by subject with detailed analytics.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(168,85,247,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <AuthProvider>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(9,9,11,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <NavBar />
          </header>
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
