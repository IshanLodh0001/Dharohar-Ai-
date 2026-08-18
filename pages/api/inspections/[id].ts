import type { NextApiRequest, NextApiResponse } from 'next';
import { getInspectionById } from '../../../lib/storage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const record = getInspectionById(id as string);

  if (!record) return res.status(404).json({ error: 'Inspection not found' });
  return res.status(200).json(record);
}
