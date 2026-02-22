import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

function toFiniteNumber(value: unknown): number | null {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

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
    const { filter, sort } = req.query as { filter?: string; sort?: string };

    try {
      let startOfRange: Date | undefined;
      const now = new Date();

      if (filter === 'today') {
        startOfRange = new Date(now);
        startOfRange.setHours(0, 0, 0, 0);
      } else if (filter === 'week') {
        startOfRange = new Date(now);
        // Monday of current week
        const day = startOfRange.getDay(); // 0=Sun
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        startOfRange.setDate(startOfRange.getDate() + diffToMonday);
        startOfRange.setHours(0, 0, 0, 0);
      }

      const orderBy =
        sort === 'duration_asc'
          ? { duration: 'asc' as const }
          : sort === 'duration_desc'
            ? { duration: 'desc' as const }
            : { startTime: 'desc' as const }; // default: most recent

      const sessions = await prisma.studySession.findMany({
        where: {
          userId,
          ...(startOfRange ? { startTime: { gte: startOfRange } } : {}),
        },
        include: { subject: true },
        orderBy,
      });

      return res.status(200).json(sessions);
    } catch {
      return res.status(500).json({ error: 'Unable to load sessions' });
    }
  }

  // ─── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { subjectId, startTime, endTime } = req.body as {
      subjectId?: unknown;
      startTime?: unknown;
      endTime?: unknown;
    };
    const parsedSubjectId = toFiniteNumber(subjectId);
    const parsedStartTime = toFiniteNumber(startTime);
    const parsedEndTime = toFiniteNumber(endTime);

    if (!parsedSubjectId || !Number.isInteger(parsedSubjectId) || parsedSubjectId <= 0) {
      return res.status(400).json({ error: 'subjectId must be a positive integer' });
    }
    if (!parsedStartTime || !parsedEndTime) {
      return res.status(400).json({ error: 'startTime and endTime must be valid timestamps' });
    }
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ error: 'endTime must be later than startTime' });
    }

    const duration = Math.max(1, Math.floor((parsedEndTime - parsedStartTime) / 1000));

    try {
      const subject = await prisma.subject.findFirst({
        where: { id: parsedSubjectId, userId },
        select: { id: true },
      });
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      const session = await prisma.studySession.create({
        data: {
          subjectId: parsedSubjectId,
          startTime: new Date(parsedStartTime),
          endTime: new Date(parsedEndTime),
          duration,
          userId,
        },
        include: { subject: true },
      });

      return res.status(201).json(session);
    } catch {
      return res.status(500).json({ error: 'Unable to save session' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
