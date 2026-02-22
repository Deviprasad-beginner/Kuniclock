'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

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
  const { getToken } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadSubjects = useCallback(async () => {
    const token = await getToken();
    const res = await fetch('/api/subjects', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Unable to load subjects');
    }
    const data = (await res.json()) as Subject[];
    setSubjects(data);
  }, [getToken]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await loadSubjects();
      } catch (cause) {
        if (isMounted) setError(cause instanceof Error ? cause.message : 'Unable to load subjects');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void init();
    return () => { isMounted = false; };
  }, [loadSubjects]);

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newSubjectName.trim();
    if (!name) { setError('Subject name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to create subject');
      }
      const created = (await response.json()) as Subject;
      setNewSubjectName('');
      setShowForm(false);
      setSubjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(created.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create subject');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Dropdown */}
      <div style={{ position: 'relative' }}>
        <select
          value={value ?? ''}
          onChange={(e) => { const v = e.target.value; onChange(v ? Number(v) : null); }}
          disabled={disabled || loading}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '15px', fontFamily: 'inherit', appearance: 'none',
            WebkitAppearance: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <option value="">{loading ? 'Loading subjects...' : subjects.length === 0 ? 'No subjects yet' : 'Select a subject...'}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '12px' }}>▾</span>
      </div>

      {/* Add subject toggle */}
      {!disabled && (
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
            color: 'var(--text-muted)', padding: '8px 12px', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex',
            alignItems: 'center', gap: '6px', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-purple)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          {showForm ? '✕ Cancel' : '+ Add new subject'}
        </button>
      )}

      {/* Add subject form */}
      {showForm && !disabled && (
        <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text" placeholder="e.g. Physics, Coding..." value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)} disabled={submitting} autoFocus
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          <button
            type="submit" disabled={submitting}
            style={{
              padding: '10px 18px', borderRadius: 'var(--radius)', border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff',
              fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            {submitting ? '...' : 'Add'}
          </button>
        </form>
      )}

      {error && (
        <p style={{ fontSize: '13px', color: 'var(--accent-red)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
