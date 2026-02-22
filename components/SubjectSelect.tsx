'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Subject = {
  id: number;
  name: string;
};

type SubjectSelectProps = {
  value: number | null;
  onChange: (subjectId: number | null) => void;
  disabled?: boolean;
};

export default function SubjectSelect({ value, onChange, disabled = false }: SubjectSelectProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    const res = await fetch('/api/subjects');

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Unable to load subjects');
    }

    const data = (await res.json()) as Subject[];
    setSubjects(data);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSubjects() {
      try {
        await loadSubjects();
      } catch (cause) {
        if (isMounted) {
          setError(cause instanceof Error ? cause.message : 'Unable to load subjects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialSubjects();

    return () => {
      isMounted = false;
    };
  }, [loadSubjects]);

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newSubjectName.trim();

    if (!name) {
      setError('Subject name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to create subject');
      }

      const created = (await response.json()) as Subject;
      setNewSubjectName('');
      setSubjects((previous) =>
        [...previous, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      onChange(created.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create subject');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <select
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
        value={value ?? ''}
        onChange={(e) => {
          const selected = e.target.value;
          onChange(selected ? Number(selected) : null);
        }}
        disabled={disabled || loading || subjects.length === 0}
      >
        <option value="">
          {loading
            ? 'Loading subjects...'
            : subjects.length === 0
              ? 'No subjects yet. Add one below.'
              : 'Select a subject'}
        </option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>

      <form className="flex gap-2" onSubmit={handleAddSubject}>
        <input
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          type="text"
          placeholder="Add subject"
          value={newSubjectName}
          onChange={(event) => setNewSubjectName(event.target.value)}
          disabled={disabled || submitting}
        />
        <button
          className="rounded border border-zinc-700 px-3 py-2 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={disabled || submitting}
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
