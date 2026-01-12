-- ====================================
-- YPEC Database Schema
-- Your Private Estate Chef
-- Company #7 - MFS Ecosystem
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- HOUSEHOLDS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ypec_households (
    household_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- For multi-tenancy if needed

    -- Primary Contact
    primary_contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Address (can have multiple properties via separate table if needed)
    primary_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Additional Properties (JSON for flexibility)
    additional_properties JSONB DEFAULT '[]',

    -- Inquiry & Status
    inquiry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consultation_date TIMESTAMP WITH TIME ZONE,
    consultation_completed BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'inquiry' CHECK (status IN (
        'inquiry',
        'consultation_scheduled',
        'consultation_complete',
        'active',
        'paused',
        'declined',
        'inactive'
    )),

    -- Service Details
    service_type VARCHAR(100), -- weekly, events, residency, seasonal, etc.
    dietary_requirements TEXT,
    allergies TEXT,
    cuisine_preferences TEXT,
    family_size INTEGER,
    typical_guest_count INTEGER,

    -- Assignment
    chef_assigned UUID, -- FK to ypec_chefs
    season_started VARCHAR(20), -- e.g., "Winter 2026"

    -- Referral
    referral_source VARCHAR(255),
    referral_notes TEXT,

    -- Internal Notes
    notes TEXT,
    admin_notes TEXT, -- Private admin-only notes

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for Households
CREATE INDEX idx_households_email ON ypec_households(email);
CREATE INDEX idx_households_status ON ypec_households(status);
CREATE INDEX idx_households_chef_assigned ON ypec_households(chef_assigned);
CREATE INDEX idx_households_inquiry_date ON ypec_households(inquiry_date);

-- ====================================
-- CHEFS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ypec_chefs (
    chef_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,

    -- Personal Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),

    -- Location
    primary_location VARCHAR(255), -- City/Region
    state VARCHAR(50),
    willing_to_travel BOOLEAN DEFAULT FALSE,
    travel_radius_miles INTEGER,

    -- Professional Details
    specialties TEXT[], -- Array of specialties
    cuisine_expertise TEXT[], -- French, Italian, Asian, etc.
    years_experience INTEGER,
    certifications TEXT[],

    -- Availability
    availability VARCHAR(50) DEFAULT 'available' CHECK (availability IN (
        'available',
        'limited',
        'full',
        'inactive'
    )),
    max_households INTEGER DEFAULT 3, -- Max concurrent households
    current_household_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'onboarding' CHECK (status IN (
        'applicant',
        'interview',
        'onboarding',
        'active',
        'inactive',
        'alumni'
    )),

    -- Dates
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,

    -- Portfolio & Background
    bio TEXT,
    portfolio_url VARCHAR(500),
    background_check_completed BOOLEAN DEFAULT FALSE,
    background_check_date TIMESTAMP WITH TIME ZONE,
    references TEXT[], -- Array of reference contacts

    -- Compensation (if tracked)
    base_rate_weekly DECIMAL(10, 2),
    base_rate_event DECIMAL(10, 2),

    -- Notes
    notes TEXT,
    admin_notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for Chefs
CREATE INDEX idx_chefs_email ON ypec_chefs(email);
CREATE INDEX idx_chefs_status ON ypec_chefs(status);
CREATE INDEX idx_chefs_availability ON ypec_chefs(availability);
CREATE INDEX idx_chefs_location ON ypec_chefs(primary_location);

-- ====================================
-- ENGAGEMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ypec_engagements (
    engagement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,

    -- Relationships
    household_id UUID NOT NULL REFERENCES ypec_households(household_id) ON DELETE CASCADE,
    chef_id UUID NOT NULL REFERENCES ypec_chefs(chef_id) ON DELETE CASCADE,

    -- Engagement Details
    service_type VARCHAR(100) NOT NULL, -- weekly, one-time, seasonal, residency
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing

    -- Frequency
    frequency VARCHAR(50), -- weekly, bi-weekly, monthly, one-time
    weekly_day VARCHAR(20), -- Monday, Tuesday, etc.
    weekly_time TIME,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'proposed',
        'accepted',
        'active',
        'paused',
        'completed',
        'cancelled'
    )),

    -- Terms
    rate DECIMAL(10, 2),
    rate_period VARCHAR(20), -- per week, per event, per month
    contract_url VARCHAR(500), -- Link to signed contract

    -- Performance
    meals_delivered INTEGER DEFAULT 0,
    events_completed INTEGER DEFAULT 0,
    household_satisfaction_rating DECIMAL(3, 2), -- 1.00 to 5.00

    -- Notes
    notes TEXT,
    special_instructions TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for Engagements
CREATE INDEX idx_engagements_household ON ypec_engagements(household_id);
CREATE INDEX idx_engagements_chef ON ypec_engagements(chef_id);
CREATE INDEX idx_engagements_status ON ypec_engagements(status);
CREATE INDEX idx_engagements_start_date ON ypec_engagements(start_date);

-- ====================================
-- EVENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ypec_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,

    -- Relationships
    household_id UUID NOT NULL REFERENCES ypec_households(household_id) ON DELETE CASCADE,
    chef_id UUID REFERENCES ypec_chefs(chef_id) ON DELETE SET NULL,
    engagement_id UUID REFERENCES ypec_engagements(engagement_id) ON DELETE SET NULL,

    -- Event Details
    event_name VARCHAR(255),
    event_type VARCHAR(100), -- dinner party, celebration, holiday, weekly meal prep, etc.
    event_date DATE NOT NULL,
    event_time TIME,
    duration_hours DECIMAL(4, 2),

    -- Guest Info
    guest_count INTEGER,
    dietary_restrictions TEXT,

    -- Menu
    menu_notes TEXT,
    courses INTEGER,
    menu_approved BOOLEAN DEFAULT FALSE,
    menu_document_url VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled'
    )),

    -- Feedback
    feedback TEXT,
    household_rating DECIMAL(3, 2), -- 1.00 to 5.00
    chef_notes TEXT, -- Chef's notes about the event

    -- Financials
    event_cost DECIMAL(10, 2),
    grocery_budget DECIMAL(10, 2),
    actual_grocery_cost DECIMAL(10, 2),

    -- Photos/Documentation
    photos JSONB DEFAULT '[]', -- Array of photo URLs

    -- Notes
    notes TEXT,
    special_requests TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for Events
CREATE INDEX idx_events_household ON ypec_events(household_id);
CREATE INDEX idx_events_chef ON ypec_events(chef_id);
CREATE INDEX idx_events_engagement ON ypec_events(engagement_id);
CREATE INDEX idx_events_date ON ypec_events(event_date);
CREATE INDEX idx_events_status ON ypec_events(status);

-- ====================================
-- COMMUNICATIONS LOG TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ypec_communications (
    communication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,

    -- Relationships
    household_id UUID REFERENCES ypec_households(household_id) ON DELETE CASCADE,
    chef_id UUID REFERENCES ypec_chefs(chef_id) ON DELETE CASCADE,

    -- Communication Details
    communication_type VARCHAR(50) NOT NULL, -- email, call, text, in-person, bot
    direction VARCHAR(20), -- inbound, outbound
    subject VARCHAR(500),
    message TEXT,

    -- Metadata
    sent_by VARCHAR(255), -- Staff member or bot name
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Email specific
    email_status VARCHAR(50), -- sent, delivered, opened, bounced

    notes TEXT
);

-- Indexes for Communications
CREATE INDEX idx_communications_household ON ypec_communications(household_id);
CREATE INDEX idx_communications_chef ON ypec_communications(chef_id);
CREATE INDEX idx_communications_sent_at ON ypec_communications(sent_at);

-- ====================================
-- UPDATE TRIGGERS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_households_updated_at
    BEFORE UPDATE ON ypec_households
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chefs_updated_at
    BEFORE UPDATE ON ypec_chefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagements_updated_at
    BEFORE UPDATE ON ypec_engagements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON ypec_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ROW LEVEL SECURITY (Optional - enable if using Supabase RLS)
-- ====================================

-- Enable RLS on tables (uncomment if using)
-- ALTER TABLE ypec_households ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ypec_chefs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ypec_engagements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ypec_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ypec_communications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize as needed)
-- CREATE POLICY "Allow all access to authenticated users" ON ypec_households
--     FOR ALL USING (auth.role() = 'authenticated');

-- ====================================
-- SAMPLE DATA (Optional - for testing)
-- ====================================

-- Uncomment to insert sample data:

-- INSERT INTO ypec_households (primary_contact_name, email, phone, status) VALUES
-- ('Sample Household', 'sample@example.com', '555-0100', 'inquiry');

-- INSERT INTO ypec_chefs (name, email, specialties, status) VALUES
-- ('Chef Sample', 'chef@example.com', ARRAY['French', 'Italian'], 'active');
