import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

// Class 12th Science stream subjects (covers both PCM and PCB)
const DEFAULT_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Computer Science',
  'English',
  'Physical Education',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let userId: string;
  try {
    const decoded = await verifyIdToken(req.headers.authorization);
    userId = decoded.uid;
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ─── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      let subjects = await prisma.subject.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });

      // Seed defaults for brand-new users
      if (subjects.length === 0) {
        await prisma.subject.createMany({
          data: DEFAULT_SUBJECTS.map((name) => ({ name, userId })),
          skipDuplicates: true,
        });
        subjects = await prisma.subject.findMany({
          where: { userId },
          orderBy: { name: 'asc' },
        });
      }

      return res.status(200).json(subjects);
    } catch (e) {
      console.error('[subjects GET]', e);
      return res.status(500).json({ error: 'Unable to load subjects' });
    }
  }

  // ─── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name } = req.body as { name?: unknown };

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const normalizedName = name.trim();

    if (normalizedName.length > 80) {
      return res.status(400).json({ error: 'name must be 80 characters or fewer' });
    }

    try {
      const subject = await prisma.subject.create({
        data: { name: normalizedName, userId },
      });
      return res.status(201).json(subject);
    } catch (cause) {
      if (
        cause instanceof Prisma.PrismaClientKnownRequestError &&
        cause.code === 'P2002'
      ) {
        return res.status(409).json({ error: 'A subject with this name already exists' });
      }
      console.error('[subjects POST]', cause);
      return res.status(500).json({ error: 'Unable to create subject' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
