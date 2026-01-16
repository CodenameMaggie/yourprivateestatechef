-- ============================================================================
-- Create Culinary School Outreach Tracking Table
-- Tracks recruitment campaigns to culinary schools
-- ============================================================================

CREATE TABLE IF NOT EXISTS ypec_culinary_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- School Information
  school_id VARCHAR(100) NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,

  -- Campaign Details
  campaign_type VARCHAR(50) DEFAULT 'initial', -- initial, followup, partnership_invitation
  template_used VARCHAR(100),
  email_subject TEXT,
  email_body TEXT,

  -- Status Tracking
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, responded, partnership, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_send_date DATE,
  sent_date TIMESTAMP WITH TIME ZONE,
  response_received_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_followup_date DATE,

  -- Partnership Details
  partnership_started_date TIMESTAMP WITH TIME ZONE,
  partnership_details JSONB,
  declined_date TIMESTAMP WITH TIME ZONE,

  -- Notes and Metadata
  notes TEXT,
  metadata JSONB,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_culinary_outreach_tenant ON ypec_culinary_outreach(tenant_id);
CREATE INDEX IF NOT EXISTS idx_culinary_outreach_school ON ypec_culinary_outreach(school_id);
CREATE INDEX IF NOT EXISTS idx_culinary_outreach_status ON ypec_culinary_outreach(status);
CREATE INDEX IF NOT EXISTS idx_culinary_outreach_scheduled ON ypec_culinary_outreach(scheduled_send_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_culinary_outreach_followup ON ypec_culinary_outreach(next_followup_date) WHERE status = 'responded';

-- Ensure unique school per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_culinary_outreach_unique ON ypec_culinary_outreach(tenant_id, school_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_culinary_outreach_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER culinary_outreach_updated
  BEFORE UPDATE ON ypec_culinary_outreach
  FOR EACH ROW
  EXECUTE FUNCTION update_culinary_outreach_timestamp();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created ypec_culinary_outreach table with indexes and triggers';
END $$;
