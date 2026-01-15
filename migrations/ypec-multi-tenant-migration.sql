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

-- Migrate ypec_staff to staff table (only migrate core columns that exist)
INSERT INTO staff (
  tenant_id,
  email,
  password_hash,
  full_name,
  role,
  login_enabled,
  created_at,
  updated_at
)
SELECT
  ypec_tenant_id,
  email,
  password_hash,
  full_name,
  role,
  true, -- login_enabled default
  NOW(), -- created_at default
  NOW() -- updated_at default
FROM ypec_staff
ON CONFLICT (tenant_id, email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Migrate ypec_households to clients table (only migrate columns that exist)
-- Note: ypec_households may have different column structure, so we use defaults
INSERT INTO clients (
  tenant_id,
  client_type,
  primary_contact_name,
  status,
  created_at,
  updated_at
)
SELECT
  ypec_tenant_id,
  'household',
  COALESCE(primary_contact_name, 'Unknown'),
  COALESCE(status, 'inquiry'),
  NOW(),
  NOW()
FROM ypec_households
ON CONFLICT DO NOTHING;

-- Migrate ypec_inquiries to leads table (minimal columns)
INSERT INTO leads (
  tenant_id,
  lead_type,
  name,
  email,
  status,
  created_at,
  updated_at
)
SELECT
  ypec_tenant_id,
  'inquiry',
  COALESCE(name, 'Unknown'),
  email,
  COALESCE(status, 'new'),
  NOW(),
  NOW()
FROM ypec_inquiries
ON CONFLICT DO NOTHING;

-- Migrate ypec_chefs to users table (absolute minimal - email only)
INSERT INTO users (
  tenant_id,
  user_type,
  email,
  first_name,
  last_name,
  status,
  login_enabled,
  created_at,
  updated_at
)
SELECT
  ypec_tenant_id,
  'chef',
  email,
  'Chef',
  'Applicant',
  'pending',
  false,
  NOW(),
  NOW()
FROM ypec_chefs
ON CONFLICT (tenant_id, email) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Migrate ypec_engagements to engagements table (skip if ypec_engagements doesn't exist)
-- Note: This table may not exist yet in your database
-- INSERT INTO engagements will be done by the application as bookings are created

-- Migrate ypec_communications to communications table (skip if doesn't exist)
-- Note: This table may not exist yet in your database
-- Communications will be logged by the application going forward

-- ============================================================================
-- STEP 4: CREATE YPEC-SPECIFIC TABLES WITH tenant_id
-- ============================================================================

-- Create ypec_chef_referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS ypec_chef_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  chef_id UUID NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referral_url TEXT NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chef_referrals_tenant ON ypec_chef_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chef_referrals_chef ON ypec_chef_referrals(tenant_id, chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_referrals_code ON ypec_chef_referrals(referral_code);

-- Create ypec_referral_bonuses table if it doesn't exist
CREATE TABLE IF NOT EXISTS ypec_referral_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  referrer_chef_id UUID NOT NULL,
  referred_chef_id UUID NOT NULL,
  milestone VARCHAR(50) NOT NULL,
  bonus_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'earned',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_bonuses_tenant ON ypec_referral_bonuses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referrer ON ypec_referral_bonuses(tenant_id, referrer_chef_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referred ON ypec_referral_bonuses(tenant_id, referred_chef_id);

-- Create ypec_chef_leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS ypec_chef_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  region VARCHAR(100),
  source VARCHAR(255),
  experience_years INTEGER,
  status VARCHAR(50) DEFAULT 'new',
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chef_leads_tenant ON ypec_chef_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chef_leads_status ON ypec_chef_leads(tenant_id, status);

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
