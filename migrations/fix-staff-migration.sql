-- ============================================================================
-- Fix Staff Migration - Preserve Original IDs
-- This ensures foreign keys from session tables still work
-- ============================================================================

-- First, clear any existing migrated data in staff table for YPEC
DELETE FROM staff WHERE tenant_id = '00000000-0000-0000-0000-000000000007';

-- Now migrate with PRESERVED IDs from ypec_staff
INSERT INTO staff (
  id,  -- PRESERVE the original ID!
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
  id,  -- Preserve original ID
  '00000000-0000-0000-0000-000000000007'::uuid as tenant_id,
  email,
  password_hash,
  full_name,
  role,
  true as login_enabled,  -- Default to enabled
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM ypec_staff
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  login_enabled = EXCLUDED.login_enabled,
  updated_at = NOW();

-- Verify the migration
DO $$
DECLARE
  staff_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO staff_count
  FROM staff
  WHERE tenant_id = '00000000-0000-0000-0000-000000000007';

  RAISE NOTICE 'Migrated % staff records with preserved IDs', staff_count;
END $$;
