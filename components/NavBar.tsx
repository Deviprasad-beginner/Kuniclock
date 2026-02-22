'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function NavBar() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    async function handleSignOut() {
        await signOut();
        router.replace('/login');
    }

    return (
        <nav
            style={{
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '0 24px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
                <div
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                    }}
                >
                    ⏱
                </div>
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #e4e4e7, #a1a1aa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Kuni Clock
                </span>
            </div>

            {/* Nav links — only show when signed in */}
            {user && (
                <>
                    {[
                        { href: '/clock', label: '⏰ Clock' },
                        { href: '/history', label: '📋 History' },
                        { href: '/analytics', label: '📊 Analytics' },
                    ].map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                border: '1px solid transparent',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-surface)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent';
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                            }}
                        >
                            {label}
                        </Link>
                    ))}
                </>
            )}

            {/* User info + sign out */}
            {!loading && user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
                    {/* Avatar */}
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                        }}
                        title={user.displayName ?? user.email ?? ''}
                    >
                        {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                    </div>

                    <button
                        onClick={handleSignOut}
                        style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-red)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        }}
                    >
                        Sign out
                    </button>
                </div>
            )}

            {/* Sign in link for guests */}
            {!loading && !user && (
                <Link
                    href="/login"
                    style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                >
                    Sign in
                </Link>
            )}
        </nav>
    );
}
