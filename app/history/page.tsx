'use client';

import { useEffect, useState } from 'react';
import SessionList, { SessionItem } from '@/components/SessionList';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      try {
        const res = await fetch('/api/sessions');
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

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Session History</h1>
      {loading ? <p className="text-zinc-400">Loading...</p> : <SessionList sessions={sessions} />}
    </main>
  );
}
