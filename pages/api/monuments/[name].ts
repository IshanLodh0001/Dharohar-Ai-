import type { NextApiRequest, NextApiResponse } from 'next';
import { getInspectionsByMonument } from '../../../lib/storage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { name } = req.query;
  const inspections = getInspectionsByMonument(decodeURIComponent(name as string));

  return res.status(200).json(inspections);
}
