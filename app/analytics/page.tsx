'use client';

import { useEffect, useMemo, useState } from 'react';
import { SessionItem } from '@/components/SessionList';

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTodaySessions() {
      try {
        const res = await fetch('/api/sessions/today');
        const data = (await res.json()) as SessionItem[];
        if (isMounted) {
          setSessions(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTodaySessions();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSeconds = useMemo(
    () => sessions.reduce((sum, session) => sum + session.duration, 0),
    [sessions],
  );

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      const current = map.get(session.subject.name) ?? 0;
      map.set(session.subject.name, current + session.duration);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Today&apos;s Analytics</h1>

      {loading && <p className="text-zinc-400">Loading...</p>}

      {!loading && (
        <>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-zinc-400">Total Study Time</div>
            <div className="text-3xl font-semibold">{formatSeconds(totalSeconds)}</div>
            <div className="mt-1 text-sm text-zinc-400">Sessions: {sessions.length}</div>
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">By Subject</h2>
            {bySubject.length === 0 && <p className="text-zinc-400">No sessions today.</p>}
            {bySubject.length > 0 && (
              <ul className="space-y-2">
                {bySubject.map(([name, seconds]) => (
                  <li key={name} className="flex items-center justify-between">
                    <span>{name}</span>
                    <span className="font-mono">{formatSeconds(seconds)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
