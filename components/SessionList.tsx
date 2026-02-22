'use client';

export type SessionItem = {
  id: number;
  duration: number;
  startTime: string;
  endTime: string;
  subject: {
    name: string;
  };
};

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
}

const SUBJECT_COLORS = [
  '#a855f7', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

function getSubjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

type SessionListProps = {
  sessions: SessionItem[];
  onDelete?: (id: number) => void;
};

export default function SessionList({ sessions, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>No sessions yet</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Start a study session to see it here.</p>
      </div>
    );
  }

  return (
    <ul style={{ width: '100%', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {sessions.map((session) => {
        const color = getSubjectColor(session.subject.name);
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);

        return (
          <li
            key={session.id}
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLIElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLLIElement).style.backgroundColor = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLIElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLLIElement).style.backgroundColor = 'var(--bg-surface)';
            }}
          >
            {/* Color indicator */}
            <div
              style={{
                width: '4px',
                height: '48px',
                borderRadius: '2px',
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${color}66`,
              }}
            />

            {/* Subject name badge */}
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: `${color}22`,
                border: `1px solid ${color}44`,
                color: color,
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {session.subject.name}
            </div>

            {/* Time info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                {' '}·{' '}
                {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                {' → '}
                {end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Duration */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}
            >
              {formatSeconds(session.duration)}
            </div>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(session.id)}
                style={{
                  background: 'none',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title="Delete session"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-red)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
