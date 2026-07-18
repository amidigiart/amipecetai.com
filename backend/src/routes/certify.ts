import { Router } from 'express';
import { query, getClient } from '../db.js';
import { sha256, blake3Fallback, generateSealData } from '../crypto.js';
import { cacheGet, cacheSet } from '../redis.js';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { analyzeWithAI, analyzeLocal } from '../engine.js';

const router = Router();

const STAMP_LIMITS = { free: 3, pro: Infinity };

router.post('/', rateLimit(30, 60), optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { text, source = 'unknown', inputType = 'text' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    if (text.length > 50000) {
      res.status(400).json({ error: 'Text too long (max 50,000 characters)' });
      return;
    }

    const hash = sha256(text);

    const cached = await cacheGet(`cert:${hash}`);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const existing = await query(
      'SELECT id, overall_score, noise_ratio, status, summary, seal_data, expires_at, created_at FROM certification_sessions WHERE output_hash = $1 AND deleted = FALSE',
      [hash]
    );
    if (existing.rows[0]) {
      const pillars = await query(
        'SELECT pillar_id, pillar_name, score, status, findings, flags, confidence, details FROM pillar_results WHERE session_id = $1 ORDER BY created_at',
        [existing.rows[0].id]
      );
      const result = {
        sessionId: existing.rows[0].id,
        ...existing.rows[0],
        pillars: pillars.rows,
        cached: true,
      };
      await cacheSet(`cert:${hash}`, JSON.stringify(result), 1800);
      res.json(result);
      return;
    }

    if (req.userId) {
      const user = await query(
        'SELECT stamps_today, stamps_reset_at, tier FROM users WHERE id = $1',
        [req.userId]
      );
      if (user.rows[0]) {
        const u = user.rows[0];
        let stampsToday = u.stamps_today;
        if (new Date(u.stamps_reset_at) < new Date()) {
          await query(
            'UPDATE users SET stamps_today = 0, stamps_reset_at = NOW() + INTERVAL \'1 day\' WHERE id = $1',
            [req.userId]
          );
          stampsToday = 0;
        }
        const limit = STAMP_LIMITS[u.tier as keyof typeof STAMP_LIMITS] ?? 3;
        if (stampsToday >= limit) {
          res.status(429).json({
            error: 'Daily stamp limit reached',
            stampsUsed: stampsToday,
            limit,
            tier: u.tier,
          });
          return;
        }
      }
    }

    let analysis;
    try {
      analysis = await analyzeWithAI(text, source);
    } catch {
      analysis = analyzeLocal(text, source);
    }

    const b3hash = blake3Fallback(text);
    const sealData = generateSealData(analysis.status, hash, analysis.overallScore);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const sessionResult = await client.query(
        `INSERT INTO certification_sessions
          (user_id, raw_input, input_type, source, output_hash, blake3_hash,
           overall_score, noise_ratio, status, summary, seal_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, expires_at, created_at`,
        [
          req.userId || null, text, inputType, source, hash, b3hash,
          analysis.overallScore, analysis.noiseRatio, analysis.status,
          analysis.summary, JSON.stringify(sealData),
        ]
      );

      const sessionId = sessionResult.rows[0].id;

      for (const pillar of analysis.pillars) {
        await client.query(
          `INSERT INTO pillar_results
            (session_id, pillar_id, pillar_name, score, status, findings, flags, confidence, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            sessionId, pillar.id, pillar.name, pillar.score, pillar.status,
            JSON.stringify(pillar.findings), JSON.stringify(pillar.flags),
            pillar.confidence, pillar.details,
          ]
        );
      }

      const cclFlags = analysis.pillars
        .flatMap((p: any) => p.flags || [])
        .filter((f: any) => f.severity === 'high' || f.severity === 'critical');

      for (const flag of cclFlags) {
        await client.query(
          `INSERT INTO ccl_flags (session_id, flag_type, severity, description, quote)
           VALUES ($1, $2, $3, $4, $5)`,
          [sessionId, flag.type, flag.severity, flag.description, flag.quote || null]
        );
      }

      if (req.userId) {
        await client.query(
          'UPDATE users SET stamps_today = stamps_today + 1, updated_at = NOW() WHERE id = $1',
          [req.userId]
        );
      }

      await client.query(
        `INSERT INTO audit_log (user_id, action, resource_id, resource_type, metadata, ip_address, user_agent)
         VALUES ($1, 'certify', $2, 'session', $3, $4, $5)`,
        [
          req.userId || null, sessionId,
          JSON.stringify({ score: analysis.overallScore, status: analysis.status }),
          req.ip, req.headers['user-agent'] || null,
        ]
      );

      await client.query('COMMIT');

      const response = {
        sessionId,
        hash,
        blake3Hash: b3hash,
        overallScore: analysis.overallScore,
        noiseRatio: analysis.noiseRatio,
        status: analysis.status,
        summary: analysis.summary,
        sealData,
        pillars: analysis.pillars,
        expiresAt: sessionResult.rows[0].expires_at,
        createdAt: sessionResult.rows[0].created_at,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      };

      await cacheSet(`cert:${hash}`, JSON.stringify(response), 1800);
      res.status(201).json(response);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Certify] Error:', err.message);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
