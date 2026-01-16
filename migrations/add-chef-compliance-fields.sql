-- ============================================================================
-- Add Chef Compliance and Geographic Targeting Fields
-- Tracks background checks, criminal record clearances, and location preferences
-- ============================================================================

-- Add compliance tracking fields to users table (chefs stored as user_type='chef')
ALTER TABLE users ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'not_started';
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(50) DEFAULT 'not_requested';
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_jurisdiction VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_document_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_requested_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_instructions JSONB;

-- Canadian-specific checks
ALTER TABLE users ADD COLUMN IF NOT EXISTS vulnerable_sector_check BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vulnerable_sector_check_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rcmp_clearance BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rcmp_clearance_date TIMESTAMP WITH TIME ZONE;

-- Document verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Geographic preferences and targeting
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_preferences JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE;

-- Clients (households) also need location tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS market_tier VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_elderly BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS requires_vulnerable_sector_check BOOLEAN DEFAULT FALSE;

-- Create indexes for compliance queries
CREATE INDEX IF NOT EXISTS idx_users_compliance_status ON users(compliance_status) WHERE user_type = 'chef';
CREATE INDEX IF NOT EXISTS idx_users_background_check_status ON users(background_check_status) WHERE user_type = 'chef';
CREATE INDEX IF NOT EXISTS idx_users_background_check_expiry ON users(background_check_expiry_date) WHERE user_type = 'chef';
CREATE INDEX IF NOT EXISTS idx_users_preferred_location ON users(preferred_location) WHERE user_type = 'chef';
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(documents_verified) WHERE user_type = 'chef';

CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(location);
CREATE INDEX IF NOT EXISTS idx_clients_requires_vulnerable_sector ON clients(requires_vulnerable_sector_check) WHERE requires_vulnerable_sector_check = TRUE;

-- Add compliance status check values
COMMENT ON COLUMN users.compliance_status IS 'Compliance workflow: not_started, pending_background_check, under_review, verified, rejected, non_compliant';
COMMENT ON COLUMN users.background_check_status IS 'Background check status: not_requested, requested, submitted, verified';

-- Add trigger to auto-update compliance_status when background checks are verified
CREATE OR REPLACE FUNCTION update_chef_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If background check is verified and documents are verified, set compliance to verified
  IF NEW.background_check_status = 'verified' AND NEW.documents_verified = TRUE THEN
    NEW.compliance_status = 'verified';
  END IF;

  -- If background check expires in less than 30 days, set to non_compliant
  IF NEW.background_check_expiry_date IS NOT NULL AND NEW.background_check_expiry_date < NOW() THEN
    NEW.compliance_status = 'non_compliant';
    NEW.documents_verified = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chef_compliance_status_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.user_type = 'chef')
  EXECUTE FUNCTION update_chef_compliance_status();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added chef compliance and geographic targeting fields';
  RAISE NOTICE 'Compliance statuses: not_started, pending_background_check, under_review, verified, rejected, non_compliant';
  RAISE NOTICE 'Background check statuses: not_requested, requested, submitted, verified';
END $$;
