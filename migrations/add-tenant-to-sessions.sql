-- ============================================================================
-- Add tenant_id to YPEC Session Tables
-- Run this after the main multi-tenant migration
-- ============================================================================

-- Add tenant_id to admin sessions
ALTER TABLE ypec_admin_sessions
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007';

-- Add tenant_id to household sessions
ALTER TABLE ypec_household_sessions
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007';

-- Add tenant_id to chef sessions
ALTER TABLE ypec_chef_sessions
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000007';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_tenant ON ypec_admin_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_household_sessions_tenant ON ypec_household_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chef_sessions_tenant ON ypec_chef_sessions(tenant_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added tenant_id to all session tables';
END $$;
