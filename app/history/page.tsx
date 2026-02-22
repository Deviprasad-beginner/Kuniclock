'use client';

import { useCallback, useEffect, useState } from 'react';
import SessionList, { SessionItem } from '@/components/SessionList';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

type FilterMode = 'today' | 'week' | 'all';
type SortMode = 'recent' | 'duration_desc' | 'duration_asc';

function HistoryContent() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('recent');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (sort !== 'recent') params.set('sort', sort);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/sessions${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json()) as SessionItem[];
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, getToken]);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  async function handleDelete(id: number) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      const token = await getToken();
      await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      void loadSessions();
    }
  }

  const totalSeconds = sessions.reduce((s, ss) => s + ss.duration, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const filterTabs: { key: FilterMode; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: '☀️' },
    { key: 'week', label: 'This Week', icon: '📅' },
    { key: 'all', label: 'All Time', icon: '🌌' },
  ];

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: 'recent', label: '🕐 Most Recent' },
    { key: 'duration_desc', label: '⬆️ Longest' },
    { key: 'duration_asc', label: '⬇️ Shortest' },
  ];

  return (
    <main style={{
      maxWidth: '800px', margin: '0 auto', padding: '40px 24px',
      display: 'flex', flexDirection: 'column', gap: '24px',
      minHeight: 'calc(100vh - 60px)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Session History</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>All your recorded study sessions</p>
        </div>
        {!loading && sessions.length > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
            <span>📚 {sessions.length} sessions</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>⏱ {hours}h {minutes}m total</span>
          </div>
        )}
      </div>

      {/* Filter + Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
          overflow: 'hidden', backgroundColor: 'var(--bg-surface)',
        }}>
          {filterTabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '8px 14px', border: 'none', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                backgroundColor: filter === key ? 'var(--bg-elevated)' : 'transparent',
                color: filter === key ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            style={{
              padding: '8px 32px 8px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'inherit',
              appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none',
            }}
          >
            {sortOptions.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '11px' }}>▾</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '72px', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ) : (
        <SessionList sessions={sessions} onDelete={handleDelete} />
      )}
    </main>
  );
}

export default function HistoryPage() {
  return <AuthGuard><HistoryContent /></AuthGuard>;
}
