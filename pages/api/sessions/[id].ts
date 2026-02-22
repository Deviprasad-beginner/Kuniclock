import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const sessionId = typeof id === 'string' ? parseInt(id, 10) : NaN;

    if (isNaN(sessionId) || sessionId <= 0) {
        return res.status(400).json({ error: 'Invalid session id' });
    }

    let userId: string;
    try {
        const decoded = await verifyIdToken(req.headers.authorization);
        userId = decoded.uid;
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'DELETE') {
        try {
            // Verify ownership before deleting
            const session = await prisma.studySession.findFirst({
                where: { id: sessionId, userId },
                select: { id: true },
            });
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            await prisma.studySession.delete({ where: { id: sessionId } });
            return res.status(204).end();
        } catch {
            return res.status(500).json({ error: 'Unable to delete session' });
        }
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
}
