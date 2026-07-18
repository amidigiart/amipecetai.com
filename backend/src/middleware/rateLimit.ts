import type { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../redis.js';

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rl:${req.ip}:${req.path}`;

    const cached = await cacheGet(key);
    if (cached) {
      const count = parseInt(cached, 10);
      if (count >= maxRequests) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: windowSeconds,
        });
        return;
      }
      await cacheSet(key, String(count + 1), windowSeconds);
      next();
      return;
    }

    const now = Date.now();
    const entry = memoryStore.get(key);

    if (entry && entry.resetAt > now) {
      if (entry.count >= maxRequests) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
        return;
      }
      entry.count++;
    } else {
      memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    }

    next();
  };
}
