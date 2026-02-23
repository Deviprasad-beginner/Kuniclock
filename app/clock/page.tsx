'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Clock from '@/components/Clock';
import SubjectSelect from '@/components/SubjectSelect';
import AuthGuard from '@/components/AuthGuard';
import { useClockStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

const INTENT_OPTIONS = [
  { id: 'problem_solving', label: '🧩 Problem Solving' },
  { id: 'memorising', label: '🧠 Memorising' },
  { id: 'understanding', label: '💡 Understanding' },
  { id: 'revising', label: '📝 Revising' },
  { id: 'others', label: '✨ Others' }
];

function ClockContent() {
  const { subjectId, intent, startTime, isRunning, setSubject, start, stop } = useClockStore();
  const { getToken } = useAuth();
  const [time, setTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Local state for intent before starting
  const [selectedIntent, setSelectedIntent] = useState<string>('');

  // Target and Progress State
  const [targetSeconds, setTargetSeconds] = useState<number>(7200);
  const [streak, setStreak] = useState<number>(0);
  const [todaySeconds, setTodaySeconds] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [targetRes, sessionsRes] = await Promise.all([
        fetch('/api/targets', { headers }),
        fetch('/api/sessions?filter=today', { headers })
      ]);

      if (targetRes.ok) {
        const target = await targetRes.json();
        setTargetSeconds(target.dailySeconds);
        setStreak(target.currentStreak);
      }

      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json() as { duration: number }[];
        setTodaySeconds(sessions.reduce((s, ss) => s + ss.duration, 0));
      }
    } finally {
      setStatsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isRunning) {
      void loadStats();
    }
  }, [isRunning, loadStats]);

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
    if (!subjectId || !selectedIntent) return;
    setSaveError(null);
    setLastSaved(null);
    start(subjectId, selectedIntent);
  }

  async function handleStop() {
    if (!isRunning || !subjectId || !startTime || !intent) return;
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
        body: JSON.stringify({ subjectId, intent, startTime, endTime }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(payload?.error ?? 'Unable to save session. Please try again.');
        return;
      }

      stop();
      setSelectedIntent(''); // Reset intent after session
      const h = Math.floor(duration / 3600);
      const m = Math.floor((duration % 3600) / 60);
      const s = duration % 60;
      setLastSaved(
        `Session saved! ${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`
      );
      setTime(0);
      setSaveError(null);

      // Reload stats after stopping to update progress and streak instantly
      void loadStats();
    } catch {
      setSaveError('Unable to save session. Please check your connection.');
    }
  }

  // Calculate live progress including currently running session
  const effectiveTotal = todaySeconds + (isRunning ? time : 0);
  const targetProgress = Math.min(100, Math.round((effectiveTotal / targetSeconds) * 100)) || 0;

  const formatSecs = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '24px 24px',
        gap: '32px',
      }}
    >
      {/* Target & Streak Display */}
      {!statsLoading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          width: '100%', maxWidth: '360px', padding: '16px',
          borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Daily Target</span>
            <span style={{ color: 'var(--text-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>{formatSecs(effectiveTotal)} / {formatSecs(targetSeconds)}</span>
              {streak > 0 && <span style={{ color: '#f97316', fontWeight: 600, fontSize: '14px' }}>🔥 {streak}</span>}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${targetProgress}%`,
              backgroundColor: targetProgress >= 100 ? 'var(--accent-green)' : 'var(--accent-purple)',
              borderRadius: '4px',
              transition: 'width 1s ease-out, background-color 0.5s ease'
            }} />
          </div>
        </div>
      )}

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
          {isRunning && intent ? INTENT_OPTIONS.find(o => o.id === intent)?.label : 'Focus Timer'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
          {isRunning ? 'Stay focused. You can do this.' : 'Select a subject and intent, then start.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '360px', alignItems: 'center' }}>
        <SubjectSelect value={subjectId} onChange={(id) => setSubject(id)} disabled={isRunning} />

        {!isRunning && (
          <div style={{ width: '100%', position: 'relative' }}>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              disabled={isRunning || !subjectId}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
                color: selectedIntent ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '15px', fontFamily: 'inherit', appearance: 'none',
                WebkitAppearance: 'none', cursor: isRunning || !subjectId ? 'not-allowed' : 'pointer',
                outline: 'none', transition: 'border-color 0.15s',
                opacity: !subjectId ? 0.5 : 1
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option value="" disabled>Select your intent...</option>
              {INTENT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '12px' }}>▾</span>
          </div>
        )}
      </div>

      <Clock
        time={time}
        isRunning={isRunning}
        canStart={Boolean(subjectId) && Boolean(selectedIntent)}
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
