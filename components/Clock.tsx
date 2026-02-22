'use client';

import { formatDuration } from '@/lib/timer';

type ClockProps = {
  time: number;
  isRunning: boolean;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
};

const SIZE = 240;
const RADIUS = 108;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_DISPLAY = 3600; // 1 hour full circle

export default function Clock({ time, isRunning, canStart, onStart, onStop }: ClockProps) {
  const progress = Math.min(time / MAX_DISPLAY, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}
    >
      {/* Circular Progress Ring */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isRunning ? 'var(--accent-green)' : 'var(--accent-purple)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
              filter: isRunning
                ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
                : 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.4))',
            }}
          />
        </svg>

        {/* Center display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: '36px',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {formatDuration(time)}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isRunning ? 'var(--accent-green)' : 'var(--text-muted)',
              transition: 'color 0.3s ease',
            }}
          >
            {isRunning ? '● Recording' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onStart}
          disabled={!canStart || isRunning}
          style={{
            padding: '12px 32px',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            cursor: canStart && !isRunning ? 'pointer' : 'not-allowed',
            opacity: canStart && !isRunning ? 1 : 0.4,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            boxShadow: canStart && !isRunning ? 'var(--glow-green)' : 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (canStart && !isRunning) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(34,197,94,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--glow-green)';
          }}
        >
          ▶ Start
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          style={{
            padding: '12px 32px',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isRunning ? 'pointer' : 'not-allowed',
            opacity: isRunning ? 1 : 0.4,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            boxShadow: isRunning ? 'var(--glow-red)' : 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (isRunning) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(239,68,68,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--glow-red)';
          }}
        >
          ■ Stop
        </button>
      </div>
    </div>
  );
}
