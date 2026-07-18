import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db.js';
import { getRedis } from './redis.js';
import certifyRouter from './routes/certify.js';
import sessionsRouter from './routes/sessions.js';
import verifyRouter from './routes/verify.js';
import gdprRouter from './routes/gdpr.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.set('trust proxy', 1);

// ── Routes ────────────────────────────────────────────────
app.use('/api/certify', certifyRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/gdpr', gdprRouter);

// ── Health ────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = { status: 'ok', version: '1.0.0' };

  try {
    await pool.query('SELECT 1');
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'connected';
    } catch {
      checks.redis = 'disconnected';
    }
  } else {
    checks.redis = 'not configured';
  }

  checks.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';
  checks.uptime = `${Math.round(process.uptime())}s`;

  const healthy = checks.database === 'connected';
  res.status(healthy ? 200 : 503).json(checks);
});

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   AmiPecetAI Backend v1.0.0          ║
  ║   Port: ${PORT}                          ║
  ║   CORS: ${FRONTEND_URL.slice(0, 28).padEnd(28)}  ║
  ╚═══════════════════════════════════════╝
  `);
});

export default app;
