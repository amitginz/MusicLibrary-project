import { Response } from 'express';
import { AuthRequest } from '../types';
import { searchYouTube } from '../services/youtube.service';

export async function search(req: AuthRequest, res: Response): Promise<void> {
  const query = req.query.q as string;
  if (!query?.trim()) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }
  const items = await searchYouTube(query.trim());
  res.json({ items });
}
