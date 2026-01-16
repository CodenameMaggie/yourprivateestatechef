-- ============================================================================
-- Create Chef Recruitment Campaign and Job Posting Tables
-- Tracks multi-channel recruitment (LinkedIn, Indeed, ZipRecruiter, etc.)
-- ============================================================================

-- RECRUITMENT CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS ypec_recruitment_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Campaign Details
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  target_chefs INTEGER DEFAULT 5,

  -- Channels (JSONB array of channel names)
  channels JSONB,  -- ["linkedin", "indeed", "craigslist"]

  -- Budget
  budget VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,

  -- Performance Tracking
  leads_generated INTEGER DEFAULT 0,
  chefs_hired INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JOB POSTINGS TABLE
CREATE TABLE IF NOT EXISTS ypec_job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Campaign Link
  campaign_id UUID REFERENCES ypec_recruitment_campaigns(id) ON DELETE CASCADE,

  -- Channel Details
  channel VARCHAR(100) NOT NULL, -- linkedin, indeed, ziprecruiter, craigslist, etc.

  -- Job Details
  location VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT,
  salary_range VARCHAR(100),

  -- External Tracking
  external_job_id VARCHAR(255), -- Job ID from external platform
  posting_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, expired, filled
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_date TIMESTAMP WITH TIME ZONE,
  closed_date TIMESTAMP WITH TIME ZONE,

  -- Performance Metrics
  views INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON ypec_recruitment_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON ypec_recruitment_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON ypec_recruitment_campaigns(location);

CREATE INDEX IF NOT EXISTS idx_postings_tenant ON ypec_job_postings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_postings_campaign ON ypec_job_postings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_postings_channel ON ypec_job_postings(channel);
CREATE INDEX IF NOT EXISTS idx_postings_status ON ypec_job_postings(status);
CREATE INDEX IF NOT EXISTS idx_postings_location ON ypec_job_postings(location);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_recruitment_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-complete campaign when target reached
  IF NEW.leads_generated >= NEW.target_chefs AND OLD.status = 'active' THEN
    NEW.status = 'completed';
    NEW.completed_date = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recruitment_campaign_updated
  BEFORE UPDATE ON ypec_recruitment_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_campaign_timestamp();

CREATE OR REPLACE FUNCTION update_job_posting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_posting_updated
  BEFORE UPDATE ON ypec_job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_posting_timestamp();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created recruitment campaign and job posting tables';
  RAISE NOTICE 'Supported channels: LinkedIn, Indeed, ZipRecruiter, Culinary Agents, Craigslist, Poached Jobs';
END $$;
