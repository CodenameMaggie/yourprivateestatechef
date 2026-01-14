-- ============================================================================
-- CHEF PORTAL DATABASE SCHEMA
-- Purpose: Add chef authentication, sessions, and portal features
-- ============================================================================

-- Add missing columns to ypec_chefs table for portal functionality
ALTER TABLE ypec_chefs
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS previous_positions TEXT,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create chef sessions table for authentication
CREATE TABLE IF NOT EXISTS ypec_chef_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chef_id UUID NOT NULL REFERENCES ypec_chefs(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_chef_sessions_token ON ypec_chef_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chef_sessions_chef_id ON ypec_chef_sessions(chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_sessions_expires ON ypec_chef_sessions(expires_at);

-- Create trigger to update chef updated_at timestamp
CREATE OR REPLACE FUNCTION update_chef_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ypec_chefs_updated_at ON ypec_chefs;
CREATE TRIGGER update_ypec_chefs_updated_at
    BEFORE UPDATE ON ypec_chefs
    FOR EACH ROW
    EXECUTE FUNCTION update_chef_timestamp();

-- Clean up expired sessions (run this periodically or via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_chef_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ypec_chef_sessions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE ypec_chef_sessions IS 'Chef authentication sessions for portal access';
COMMENT ON COLUMN ypec_chefs.password_hash IS 'Hashed password for chef portal login (TODO: use bcrypt)';
COMMENT ON COLUMN ypec_chefs.login_enabled IS 'Whether chef can access portal (enabled after application approval)';
COMMENT ON COLUMN ypec_chefs.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN ypec_chefs.bio IS 'Chef professional bio and culinary philosophy';
COMMENT ON COLUMN ypec_chefs.previous_positions IS 'Previous notable positions and experience';
COMMENT ON COLUMN ypec_chefs.rating IS 'Chef average rating from client feedback';
COMMENT ON COLUMN ypec_chefs.available IS 'Whether chef is accepting new bookings';

-- Verify table structure
SELECT
    'ypec_chefs columns added' as status,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'ypec_chefs'
AND column_name IN ('password_hash', 'login_enabled', 'bio', 'rating', 'available');

SELECT
    'ypec_chef_sessions table created' as status,
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ypec_chef_sessions'
    ) as exists;
