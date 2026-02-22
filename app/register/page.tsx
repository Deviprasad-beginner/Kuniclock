'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/lib/auth-context';

function getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
        'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups.',
    };
    return messages[code] ?? 'Registration failed. Please try again.';
}

function GoogleLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
    );
}

export default function RegisterPage() {
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    async function handleGoogleSignIn() {
        setError(null);
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
            router.replace('/clock');
        } catch (err) {
            setError(err instanceof FirebaseError ? getErrorMessage(err.code) : 'Google sign-in failed.');
        } finally {
            setGoogleLoading(false);
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setError(null);
        setLoading(true);
        try {
            await signUp(name.trim(), email, password);
            router.replace('/clock');
        } catch (err) {
            setError(err instanceof FirebaseError ? getErrorMessage(err.code) : 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        padding: '11px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px',
        fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
        width: '100%', boxSizing: 'border-box',
    };

    return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚀</div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e4e4e7, #71717a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Create an account
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Start tracking your study sessions today
                    </p>
                </div>

                <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ── Google Button ── */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                            backgroundColor: '#fff', color: '#1f1f1f',
                            fontSize: '15px', fontWeight: 600, cursor: googleLoading ? 'not-allowed' : 'pointer',
                            opacity: googleLoading ? 0.7 : 1, fontFamily: 'inherit',
                            transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                        onMouseEnter={(e) => { if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'; }}
                    >
                        <GoogleLogo />
                        {googleLoading ? 'Signing up...' : 'Continue with Google'}
                    </button>

                    {/* ── Divider ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or register with email</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                    </div>

                    {/* ── Email form ── */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Name', type: 'text', value: name, setter: setName, placeholder: 'Your name', auto: 'name' },
                            { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'you@example.com', auto: 'email' },
                            { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '•••••• (min 6)', auto: 'new-password' },
                        ].map(({ label, type, value, setter, placeholder, auto }) => (
                            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
                                <input type={type} placeholder={placeholder} value={value} onChange={(e) => setter(e.target.value)} required autoComplete={auto} style={inputStyle}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }} />
                            </div>
                        ))}

                        {error && (
                            <div style={{ fontSize: '13px', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading || googleLoading}
                            style={{ padding: '12px', borderRadius: 'var(--radius)', border: 'none', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit', transition: 'opacity 0.15s, transform 0.15s' }}
                            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                </p>
            </div>
        </main>
    );
}
