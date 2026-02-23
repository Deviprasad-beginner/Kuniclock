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
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.05))' }}>Session History</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>All your recorded study sessions</p>
        </div>
        {!loading && sessions.length > 0 && (
          <div className="glass-panel-elevated" style={{ padding: '12px 20px', borderRadius: '100px', border: '1px solid var(--border-subtle)', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '16px' }}>📚</span> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sessions.length}</span> sessions</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '16px' }}>⏱</span> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hours}h {minutes}m</span> total</span>
          </div>
        )}
      </div>

      {/* Filter + Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Filter tabs */}
        <div className="glass-panel" style={{
          display: 'flex', borderRadius: 'var(--radius)',
          overflow: 'hidden', padding: '4px', gap: '4px'
        }}>
          {filterTabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '10px 16px', border: 'none', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                backgroundColor: filter === key ? 'var(--bg-elevated)' : 'transparent',
                color: filter === key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'calc(var(--radius) - 2px)',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: filter === key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
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
            className="glass-panel"
            style={{
              padding: '12px 36px 12px 16px', borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit',
              appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {sortOptions.map(({ key, label }) => (
              <option key={key} value={key} style={{ background: '#18181b', color: '#fff' }}>{label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '12px' }}>▾</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel" style={{ height: '84px', borderRadius: 'var(--radius-lg)', opacity: 1 - i * 0.15, animation: 'pulse-glow-purple 2s infinite' }} />
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
