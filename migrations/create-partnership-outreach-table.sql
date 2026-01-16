-- ============================================================================
-- Create B2B Partnership Outreach Tracking Table
-- Tracks strategic partnerships with luxury brands, real estate, hospitality
-- ============================================================================

CREATE TABLE IF NOT EXISTS ypec_partnership_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Partner Information
  partner_id VARCHAR(100) NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- luxury_real_estate, luxury_hospitality, wealth_management, private_clubs, luxury_concierge, luxury_brands
  tier VARCHAR(50) NOT NULL, -- ultra_luxury, luxury, premium

  -- Contact Information
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_title VARCHAR(255),
  contact_phone VARCHAR(50),
  website VARCHAR(500),

  -- Campaign Details
  campaign_type VARCHAR(50) DEFAULT 'initial', -- initial, followup, executive_intro, proposal, contract_negotiation
  template_used VARCHAR(100),
  email_subject TEXT,
  email_body TEXT,

  -- Partnership Pipeline Stage
  stage VARCHAR(50) DEFAULT 'outreach', -- outreach, discovery, qualification, proposal, negotiation, contract, onboarding, active, closed_lost
  stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status Tracking
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, responded, meeting_scheduled, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_send_date DATE,
  sent_date TIMESTAMP WITH TIME ZONE,
  response_received_date TIMESTAMP WITH TIME ZONE,
  first_meeting_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_followup_date DATE,

  -- Partnership Details
  partnership_type VARCHAR(100), -- referral_commission, white_label, concierge_integration, building_amenity, cardholder_perk, etc.
  partnership_started_date TIMESTAMP WITH TIME ZONE,
  contract_signed_date TIMESTAMP WITH TIME ZONE,
  partnership_active BOOLEAN DEFAULT FALSE,
  partnership_end_date TIMESTAMP WITH TIME ZONE,

  -- Revenue Tracking
  expected_annual_value DECIMAL(12,2),
  actual_annual_value DECIMAL(12,2),
  commission_rate DECIMAL(5,2), -- percentage
  revenue_share DECIMAL(5,2), -- percentage for white-label deals

  -- Market Data (from partnership-targets.json)
  market_size_data JSONB, -- avg_home_price, total_properties, total_members, etc.

  -- Proposal & Contract
  proposal_sent_date TIMESTAMP WITH TIME ZONE,
  proposal_document_url TEXT,
  contract_document_url TEXT,

  -- Communication Log
  total_touchpoints INTEGER DEFAULT 0,
  last_touchpoint_type VARCHAR(100), -- email, call, meeting, demo, proposal

  -- Decline tracking
  declined_date TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,

  -- Notes and Metadata
  notes TEXT,
  internal_notes TEXT, -- private notes not shared
  metadata JSONB,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Key decision makers tracking
  decision_makers JSONB -- array of {name, title, email, role}
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_tenant ON ypec_partnership_outreach(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_partner ON ypec_partnership_outreach(partner_id);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_category ON ypec_partnership_outreach(category);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_tier ON ypec_partnership_outreach(tier);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_stage ON ypec_partnership_outreach(stage);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_status ON ypec_partnership_outreach(status);
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_active ON ypec_partnership_outreach(partnership_active) WHERE partnership_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_scheduled ON ypec_partnership_outreach(scheduled_send_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_partnership_outreach_followup ON ypec_partnership_outreach(next_followup_date) WHERE status = 'responded';

-- Ensure unique partner per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_partnership_outreach_unique ON ypec_partnership_outreach(tenant_id, partner_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_partnership_outreach_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-update stage_updated_at when stage changes
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partnership_outreach_updated
  BEFORE UPDATE ON ypec_partnership_outreach
  FOR EACH ROW
  EXECUTE FUNCTION update_partnership_outreach_timestamp();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created ypec_partnership_outreach table with indexes, triggers, and revenue tracking';
END $$;
