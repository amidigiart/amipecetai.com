import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await query(
      `SELECT id, user_id, input_type, source, output_hash, blake3_hash,
              overall_score, noise_ratio, status, summary, seal_data,
              expires_at, created_at
       FROM certification_sessions
       WHERE id = $1 AND deleted = FALSE`,
      [id]
    );

    if (!session.rows[0]) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const pillars = await query(
      `SELECT pillar_id, pillar_name, score, status, findings, flags, confidence, details
       FROM pillar_results WHERE session_id = $1 ORDER BY created_at`,
      [id]
    );

    const flags = await query(
      'SELECT flag_type, severity, description, quote FROM ccl_flags WHERE session_id = $1',
      [id]
    );

    res.json({
      ...session.rows[0],
      pillars: pillars.rows,
      cclFlags: flags.rows,
    });
  } catch (err: any) {
    console.error('[Sessions] Get error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await query(
      `SELECT id, source, output_hash, overall_score, noise_ratio, status,
              summary, seal_data, expires_at, created_at
       FROM certification_sessions
       WHERE user_id = $1 AND deleted = FALSE
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );

    const count = await query(
      'SELECT COUNT(*) FROM certification_sessions WHERE user_id = $1 AND deleted = FALSE',
      [req.userId]
    );

    res.json({
      sessions: sessions.rows,
      total: parseInt(count.rows[0].count),
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('[Sessions] List error:', err.message);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const session = await query(
      'SELECT id, user_id FROM certification_sessions WHERE id = $1 AND deleted = FALSE',
      [id]
    );

    if (!session.rows[0]) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.rows[0].user_id !== req.userId) {
      res.status(403).json({ error: 'Not your session' });
      return;
    }

    await query(
      'UPDATE certification_sessions SET deleted = TRUE WHERE id = $1',
      [id]
    );

    await query(
      `INSERT INTO audit_log (user_id, action, resource_id, resource_type, ip_address, user_agent)
       VALUES ($1, 'kill_switch', $2, 'session', $3, $4)`,
      [req.userId, id, req.ip, req.headers['user-agent'] || null]
    );

    res.json({ deleted: true, sessionId: id });
  } catch (err: any) {
    console.error('[Sessions] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
