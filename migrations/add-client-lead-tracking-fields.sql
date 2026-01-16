-- ============================================================================
-- Add Client Lead Tracking Fields to Leads Table
-- Supports Dan's client lead generation and qualification system
-- ============================================================================

-- Add new fields for lead scoring and qualification
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'; -- high, medium, low
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100); -- website, forbes_list, luxury_real_estate, etc.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location VARCHAR(255); -- Consolidated location field

-- Inquiry tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_inquiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_inquiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 1;

-- Qualification tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_notes TEXT;

-- Wealth indicators for lead scoring
ALTER TABLE leads ADD COLUMN IF NOT EXISTS home_value DECIMAL(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline VARCHAR(100); -- immediate, 1-3_months, 3-6_months, etc.

-- Consultation scheduling
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consultation_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(tenant_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_consultation_date ON leads(consultation_date);

-- Update existing leads to populate source from lead_type if null
UPDATE leads
SET source = lead_type
WHERE source IS NULL AND lead_type IS NOT NULL;

-- Update existing leads to populate location from city/state if null
UPDATE leads
SET location = CONCAT(city, ', ', state)
WHERE location IS NULL AND city IS NOT NULL AND state IS NOT NULL;

UPDATE leads
SET location = city
WHERE location IS NULL AND city IS NOT NULL AND state IS NULL;

-- Set first_inquiry_date to created_at for existing leads
UPDATE leads
SET first_inquiry_date = created_at,
    last_inquiry_date = created_at
WHERE first_inquiry_date IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added client lead tracking fields to leads table';
  RAISE NOTICE 'New fields: lead_score, priority, source, location, inquiry tracking, qualification tracking';
  RAISE NOTICE 'Dan ClientLeads bot is now ready to use!';
END $$;
