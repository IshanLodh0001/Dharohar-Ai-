import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllInspections, getDashboardStats } from '../../../lib/storage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { stats } = req.query;
    if (stats === 'true') {
      return res.status(200).json(getDashboardStats());
    }
    return res.status(200).json(getAllInspections());
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
