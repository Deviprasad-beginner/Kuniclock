import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    let userId: string;
    try {
        const decoded = await verifyIdToken(req.headers.authorization);
        userId = decoded.uid;
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // ─── GET ────────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            let target = await prisma.userTarget.findUnique({
                where: { userId },
            });

            if (!target) {
                target = await prisma.userTarget.create({
                    data: { userId, dailySeconds: 7200, currentStreak: 0 },
                });
            }

            return res.status(200).json(target);
        } catch {
            return res.status(500).json({ error: 'Unable to load target' });
        }
    }

    // ─── POST ───────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
        const { dailySeconds } = req.body as { dailySeconds?: number };

        if (!dailySeconds || !Number.isInteger(dailySeconds) || dailySeconds <= 0) {
            return res.status(400).json({ error: 'dailySeconds must be a positive integer' });
        }

        try {
            const target = await prisma.userTarget.upsert({
                where: { userId },
                update: { dailySeconds },
                create: { userId, dailySeconds, currentStreak: 0 },
            });

            return res.status(200).json(target);
        } catch {
            return res.status(500).json({ error: 'Unable to update target' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
}
