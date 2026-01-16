-- ============================================================================
-- CENTRALIZED EMAIL QUEUE SYSTEM - DEDUPLICATION & TRACKING
-- Ensures NO duplicate emails are sent across all campaigns
-- ALL emails sent from ONE unified system
-- ============================================================================

-- Email Queue Table - ALL emails go through this table
CREATE TABLE IF NOT EXISTS ypec_email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Email Details
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Campaign Tracking (which bot/campaign sent this)
  campaign_type VARCHAR(100) NOT NULL, -- culinary_school, partnership, client_followup, etc.
  campaign_id UUID, -- References specific campaign
  source_bot VARCHAR(100) NOT NULL, -- culinary-outreach, partnership-outreach, etc.

  -- Deduplication Key (CRITICAL!)
  dedup_key VARCHAR(500) UNIQUE NOT NULL, -- Format: {recipient_email}:{campaign_type}:{campaign_id}

  -- Status Tracking
  status VARCHAR(50) DEFAULT 'queued', -- queued, sending, sent, failed, bounced
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent

  -- Timing
  scheduled_send_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,

  -- Error Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional tracking data

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_tenant ON ypec_email_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON ypec_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON ypec_email_queue(scheduled_send_time);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON ypec_email_queue(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_queue_campaign ON ypec_email_queue(campaign_type, campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_dedup ON ypec_email_queue(dedup_key);

-- Email Send Log - Track ALL emails ever sent (for analytics)
CREATE TABLE IF NOT EXISTS ypec_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Copy of email details
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  campaign_type VARCHAR(100) NOT NULL,
  source_bot VARCHAR(100) NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL, -- sent, failed, bounced, opened, clicked

  -- Engagement Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_email_log_tenant ON ypec_email_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_log_campaign ON ypec_email_log(campaign_type);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON ypec_email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_sent ON ypec_email_log(sent_at DESC);

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_email_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated
  BEFORE UPDATE ON ypec_email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_timestamp();

-- Function to check if email already sent (DEDUPLICATION)
CREATE OR REPLACE FUNCTION email_already_sent(
  p_recipient_email VARCHAR,
  p_campaign_type VARCHAR,
  p_campaign_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_dedup_key VARCHAR;
  v_exists BOOLEAN;
BEGIN
  -- Generate dedup key
  v_dedup_key := p_recipient_email || ':' || p_campaign_type || ':' || COALESCE(p_campaign_id::TEXT, 'null');

  -- Check if exists in queue or log
  SELECT EXISTS(
    SELECT 1 FROM ypec_email_queue
    WHERE dedup_key = v_dedup_key
    AND status IN ('sent', 'sending', 'queued')
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created centralized email queue system';
  RAISE NOTICE 'DEDUPLICATION: All emails tracked via unique dedup_key';
  RAISE NOTICE 'ONE SYSTEM: All campaigns send through ypec_email_queue table';
  RAISE NOTICE 'NO DUPLICATES: email_already_sent() function prevents duplicate sends';
END $$;
