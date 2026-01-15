-- ============================================================================
-- YPEC BASE DATABASE SCHEMA
-- Your Private Estate Chef - Core Tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HOUSEHOLDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Information
    household_name VARCHAR(255),
    primary_contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),

    -- Address
    primary_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),

    -- Status & Dates
    status VARCHAR(50) DEFAULT 'inquiry',
    inquiry_date TIMESTAMPTZ DEFAULT NOW(),
    consultation_date TIMESTAMPTZ,
    activation_date TIMESTAMPTZ,

    -- Assigned Chef
    chef_id UUID,

    -- Login Fields (for client portal)
    password_hash VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    login_enabled BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHEFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_chefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),

    -- Professional Details
    specialties TEXT[],
    certifications TEXT[],
    years_experience INTEGER,
    region VARCHAR(100),

    -- Capacity
    max_households INTEGER DEFAULT 10,
    current_households INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    availability VARCHAR(50) DEFAULT 'available',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENGAGEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,
    chef_id UUID REFERENCES ypec_chefs(id) ON DELETE SET NULL,

    -- Service Details
    service_name VARCHAR(255),
    service_type VARCHAR(100),
    service_date DATE,
    service_time TIME,

    -- Frequency
    frequency VARCHAR(50), -- 'weekly', 'bi-weekly', 'monthly', 'one-time'
    recurring BOOLEAN DEFAULT FALSE,

    -- Status & Pricing
    status VARCHAR(50) DEFAULT 'pending',
    amount DECIMAL(10, 2),

    -- Notes
    notes TEXT,
    special_requests TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EVENTS TABLE (Individual Service Occurrences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    engagement_id UUID REFERENCES ypec_engagements(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,
    chef_id UUID REFERENCES ypec_chefs(id) ON DELETE SET NULL,

    -- Event Details
    event_date DATE NOT NULL,
    event_time TIME,
    duration_hours DECIMAL(4, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',

    -- Completion
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INQUIRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contact Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Location
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),

    -- Service Interest
    service_interest TEXT,
    meal_frequency VARCHAR(50),
    household_size INTEGER,

    -- Details
    dietary_restrictions TEXT,
    message TEXT,

    -- Marketing
    referral_source VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'new',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    household_id UUID NOT NULL REFERENCES ypec_households(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES ypec_engagements(id) ON DELETE SET NULL,

    -- Invoice Details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,

    -- Amounts
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Payment
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),

    -- Details
    description TEXT,
    line_items JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ypec_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referrer
    referrer_household_id UUID REFERENCES ypec_households(id) ON DELETE SET NULL,
    referrer_name VARCHAR(255),
    referrer_email VARCHAR(255),

    -- Referred
    referred_name VARCHAR(255) NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    referred_phone VARCHAR(50),

    -- Status
    status VARCHAR(50) DEFAULT 'sent',
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMPTZ,

    -- Reward
    reward_type VARCHAR(100),
    reward_amount DECIMAL(10, 2),
    reward_issued BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Households
CREATE INDEX IF NOT EXISTS idx_households_email ON ypec_households(email);
CREATE INDEX IF NOT EXISTS idx_households_status ON ypec_households(status);
CREATE INDEX IF NOT EXISTS idx_households_chef_id ON ypec_households(chef_id);
CREATE INDEX IF NOT EXISTS idx_households_login_enabled ON ypec_households(login_enabled);

-- Chefs
CREATE INDEX IF NOT EXISTS idx_chefs_email ON ypec_chefs(email);
CREATE INDEX IF NOT EXISTS idx_chefs_status ON ypec_chefs(status);
CREATE INDEX IF NOT EXISTS idx_chefs_region ON ypec_chefs(region);

-- Engagements
CREATE INDEX IF NOT EXISTS idx_engagements_household_id ON ypec_engagements(household_id);
CREATE INDEX IF NOT EXISTS idx_engagements_chef_id ON ypec_engagements(chef_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON ypec_engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_service_date ON ypec_engagements(service_date);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_household_id ON ypec_events(household_id);
CREATE INDEX IF NOT EXISTS idx_events_chef_id ON ypec_events(chef_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON ypec_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON ypec_events(status);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_household_id ON ypec_invoices(household_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON ypec_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_paid ON ypec_invoices(paid);

-- Inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON ypec_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON ypec_inquiries(status);

-- ============================================================================
-- FOREIGN KEY
-- ============================================================================
ALTER TABLE ypec_households
ADD CONSTRAINT fk_households_chef
FOREIGN KEY (chef_id) REFERENCES ypec_chefs(id) ON DELETE SET NULL;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DROP TRIGGER IF EXISTS update_households_updated_at ON ypec_households;
CREATE TRIGGER update_households_updated_at
    BEFORE UPDATE ON ypec_households
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chefs_updated_at ON ypec_chefs;
CREATE TRIGGER update_chefs_updated_at
    BEFORE UPDATE ON ypec_chefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagements_updated_at ON ypec_engagements;
CREATE TRIGGER update_engagements_updated_at
    BEFORE UPDATE ON ypec_engagements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON ypec_events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON ypec_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON ypec_invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON ypec_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON ypec_inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON ypec_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- This creates the core YPEC database structure
-- Run this FIRST before any other schema files
-- Tables created:
--   - ypec_households (customer accounts)
--   - ypec_chefs (chef profiles)
--   - ypec_engagements (ongoing services)
--   - ypec_events (individual service occurrences)
--   - ypec_inquiries (new leads)
--   - ypec_invoices (billing)
--   - ypec_referrals (referral tracking)
