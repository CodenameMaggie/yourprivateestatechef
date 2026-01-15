-- ============================================================================
-- YPEC CLIENT PORTAL TABLES
-- Purpose: Client/household login and portal access system
-- ============================================================================

-- Household sessions table (for client login)
CREATE TABLE IF NOT EXISTS ypec_household_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Household preferences table
CREATE TABLE IF NOT EXISTS ypec_household_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,

    -- Dietary Requirements
    dietary_restrictions JSONB, -- array: ["gluten-free", "dairy-free", "nut-allergy"]
    allergies JSONB, -- array: ["shellfish", "peanuts"]
    dislikes JSONB, -- array: ["cilantro", "mushrooms"]
    favorite_cuisines JSONB, -- array: ["Italian", "Japanese", "Mediterranean"]

    -- Service Preferences
    preferred_chef_id UUID REFERENCES ypec_chefs(id),
    backup_chef_id UUID REFERENCES ypec_chefs(id),
    preferred_service_times JSONB, -- {"monday": ["6pm-8pm"], "friday": ["7pm-9pm"]}
    meal_frequency VARCHAR(50), -- "weekly", "bi-weekly", "monthly", "as-needed"

    -- Communication Preferences
    notification_email VARCHAR(255),
    notification_phone VARCHAR(20),
    preferred_contact_method VARCHAR(20), -- "email", "phone", "text", "whatsapp"
    reminder_frequency VARCHAR(20), -- "24_hours", "48_hours", "1_week"

    -- Special Instructions
    kitchen_notes TEXT, -- "Kitchen access code: 1234", "Key under mat"
    parking_instructions TEXT,
    special_requests TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household documents table (invoices, contracts, receipts)
CREATE TABLE IF NOT EXISTS ypec_household_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,

    document_type VARCHAR(50) NOT NULL, -- "invoice", "contract", "receipt", "menu"
    title VARCHAR(255) NOT NULL,
    file_url TEXT, -- Cloud storage URL
    file_name VARCHAR(255),
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100),

    -- Document metadata
    document_date DATE,
    amount DECIMAL(10, 2), -- For invoices/receipts
    paid BOOLEAN DEFAULT FALSE,

    -- Access control
    uploaded_by VARCHAR(100), -- "system", "admin", "chef"
    visible_to_client BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_household_sessions_token ON ypec_household_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_household_sessions_household_id ON ypec_household_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_household_sessions_expires ON ypec_household_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_household_preferences_household_id ON ypec_household_preferences(household_id);

CREATE INDEX IF NOT EXISTS idx_household_documents_household_id ON ypec_household_documents(household_id);
CREATE INDEX IF NOT EXISTS idx_household_documents_type ON ypec_household_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_household_documents_date ON ypec_household_documents(document_date);

-- Add password and household name fields to existing ypec_households table
-- This allows clients to login to their portal
ALTER TABLE ypec_households
ADD COLUMN IF NOT EXISTS household_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT FALSE;

-- Create function to clean up expired client sessions
CREATE OR REPLACE FUNCTION cleanup_expired_client_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ypec_household_sessions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_household_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_household_preferences_updated_at ON ypec_household_preferences;
CREATE TRIGGER update_household_preferences_updated_at
    BEFORE UPDATE ON ypec_household_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_household_preferences_timestamp();

DROP TRIGGER IF EXISTS update_household_documents_updated_at ON ypec_household_documents;
CREATE TRIGGER update_household_documents_updated_at
    BEFORE UPDATE ON ypec_household_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_household_preferences_timestamp();

-- ============================================================================
-- INITIAL TEST DATA (OPTIONAL - FOR DEVELOPMENT ONLY)
-- ============================================================================

-- Create a test household account for demonstration
-- Password: "TestClient123"
INSERT INTO ypec_households (
    household_name,
    primary_contact_name,
    email,
    phone,
    primary_address,
    password_hash,
    login_enabled,
    status
)
VALUES (
    'Forbes Test Household',
    'Test Client',
    'test@example.com',
    '555-0100',
    '123 Test Street, Austin, TX 78701',
    'TestClient123',  -- TEMPORARY: Replace with bcrypt hash in production
    TRUE,
    'active'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  login_enabled = EXCLUDED.login_enabled;

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. CLIENT PORTAL ACCESS:
--    - Clients login at /client-login.html
--    - Dashboard at /client-dashboard.html
--    - Session expires after 7 days of inactivity
--
-- 2. PASSWORD SECURITY:
--    - Currently using plain text passwords (DEVELOPMENT ONLY)
--    - MUST implement bcrypt hashing before production
--    - Add password strength requirements
--    - Implement password reset via email
--
-- 3. SESSION CLEANUP:
--    Run cleanup_expired_client_sessions() daily via cron
--
-- 4. HOUSEHOLD SETUP:
--    - Admin creates household account in dashboard
--    - Sets temporary password
--    - Sends welcome email to client with login link
--    - Client logs in and changes password on first use
--
-- 5. PREFERENCES:
--    - Automatically created when household is created
--    - Clients can update via portal
--    - Chefs can view before engagements
--
