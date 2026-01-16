-- ============================================================================
-- Fix Foreign Key Constraints on Session Tables
-- Point them to the new multi-tenant tables instead of old ypec-specific tables
-- ============================================================================

-- Fix ypec_admin_sessions foreign key
-- Drop old constraint pointing to ypec_staff
ALTER TABLE ypec_admin_sessions
  DROP CONSTRAINT IF EXISTS ypec_admin_sessions_staff_id_fkey;

-- Add new constraint pointing to staff (multi-tenant)
ALTER TABLE ypec_admin_sessions
  ADD CONSTRAINT ypec_admin_sessions_staff_id_fkey
  FOREIGN KEY (staff_id)
  REFERENCES staff(id)
  ON DELETE CASCADE;

-- Fix ypec_household_sessions foreign key
-- Drop old constraint pointing to ypec_households
ALTER TABLE ypec_household_sessions
  DROP CONSTRAINT IF EXISTS ypec_household_sessions_household_id_fkey;

-- Add new constraint pointing to clients (multi-tenant, where client_type='household')
ALTER TABLE ypec_household_sessions
  ADD CONSTRAINT ypec_household_sessions_household_id_fkey
  FOREIGN KEY (household_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;

-- Fix ypec_chef_sessions foreign key
-- Drop old constraint pointing to ypec_chefs
ALTER TABLE ypec_chef_sessions
  DROP CONSTRAINT IF EXISTS ypec_chef_sessions_chef_id_fkey;

-- Add new constraint pointing to users (multi-tenant, where user_type='chef')
ALTER TABLE ypec_chef_sessions
  ADD CONSTRAINT ypec_chef_sessions_chef_id_fkey
  FOREIGN KEY (chef_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated foreign key constraints on all session tables';
END $$;
