'use client';

import { formatDuration } from '@/lib/timer';

type ClockProps = {
  time: number;
  isRunning: boolean;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
};

export default function Clock({ time, isRunning, canStart, onStart, onStop }: ClockProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="text-6xl font-mono">{formatDuration(time)}</div>

      <div className="flex gap-4">
        <button
          onClick={onStart}
          disabled={!canStart || isRunning}
          className="rounded bg-green-600 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          className="rounded bg-red-600 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
