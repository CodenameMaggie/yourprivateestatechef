-- ============================================================================
-- YPEC ADMIN AUTHENTICATION TABLES
-- Purpose: Staff login and session management for admin dashboard
-- ============================================================================

-- Staff table (admin users)
CREATE TABLE IF NOT EXISTS ypec_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'chef_manager', 'operations', 'finance', 'marketing')),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    hired_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS ypec_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES ypec_staff(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON ypec_staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON ypec_staff(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON ypec_admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_staff_id ON ypec_admin_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON ypec_admin_sessions(expires_at);

-- Insert default admin user
INSERT INTO ypec_staff (full_name, email, password_hash, role, phone)
VALUES (
    'Maggie Forbes',
    'maggie@maggieforbesstrategies.com',
    'Success@2026!',  -- TEMPORARY: Replace with bcrypt hash in production
    'admin',
    NULL
)
ON CONFLICT (email) DO NOTHING;

-- Create function to clean up expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ypec_admin_sessions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON ypec_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. DEFAULT ADMIN CREDENTIALS:
--    Email: maggie@maggieforbesstrategies.com
--    Password: Success@2026!
--
-- 2. SECURITY TODOS:
--    - Replace password_hash with bcrypt hashed passwords
--    - Install bcryptjs: npm install bcryptjs
--    - Update operations.js adminLogin to use bcrypt.compare()
--    - Add password reset functionality
--    - Add 2FA for admin accounts (optional)
--
-- 3. SESSION CLEANUP:
--    Run cleanup_expired_sessions() daily via cron
--    Add to cron-config.js:
--    cron.schedule('0 2 * * *', async () => {
--      await supabase.rpc('cleanup_expired_sessions');
--    });
--
-- 4. ROLES:
--    - admin: Full system access
--    - chef_manager: Chef relations, recruitment, scheduling
--    - operations: Events, engagements, logistics
--    - finance: Invoices, payments, revenue
--    - marketing: Leads, campaigns, waitlist
--
