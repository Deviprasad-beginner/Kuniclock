'use client';

import { useEffect, useMemo, useState } from 'react';
import { SessionItem } from '@/components/SessionList';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const CHART_COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
type ViewMode = 'today' | 'week' | 'all';

function AnalyticsContent() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();
        const filter = viewMode === 'all' ? '' : `?filter=${viewMode}`;
        const res = await fetch(`/api/sessions${filter}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = (await res.json()) as SessionItem[];
        if (isMounted) setSessions(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [viewMode, getToken]);

  const totalSeconds = useMemo(() => sessions.reduce((s, ss) => s + ss.duration, 0), [sessions]);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(session.subject.name, (map.get(session.subject.name) ?? 0) + session.duration);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const maxSeconds = bySubject[0]?.[1] ?? 1;

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '28px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Your study time breakdown
          </p>
        </div>
        {/* Tab toggle */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)} style={{
              padding: '7px 16px', border: 'none', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              backgroundColor: viewMode === key ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === key ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: '60px', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />)}
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total Study Time', value: formatSeconds(totalSeconds), icon: '⏱', color: '#a855f7' },
              { label: 'Sessions', value: sessions.length.toString(), icon: '📚', color: '#3b82f6' },
              { label: 'Subjects', value: bySubject.length.toString(), icon: '🎯', color: '#22c55e' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '22px' }}>{icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color, letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Time per Subject</h2>
            {bySubject.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <p>No sessions in this period.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bySubject.map(([name, seconds], index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  const percentage = Math.round((seconds / totalSeconds) * 100);
                  return (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', boxShadow: `0 0 6px ${color}88` }} />
                          <span style={{ fontWeight: 500 }}>{name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{formatSeconds(seconds)}</span>
                          <span style={{ color, fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>{percentage}%</span>
                        </div>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(seconds / maxSeconds) * 100}%`, borderRadius: '4px', backgroundColor: color, boxShadow: `0 0 8px ${color}66`, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default function AnalyticsPage() {
  return <AuthGuard><AnalyticsContent /></AuthGuard>;
}
