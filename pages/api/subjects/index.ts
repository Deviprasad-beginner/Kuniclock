import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

const DEFAULT_SUBJECTS = ['Math', 'English', 'Science', 'History'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      let subjects = await prisma.subject.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      if (subjects.length === 0) {
        await prisma.subject.createMany({
          data: DEFAULT_SUBJECTS.map((name) => ({ name })),
          skipDuplicates: true,
        });

        subjects = await prisma.subject.findMany({
          orderBy: {
            name: 'asc',
          },
        });
      }

      return res.status(200).json(subjects);
    } catch {
      return res.status(500).json({ error: 'Unable to load subjects' });
    }
  }

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
        data: { name: normalizedName },
      });

      return res.status(201).json(subject);
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002') {
        return res.status(409).json({ error: 'A subject with this name already exists' });
      }
      return res.status(500).json({ error: 'Unable to create subject' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
