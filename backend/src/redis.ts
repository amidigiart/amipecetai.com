import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });
    redis.connect().catch(() => {
      console.warn('[Redis] Connection failed — running without cache');
      redis = null;
    });
  } catch {
    console.warn('[Redis] Not available — running without cache');
    redis = null;
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try { return await r.get(key); } catch { return null; }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try { await r.setex(key, ttlSeconds, value); } catch { /* silent */ }
}
