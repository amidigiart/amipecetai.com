import { Router } from 'express';
import { query } from '../db.js';
import { cacheGet, cacheSet } from '../redis.js';

const router = Router();

router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!/^[a-f0-9]{32,64}$/i.test(hash)) {
      res.status(400).json({ error: 'Invalid hash format' });
      return;
    }

    const cached = await cacheGet(`verify:${hash}`);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const session = await query(
      `SELECT output_hash, blake3_hash, overall_score, status, seal_data,
              expires_at, created_at
       FROM certification_sessions
       WHERE output_hash = $1 AND deleted = FALSE`,
      [hash]
    );

    if (!session.rows[0]) {
      res.status(404).json({
        valid: false,
        error: 'No certification found for this hash',
      });
      return;
    }

    const s = session.rows[0];
    const expired = new Date(s.expires_at) < new Date();

    const result = {
      valid: !expired,
      expired,
      hash: s.output_hash,
      blake3Hash: s.blake3_hash,
      score: s.overall_score,
      status: s.status,
      sealData: s.seal_data,
      certifiedAt: s.created_at,
      expiresAt: s.expires_at,
    };

    await cacheSet(`verify:${hash}`, JSON.stringify(result), expired ? 300 : 3600);
    res.json(result);
  } catch (err: any) {
    console.error('[Verify] Error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
