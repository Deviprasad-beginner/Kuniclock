import { useState, useEffect, useCallback } from 'react';

export function useRealTimeClock() {
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTimeDisplay(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return currentTimeDisplay;
}

export function useDailyTargetStats(getToken: () => Promise<string | null>) {
    const [targetSeconds, setTargetSeconds] = useState<number>(21600);
    const [streak, setStreak] = useState<number>(0);
    const [todaySeconds, setTodaySeconds] = useState<number>(0);
    const [statsLoading, setStatsLoading] = useState(true);

    const loadStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const token = await getToken();
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

            const [targetRes, sessionsRes] = await Promise.all([
                fetch('/api/targets', { headers }),
                fetch('/api/sessions?filter=today', { headers })
            ]);

            if (targetRes.ok) {
                const target = await targetRes.json();
                setTargetSeconds(target.dailySeconds);
                setStreak(target.currentStreak);
            }

            if (sessionsRes.ok) {
                const sessions = await sessionsRes.json();
                setTodaySeconds(sessions.reduce((s: number, ss: any) => s + (ss.duration || 0), 0));
            }
        } finally {
            setStatsLoading(false);
        }
    }, [getToken]);

    return { targetSeconds, streak, todaySeconds, statsLoading, loadStats };
}
