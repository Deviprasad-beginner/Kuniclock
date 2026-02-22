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

export default function SessionList({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return <p className="text-zinc-400">No sessions yet.</p>;
  }

  return (
    <ul className="w-full max-w-2xl space-y-3">
      {sessions.map((session) => (
        <li key={session.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <div className="font-semibold">{session.subject.name}</div>
          <div className="text-sm text-zinc-300">
            {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
          </div>
          <div className="text-sm text-zinc-100">Duration: {formatSeconds(session.duration)}</div>
        </li>
      ))}
    </ul>
  );
}
