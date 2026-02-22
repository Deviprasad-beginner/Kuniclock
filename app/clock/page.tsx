'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Clock from '@/components/Clock';
import SubjectSelect from '@/components/SubjectSelect';
import AuthGuard from '@/components/AuthGuard';
import { useClockStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

function ClockContent() {
  const { subjectId, startTime, isRunning, setSubject, start, stop } = useClockStore();
  const { getToken } = useAuth();
  const [time, setTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, startTime]);

  async function handleStart() {
    if (!subjectId) return;
    setSaveError(null);
    setLastSaved(null);
    start(subjectId);
  }

  async function handleStop() {
    if (!isRunning || !subjectId || !startTime) return;
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const token = await getToken();

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subjectId, startTime, endTime }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(payload?.error ?? 'Unable to save session. Please try again.');
        return;
      }

      stop();
      const h = Math.floor(duration / 3600);
      const m = Math.floor((duration % 3600) / 60);
      const s = duration % 60;
      setLastSaved(
        `Session saved! ${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`
      );
      setTime(0);
      setSaveError(null);
    } catch {
      setSaveError('Unable to save session. Please check your connection.');
    }
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '40px 24px',
        gap: '40px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #e4e4e7, #71717a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Focus Timer
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
          Select a subject, then start your session.
        </p>
      </div>

      <SubjectSelect value={subjectId} onChange={(id) => setSubject(id)} disabled={isRunning} />

      <Clock
        time={time}
        isRunning={isRunning}
        canStart={Boolean(subjectId)}
        onStart={handleStart}
        onStop={handleStop}
      />

      {saveError && (
        <div style={{
          maxWidth: '400px', textAlign: 'center', fontSize: '14px',
          color: 'var(--accent-red)', padding: '10px 16px', borderRadius: 'var(--radius)',
          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          {saveError}
        </div>
      )}

      {lastSaved && !isRunning && (
        <div style={{
          maxWidth: '400px', textAlign: 'center', fontSize: '14px',
          color: 'var(--accent-green)', padding: '10px 16px', borderRadius: 'var(--radius)',
          backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
        }}>
          ✓ {lastSaved}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { href: '/history', label: '📋 History' },
          { href: '/analytics', label: '📊 Analytics' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: '8px 18px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            fontSize: '13px', textDecoration: 'none', fontWeight: 500,
          }}>
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function ClockPage() {
  return (
    <AuthGuard>
      <ClockContent />
    </AuthGuard>
  );
}
