'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Clock from '@/components/Clock';
import SubjectSelect from '@/components/SubjectSelect';
import { useClockStore } from '@/lib/store';

export default function ClockPage() {
  const { subjectId, startTime, isRunning, setSubject, start, stop } = useClockStore();
  const [time, setTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime]);

  async function handleStart() {
    if (!subjectId) {
      return;
    }
    setSaveError(null);
    start(subjectId);
  }

  async function handleStop() {
    if (!isRunning || !subjectId || !startTime) {
      return;
    }

    const endTime = Date.now();

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(payload?.error ?? 'Unable to save session. Please try again.');
        return;
      }

      stop();
      setTime(0);
      setSaveError(null);
    } catch {
      setSaveError('Unable to save session. Please check your connection and try again.');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <SubjectSelect value={subjectId} onChange={(id) => setSubject(id)} disabled={isRunning} />
      <Clock
        time={time}
        isRunning={isRunning}
        canStart={Boolean(subjectId)}
        onStart={handleStart}
        onStop={handleStop}
      />
      {saveError && <p className="max-w-sm text-center text-sm text-red-400">{saveError}</p>}
      <div className="flex gap-3 text-sm">
        <Link className="rounded border border-zinc-700 px-3 py-2 hover:bg-zinc-900" href="/history">
          View History
        </Link>
        <Link className="rounded border border-zinc-700 px-3 py-2 hover:bg-zinc-900" href="/analytics">
          View Analytics
        </Link>
      </div>
    </main>
  );
}
