import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <header className="border-b border-zinc-800 bg-zinc-950/90">
          <nav className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-4">
            <Link className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-900" href="/clock">
              Clock
            </Link>
            <Link
              className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-900"
              href="/history"
            >
              History
            </Link>
            <Link
              className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-900"
              href="/analytics"
            >
              Analytics
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
