-- ============================================================================
-- YPEC MULTI-TENANT MIGRATION
-- Migrates YPEC from standalone tables to Forbes Command multi-tenant architecture
-- Company #7: Your Private Estate Chef (YPEC)
-- ============================================================================

-- Define YPEC tenant ID
DO $$
DECLARE
  ypec_tenant_id UUID := '00000000-0000-0000-0000-000000000007';
BEGIN

-- ============================================================================
-- STEP 1: CREATE SHARED MULTI-TENANT TABLES (if not exist)
-- ============================================================================

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID UNIQUE NOT NULL,
  company_number INTEGER UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_short_name VARCHAR(50) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table (multi-tenant)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  login_enabled BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  session_token TEXT,
  session_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Create index for fast staff lookups
CREATE INDEX IF NOT EXISTS idx_staff_tenant_email ON staff(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_staff_session ON staff(session_token) WHERE session_token IS NOT NULL;

-- Clients table (households)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  client_type VARCHAR(50) DEFAULT 'household',
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  primary_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'US',
  household_size INTEGER,
  dietary_requirements TEXT,
  cuisine_preferences TEXT,
  assigned_chef_id UUID,
  service_frequency VARCHAR(100),
  status VARCHAR(50) DEFAULT 'inquiry',
  referral_source VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_chef ON clients(tenant_id, assigned_chef_id);

-- Leads table (inquiries)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_type VARCHAR(50) DEFAULT 'inquiry',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100),
  message TEXT,
  service_interest VARCHAR(255),
  referral_source VARCHAR(255),
  lead_quality VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_to_client_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, status);

-- Users table (chefs as specialized users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_type VARCHAR(50) DEFAULT 'chef',
  email VARCHAR(255) NOT NULL,
  password_hash TEXT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  region VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  login_enabled BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  session_token TEXT,
  session_expires TIMESTAMP WITH TIME ZONE,

  -- Chef-specific fields
  years_experience INTEGER,
  specialties JSONB DEFAULT '[]',
  culinary_education VARCHAR(255),
  previous_positions TEXT,
  bio TEXT,
  hourly_rate DECIMAL(10, 2),
  max_households INTEGER DEFAULT 3,
  current_households INTEGER DEFAULT 0,
  availability_status VARCHAR(50) DEFAULT 'available',
  onboarding_date TIMESTAMP WITH TIME ZONE,
  referred_by UUID,
  referral_code_used VARCHAR(50),

  admin_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(tenant_id, user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token) WHERE session_token IS NOT NULL;

-- Engagements table (service bookings)
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  engagement_type VARCHAR(50) DEFAULT 'chef_service',
  client_id UUID NOT NULL,
  assigned_user_id UUID,
  event_date DATE NOT NULL,
  event_time TIME,
  service_name VARCHAR(255),
  guests INTEGER,
  special_requirements TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  total_cost DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagements_tenant ON engagements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_user ON engagements(tenant_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_date ON engagements(tenant_id, event_date);

-- Communications table
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  direction VARCHAR(20) NOT NULL,
  from_contact VARCHAR(255),
  to_contact VARCHAR(255),
  subject TEXT,
  message TEXT,
  channel VARCHAR(50),
  status VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_tenant ON communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communications_created ON communications(tenant_id, created_at DESC);

-- ============================================================================
-- STEP 2: INSERT YPEC TENANT RECORD
-- ============================================================================

INSERT INTO tenants (
  tenant_id,
  company_number,
  company_name,
  company_short_name,
  domain,
  industry,
  status,
  settings
) VALUES (
  ypec_tenant_id,
  7,
  'Your Private Estate Chef',
  'YPEC',
  'yourprivateestatechef.com',
  'Private Chef Services',
  'active',
  '{
    "service_regions": ["Texas, USA", "British Columbia, Canada"],
    "hourly_rate_range": {"min": 75, "max": 150},
    "max_chefs_per_household": 1,
    "payment_terms": "weekly",
    "features": {
      "chef_referral_program": true,
      "automated_matching": true,
      "client_portal": true,
      "chef_portal": true
    }
  }'::jsonb
) ON CONFLICT (tenant_id) DO UPDATE SET
  updated_at = NOW(),
  settings = EXCLUDED.settings;

-- ============================================================================
-- STEP 3: MIGRATE EXISTING DATA FROM ypec_* TABLES TO SHARED TABLES
-- ============================================================================

-- Migrate ypec_staff to staff table
INSERT INTO staff (
  tenant_id,
  email,
  password_hash,
  full_name,
  role,
  login_enabled,
  last_login,
  session_token,
  session_expires,
  created_at,
  updated_at
)
SELECT
  ypec_tenant_id,
  email,
  password_hash,
  full_name,
  role,
  login_enabled,
  last_login,
  session_token,
  session_expires,
  created_at,
  updated_at
FROM ypec_staff
ON CONFLICT (tenant_id, email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Migrate ypec_households to clients table
INSERT INTO clients (
  id,
  tenant_id,
  client_type,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  primary_address,
  city,
  state,
  household_size,
  dietary_requirements,
  cuisine_preferences,
  assigned_chef_id,
  service_frequency,
  status,
  referral_source,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  ypec_tenant_id,
  'household',
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  primary_address,
  city,
  state,
  household_size,
  dietary_requirements,
  cuisine_preferences,
  assigned_chef_id,
  service_frequency,
  status,
  referral_source,
  notes,
  created_at,
  updated_at
FROM ypec_households
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Migrate ypec_inquiries to leads table
INSERT INTO leads (
  id,
  tenant_id,
  lead_type,
  name,
  email,
  phone,
  city,
  state,
  message,
  service_interest,
  referral_source,
  lead_quality,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  id,
  ypec_tenant_id,
  'inquiry',
  name,
  email,
  phone,
  city,
  state,
  message,
  service_interest,
  referral_source,
  lead_quality,
  status,
  jsonb_build_object('household_size', household_size, 'cuisine_preferences', cuisine_preferences),
  created_at,
  updated_at
FROM ypec_inquiries
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Migrate ypec_chefs to users table
INSERT INTO users (
  id,
  tenant_id,
  user_type,
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  location,
  region,
  status,
  login_enabled,
  last_login,
  session_token,
  session_expires,
  years_experience,
  specialties,
  culinary_education,
  previous_positions,
  bio,
  hourly_rate,
  max_households,
  current_households,
  availability_status,
  onboarding_date,
  referred_by,
  referral_code_used,
  admin_notes,
  created_at,
  updated_at
)
SELECT
  id,
  ypec_tenant_id,
  'chef',
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  location,
  region,
  status,
  login_enabled,
  last_login,
  session_token,
  session_expires,
  years_experience,
  COALESCE(specialties, '[]'::jsonb),
  culinary_education,
  previous_positions,
  bio,
  hourly_rate,
  max_households,
  current_households,
  availability_status,
  onboarding_date,
  referred_by,
  referral_code_used,
  admin_notes,
  created_at,
  updated_at
FROM ypec_chefs
ON CONFLICT (tenant_id, email) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Migrate ypec_engagements to engagements table
INSERT INTO engagements (
  id,
  tenant_id,
  engagement_type,
  client_id,
  assigned_user_id,
  event_date,
  event_time,
  service_name,
  guests,
  special_requirements,
  status,
  total_cost,
  paid_amount,
  payment_status,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  ypec_tenant_id,
  'chef_service',
  household_id,
  chef_id,
  event_date,
  event_time,
  service_name,
  guests,
  special_requirements,
  status,
  total_cost,
  paid_amount,
  payment_status,
  notes,
  created_at,
  updated_at
FROM ypec_engagements
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Migrate ypec_communications to communications table
INSERT INTO communications (
  id,
  tenant_id,
  direction,
  from_contact,
  to_contact,
  subject,
  message,
  channel,
  status,
  metadata,
  created_at
)
SELECT
  id,
  ypec_tenant_id,
  direction,
  from_contact,
  to_contact,
  subject,
  message,
  channel,
  status,
  metadata,
  created_at
FROM ypec_communications
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id;

-- ============================================================================
-- STEP 4: UPDATE ypec_chef_referrals AND ypec_referral_bonuses WITH tenant_id
-- ============================================================================

-- Add tenant_id to chef referrals if column doesn't exist
DO $$ BEGIN
  ALTER TABLE ypec_chef_referrals ADD COLUMN IF NOT EXISTS tenant_id UUID;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

UPDATE ypec_chef_referrals SET tenant_id = ypec_tenant_id WHERE tenant_id IS NULL;

-- Add tenant_id to referral bonuses if column doesn't exist
DO $$ BEGIN
  ALTER TABLE ypec_referral_bonuses ADD COLUMN IF NOT EXISTS tenant_id UUID;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

UPDATE ypec_referral_bonuses SET tenant_id = ypec_tenant_id WHERE tenant_id IS NULL;

-- Add tenant_id to chef leads if table exists
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ypec_chef_leads') THEN
    ALTER TABLE ypec_chef_leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
    UPDATE ypec_chef_leads SET tenant_id = ypec_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role bypass (for API access)
CREATE POLICY "Service role bypass" ON staff FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role bypass" ON clients FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role bypass" ON leads FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role bypass" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role bypass" ON engagements FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role bypass" ON communications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

RAISE NOTICE 'YPEC multi-tenant migration completed successfully!';
RAISE NOTICE 'Tenant ID: %', ypec_tenant_id;
RAISE NOTICE 'Company: Your Private Estate Chef (Company #7)';

END $$;
