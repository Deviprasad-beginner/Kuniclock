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
        select: {
          id: true,
          duration: true,
          startTime: true,
          endTime: true,
          intent: true,
          targetDuration: true,
          subject: { select: { name: true } }
        },
        orderBy,
      });

      return res.status(200).json(sessions);
    } catch {
      return res.status(500).json({ error: 'Unable to load sessions' });
    }
  }

  // ─── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { subjectId, intent, startTime, endTime, targetDuration } = req.body as {
      subjectId?: unknown;
      intent?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      targetDuration?: unknown;
    };
    const parsedSubjectId = toFiniteNumber(subjectId);
    const parsedStartTime = toFiniteNumber(startTime);
    const parsedEndTime = toFiniteNumber(endTime);
    const parsedTargetDuration = toFiniteNumber(targetDuration);

    // Parse intent as a string or null
    const parsedIntent = typeof intent === 'string' && intent.trim() !== '' ? intent.trim() : null;

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
          intent: parsedIntent,
          targetDuration: parsedTargetDuration,
          startTime: new Date(parsedStartTime),
          endTime: new Date(parsedEndTime),
          duration,
          userId,
        },
        include: { subject: true },
      });

      // --- Streak Calculation ---
      try {
        const target = await prisma.userTarget.findUnique({ where: { userId } });
        if (target) {
          // Get start and end of the local day for the session's end time
          const sessionDate = new Date(parsedEndTime);
          const startOfDay = new Date(sessionDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(sessionDate);
          endOfDay.setHours(23, 59, 59, 999);

          // Format date as YYYY-MM-DD in local time
          const pad = (n: number) => n.toString().padStart(2, '0');
          const dateString = `${sessionDate.getFullYear()}-${pad(sessionDate.getMonth() + 1)}-${pad(sessionDate.getDate())}`;

          if (target.lastHitDate !== dateString) {
            // Calculate total duration for this day
            const dailySessions = await prisma.studySession.aggregate({
              where: {
                userId,
                startTime: { gte: startOfDay, lte: endOfDay },
              },
              _sum: { duration: true },
            });

            const totalToday = dailySessions._sum.duration || 0;

            if (totalToday >= target.dailySeconds) {
              // Target hit!

              // Check if they missed a day to reset streak
              let newStreak = target.currentStreak + 1;
              if (target.lastHitDate) {
                const [year, month, day] = target.lastHitDate.split('-').map(Number);
                const lastDate = new Date(year, month - 1, day);
                lastDate.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(startOfDay.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                  newStreak = 1; // Streak broken, restart at 1
                }
              }

              await prisma.userTarget.update({
                where: { userId },
                data: { currentStreak: newStreak, lastHitDate: dateString },
              });
            }
          }
        }
      } catch (streakError) {
        console.error('Failed to update streak:', streakError);
        // Do not fail the session creation if streak update fails
      }

      return res.status(201).json(session);
    } catch {
      return res.status(500).json({ error: 'Unable to save session' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
