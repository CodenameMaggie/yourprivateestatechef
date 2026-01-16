-- ============================================================================
-- Create Markets Tracking Table (Demand-Driven Geographic Expansion)
-- Tracks emerging markets where client inquiries come from
-- ============================================================================

CREATE TABLE IF NOT EXISTS ypec_markets (
  id VARCHAR(100) PRIMARY KEY,  -- e.g., "palm-springs-ca"
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007',

  -- Market Location
  city VARCHAR(255) NOT NULL,
  province_state VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,

  -- Market Status
  status VARCHAR(50) DEFAULT 'emerging', -- emerging, recruiting, growing, established
  market_tier VARCHAR(50), -- tier_1_primary, tier_2_secondary, tier_3_expansion

  -- Demand Tracking
  client_inquiries INTEGER DEFAULT 0,
  first_inquiry_date TIMESTAMP WITH TIME ZONE,
  last_inquiry_date TIMESTAMP WITH TIME ZONE,

  -- Supply Tracking
  chefs_recruited INTEGER DEFAULT 0,
  target_chefs INTEGER DEFAULT 3,  -- Target number of chefs to establish presence
  first_chef_recruited_date TIMESTAMP WITH TIME ZONE,
  chefs_available INTEGER DEFAULT 0,  -- Chefs currently available for placement

  -- Recruitment Campaign
  recruitment_launched_date TIMESTAMP WITH TIME ZONE,
  recruitment_channels JSONB,  -- ["Indeed", "LinkedIn", "Culinary Schools"]

  -- Market Maturity
  established_date TIMESTAMP WITH TIME ZONE,  -- When market reached "established" status

  -- Demographics (optional)
  hnw_households INTEGER,
  avg_home_price VARCHAR(50),
  market_notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_markets_tenant ON ypec_markets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON ypec_markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_city_state ON ypec_markets(city, province_state);
CREATE INDEX IF NOT EXISTS idx_markets_inquiries ON ypec_markets(client_inquiries DESC);
CREATE INDEX IF NOT EXISTS idx_markets_chefs ON ypec_markets(chefs_recruited);

-- Unique market per location per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_markets_unique ON ypec_markets(tenant_id, city, province_state, country);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_markets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-update status based on chef recruitment
  IF NEW.chefs_recruited >= 5 AND OLD.status != 'established' THEN
    NEW.status = 'established';
    IF NEW.established_date IS NULL THEN
      NEW.established_date = NOW();
    END IF;
  ELSIF NEW.chefs_recruited >= 1 AND OLD.status = 'emerging' THEN
    NEW.status = 'growing';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER markets_updated
  BEFORE UPDATE ON ypec_markets
  FOR EACH ROW
  EXECUTE FUNCTION update_markets_timestamp();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created ypec_markets table for demand-driven geographic expansion';
  RAISE NOTICE 'Market statuses: emerging (new), recruiting (campaign active), growing (1-4 chefs), established (5+ chefs)';
END $$;
