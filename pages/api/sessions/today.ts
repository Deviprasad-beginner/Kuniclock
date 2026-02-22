import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId: string;
  try {
    const decoded = await verifyIdToken(req.headers.authorization);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: { subject: true },
      orderBy: { startTime: 'desc' },
    });

    return res.status(200).json(sessions);
  } catch {
    return res.status(500).json({ error: 'Unable to load today sessions' });
  }
}
