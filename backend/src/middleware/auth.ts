import type { Request, Response, NextFunction } from 'express';
import { query } from '../db.js';

export interface AuthRequest extends Request {
  userId?: string;
  userTier?: 'free' | 'pro';
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (userId) {
    try {
      const result = await query('SELECT id, tier FROM users WHERE id = $1', [userId]);
      if (result.rows[0]) {
        req.userId = result.rows[0].id;
        req.userTier = result.rows[0].tier;
      }
    } catch { /* proceed without auth */ }
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header' });
    return;
  }

  try {
    const result = await query('SELECT id, tier FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    req.userId = result.rows[0].id;
    req.userTier = result.rows[0].tier;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth error' });
  }
}
