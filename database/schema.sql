-- AmiPecetAI — Database Schema
-- PostgreSQL 16+

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    tier            VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    stamps_today    INTEGER DEFAULT 0,
    stamps_reset_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 day',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── CERTIFICATION SESSIONS ─────────────────────────────────
CREATE TABLE certification_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    raw_input       TEXT NOT NULL,
    input_type      VARCHAR(50) DEFAULT 'text',
    source          VARCHAR(50) DEFAULT 'unknown',
    output_hash     VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256
    blake3_hash     VARCHAR(64),
    overall_score   INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    noise_ratio     FLOAT CHECK (noise_ratio BETWEEN 0 AND 1),
    status          VARCHAR(20) CHECK (status IN ('approved', 'rejected', 'partial')),
    summary         TEXT,
    seal_data       JSONB,
    expires_at      TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
    deleted         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── PILLAR RESULTS ─────────────────────────────────────────
CREATE TABLE pillar_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES certification_sessions(id) ON DELETE CASCADE,
    pillar_id       VARCHAR(50) NOT NULL,
    pillar_name     VARCHAR(100),
    score           INTEGER CHECK (score BETWEEN 0 AND 100),
    status          VARCHAR(20) CHECK (status IN ('pass', 'warning', 'fail')),
    findings        JSONB DEFAULT '[]',
    flags           JSONB DEFAULT '[]',
    confidence      FLOAT,
    details         TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── CCL FLAGS ──────────────────────────────────────────────
CREATE TABLE ccl_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES certification_sessions(id) ON DELETE CASCADE,
    flag_type       VARCHAR(100) NOT NULL,
    severity        VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description     TEXT,
    quote           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── AUDIT LOG (GDPR) ───────────────────────────────────────
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_id     UUID,
    resource_type   VARCHAR(50),
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX idx_sessions_user_id    ON certification_sessions(user_id);
CREATE INDEX idx_sessions_hash       ON certification_sessions(output_hash);
CREATE INDEX idx_sessions_expires    ON certification_sessions(expires_at) WHERE deleted = FALSE;
CREATE INDEX idx_pillars_session     ON pillar_results(session_id);
CREATE INDEX idx_flags_session       ON ccl_flags(session_id);
CREATE INDEX idx_audit_user          ON audit_log(user_id);
CREATE INDEX idx_audit_created       ON audit_log(created_at);

-- ── AUTO-EXPIRE (run daily via cron) ──────────────────────
-- UPDATE certification_sessions SET deleted = TRUE
-- WHERE expires_at < NOW() AND deleted = FALSE;

-- ── FUNCTIONS ──────────────────────────────────────────────

-- Reset daily stamp counts
CREATE OR REPLACE FUNCTION reset_daily_stamps()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET stamps_today = 0,
        stamps_reset_at = NOW() + INTERVAL '1 day'
    WHERE stamps_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
    total_sessions  BIGINT,
    approved_count  BIGINT,
    rejected_count  BIGINT,
    partial_count   BIGINT,
    avg_score       NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)                                    AS total_sessions,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'partial')  AS partial_count,
        ROUND(AVG(overall_score)::NUMERIC, 1)       AS avg_score
    FROM certification_sessions
    WHERE user_id = p_user_id AND deleted = FALSE;
END;
$$ LANGUAGE plpgsql;
