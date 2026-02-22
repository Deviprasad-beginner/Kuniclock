import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

function toFiniteNumber(value: unknown): number | null {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      const subject = await prisma.subject.findUnique({
        where: { id: parsedSubjectId },
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
        },
        include: {
          subject: true,
        },
      });

      return res.status(201).json(session);
    } catch {
      return res.status(500).json({ error: 'Unable to save session' });
    }
  }

  if (req.method === 'GET') {
    try {
      const sessions = await prisma.studySession.findMany({
        include: { subject: true },
        orderBy: { startTime: 'desc' },
      });

      return res.status(200).json(sessions);
    } catch {
      return res.status(500).json({ error: 'Unable to load sessions' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
