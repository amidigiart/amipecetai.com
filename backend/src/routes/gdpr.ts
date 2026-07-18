import { Router } from 'express';
import { query, getClient } from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// GDPR Art. 20 — Data Portability
router.get('/export/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.userId) {
      res.status(403).json({ error: 'Can only export your own data' });
      return;
    }

    const user = await query('SELECT id, email, tier, created_at FROM users WHERE id = $1', [req.userId]);
    if (!user.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const sessions = await query(
      `SELECT id, raw_input, source, output_hash, blake3_hash,
              overall_score, noise_ratio, status, summary, seal_data,
              expires_at, created_at
       FROM certification_sessions
       WHERE user_id = $1 AND deleted = FALSE
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const allPillars = await query(
      `SELECT pr.session_id, pr.pillar_id, pr.pillar_name, pr.score,
              pr.status, pr.findings, pr.flags, pr.confidence, pr.details
       FROM pillar_results pr
       JOIN certification_sessions cs ON cs.id = pr.session_id
       WHERE cs.user_id = $1 AND cs.deleted = FALSE`,
      [req.userId]
    );

    const pillarMap = new Map<string, any[]>();
    for (const p of allPillars.rows) {
      const list = pillarMap.get(p.session_id) || [];
      list.push(p);
      pillarMap.set(p.session_id, list);
    }

    const auditLog = await query(
      `SELECT action, resource_type, metadata, created_at
       FROM audit_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [req.userId]
    );

    await query(
      `INSERT INTO audit_log (user_id, action, resource_type, ip_address, user_agent)
       VALUES ($1, 'gdpr_export', 'user', $2, $3)`,
      [req.userId, req.ip, req.headers['user-agent'] || null]
    );

    const exportData = {
      exportedAt: new Date().toISOString(),
      gdprArticle: 'Art. 20 — Data Portability',
      user: user.rows[0],
      sessions: sessions.rows.map(s => ({
        ...s,
        pillars: pillarMap.get(s.id) || [],
      })),
      auditLog: auditLog.rows,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="amipecetai-export-${req.userId}.json"`);
    res.json(exportData);
  } catch (err: any) {
    console.error('[GDPR Export] Error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

// GDPR Art. 17 — Right to Erasure
router.delete('/delete/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.userId) {
      res.status(403).json({ error: 'Can only delete your own data' });
      return;
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const sessions = await client.query(
        'SELECT id FROM certification_sessions WHERE user_id = $1',
        [req.userId]
      );
      const sessionIds = sessions.rows.map((r: any) => r.id);

      if (sessionIds.length > 0) {
        await client.query(
          'DELETE FROM ccl_flags WHERE session_id = ANY($1)',
          [sessionIds]
        );
        await client.query(
          'DELETE FROM pillar_results WHERE session_id = ANY($1)',
          [sessionIds]
        );
        await client.query(
          'DELETE FROM certification_sessions WHERE user_id = $1',
          [req.userId]
        );
      }

      await client.query(
        `UPDATE audit_log SET metadata = '{"gdpr_erased": true}'::jsonb, user_id = NULL
         WHERE user_id = $1`,
        [req.userId]
      );

      await client.query('DELETE FROM users WHERE id = $1', [req.userId]);

      await client.query(
        `INSERT INTO audit_log (action, resource_type, metadata, ip_address)
         VALUES ('gdpr_erasure', 'user', $1, $2)`,
        [JSON.stringify({ erasedUserId: req.userId, sessionsDeleted: sessionIds.length }), req.ip]
      );

      await client.query('COMMIT');

      res.json({
        erased: true,
        sessionsDeleted: sessionIds.length,
        gdprArticle: 'Art. 17 — Right to Erasure',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[GDPR Delete] Error:', err.message);
    res.status(500).json({ error: 'Erasure failed' });
  }
});

export default router;
