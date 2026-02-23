'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Clock from '@/components/Clock';
import SubjectSelect from '@/components/SubjectSelect';
import AuthGuard from '@/components/AuthGuard';
import { useClockStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useRealTimeClock, useDailyTargetStats } from '@/lib/hooks';

const INTENT_OPTIONS = [
  { id: 'problem_solving', label: '🧩 Problem Solving' },
  { id: 'memorising', label: '🧠 Memorising' },
  { id: 'understanding', label: '💡 Understanding' },
  { id: 'revising', label: '📝 Revising' },
  { id: 'others', label: '✨ Others' }
];

function ClockContent() {
  const { subjectId, intent, startTime, targetDuration: storeTarget, clockMode, isRunning, setSubject, start, stop } = useClockStore();
  const { getToken } = useAuth();
  const [time, setTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Local state for intent before starting
  const [selectedIntent, setSelectedIntent] = useState<string>('');

  // Pomodoro states
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroMins, setPomodoroMins] = useState<number>(25);
  // Stopwatch target state (optional limit vs infinite)
  const [stopwatchTargetMins, setStopwatchTargetMins] = useState<number | null>(null);

  const currentTimeDisplay = useRealTimeClock();
  const { targetSeconds, streak, todaySeconds, statsLoading, loadStats } = useDailyTargetStats(getToken);

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

  // Pomodoro auto-stop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const activeMode = isRunning ? clockMode : mode;
    const activeTarget = isRunning ? storeTarget : (pomodoroMins * 60);

    if (isRunning && activeMode === 'pomodoro' && activeTarget && time >= activeTarget) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.5);
        }
      } catch (e) {
        console.error('Audio playback failed', e);
      }
      void handleStop();
    }
  }, [time, isRunning, mode, clockMode, pomodoroMins, storeTarget]);

  async function handleStart() {
    if (!subjectId || !selectedIntent) return;
    setSaveError(null);
    setLastSaved(null);
    setTime(0); // View visually resets when session exactly starts
    const target = mode === 'pomodoro' ? pomodoroMins * 60 : (stopwatchTargetMins ? stopwatchTargetMins * 60 : null);
    start(subjectId, selectedIntent, mode, target);
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
        body: JSON.stringify({ subjectId, intent, startTime, endTime, targetDuration: storeTarget }),
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
      if (clockMode === 'pomodoro') {
        setTime(0);
      }
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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '24px 24px',
        gap: '32px',
      }}
    >
      <div style={{ position: 'absolute', top: '24px', right: '28px', fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
        {currentTimeDisplay}
      </div>
      {/* Target & Streak Display */}
      {!statsLoading && (
        <div className="glass-panel" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          width: '100%', maxWidth: '380px', padding: '20px',
          borderRadius: 'var(--radius-lg)', zIndex: 10,
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

      <div style={{ textAlign: 'center', zIndex: 10 }}>
        <h1
          style={{
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: '8px',
            background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.1))'
          }}
        >
          {isRunning && intent ? INTENT_OPTIONS.find(o => o.id === intent)?.label : 'Focus Timer'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
          {isRunning ? 'Stay focused. You can do this.' : 'Select a subject and intent, then start.'}
        </p>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '380px', alignItems: 'center', padding: '24px', borderRadius: 'var(--radius-lg)', zIndex: 10 }}>
        {/* Mode Toggle */}
        {!isRunning && (
          <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setMode('stopwatch')}
              style={{
                padding: '8px 20px', borderRadius: 'calc(var(--radius) - 2px)', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: mode === 'stopwatch' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'stopwatch' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'stopwatch' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              ⏱️ Stopwatch
            </button>
            <button
              onClick={() => setMode('pomodoro')}
              style={{
                padding: '8px 20px', borderRadius: 'calc(var(--radius) - 2px)', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: mode === 'pomodoro' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'pomodoro' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'pomodoro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              🍅 Pomodoro
            </button>
          </div>
        )}

        {/* Pomodoro Settings */}
        {!isRunning && mode === 'pomodoro' && (
          <div className="glass-panel-elevated" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Focus Duration:</span>
            <select
              value={pomodoroMins}
              onChange={(e) => setPomodoroMins(Number(e.target.value))}
              style={{
                marginLeft: 'auto', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px',
                outline: 'none', cursor: 'pointer'
              }}
            >
              {[1, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map(min => (
                <option key={min} value={min}>{min} min</option>
              ))}
            </select>
          </div>
        )}

        {/* Stopwatch Goal Settings (Optional) */}
        {!isRunning && mode === 'stopwatch' && (
          <div className="glass-panel-elevated" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Goal (Optional):</span>
            <select
              value={stopwatchTargetMins || ''}
              onChange={(e) => setStopwatchTargetMins(e.target.value ? Number(e.target.value) : null)}
              style={{
                marginLeft: 'auto', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px',
                outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">No goal (Infinite)</option>
              {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map(min => (
                <option key={min} value={min}>{min} min</option>
              ))}
            </select>
          </div>
        )}

        <SubjectSelect value={subjectId} onChange={(id) => setSubject(id)} disabled={isRunning} />

        {!isRunning && (
          <div style={{ width: '100%', position: 'relative' }}>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              disabled={isRunning || !subjectId}
              className="glass-panel-elevated"
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 'var(--radius)',
                color: selectedIntent ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '15px', fontWeight: 500, fontFamily: 'inherit', appearance: 'none',
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
        mode={isRunning ? clockMode : mode}
        targetSeconds={isRunning ? storeTarget : (mode === 'pomodoro' ? pomodoroMins * 60 : (stopwatchTargetMins ? stopwatchTargetMins * 60 : null))}
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

      <div style={{ display: 'flex', gap: '16px', zIndex: 10 }}>
        {[
          { href: '/history', label: '📋 History' },
          { href: '/analytics', label: '📊 Analytics' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="glass-panel" style={{
            padding: '12px 24px', borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: '14px', textDecoration: 'none', fontWeight: 600,
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
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
