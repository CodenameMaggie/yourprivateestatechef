/**
 * YPEC Database Connection - Multi-Tenant Architecture
 * YPEC operates as Company #7 within Forbes Command ecosystem
 * All data is tenant-scoped using tenant_id for isolation
 */

const { createClient } = require('@supabase/supabase-js');

// YPEC Tenant ID - Company #7 in Forbes Command
const TENANT_ID = '00000000-0000-0000-0000-000000000007';
const COMPANY_NUMBER = 7;
const COMPANY_NAME = 'Your Private Estate Chef';
const COMPANY_SHORT_NAME = 'YPEC';

// Multi-tenant table mappings
const TABLES = {
  // Shared multi-tenant tables
  TENANTS: 'tenants',
  STAFF: 'staff',
  CLIENTS: 'clients',              // households
  LEADS: 'leads',                  // inquiries
  USERS: 'users',                  // chefs as users
  ENGAGEMENTS: 'engagements',      // service bookings
  COMMUNICATIONS: 'communications',

  // YPEC-specific tables (still use ypec_ prefix for specialized data)
  CHEF_REFERRALS: 'ypec_chef_referrals',
  REFERRAL_BONUSES: 'ypec_referral_bonuses',
  CHEF_LEADS: 'ypec_chef_leads',   // prospective chef leads from scraping
};

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_KEY?.trim();

    if (!url || !key) {
      console.warn('[Database] SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
      return null;
    }

    console.log(`[Database] Initializing Supabase client for ${COMPANY_NAME} (Company #${COMPANY_NUMBER})...`);
    console.log('[Database] URL:', url);
    console.log('[Database] Tenant ID:', TENANT_ID);

    try {
      supabase = createClient(url, key);
      console.log('[Database] Supabase client initialized successfully');
    } catch (error) {
      console.error('[Database] Failed to initialize Supabase:', error);
      throw error;
    }
  }

  return supabase;
}

/**
 * Get query builder with automatic tenant filtering
 * @param {string} tableName - Table name from TABLES constant
 * @returns Supabase query builder with tenant_id pre-filtered
 */
function getTenantQuery(tableName) {
  const client = getSupabase();
  if (!client) return null;

  // Apply tenant filter to all queries
  return client.from(tableName).select('*').eq('tenant_id', TENANT_ID);
}

/**
 * Insert data with automatic tenant_id injection
 * @param {string} tableName - Table name from TABLES constant
 * @param {object|array} data - Data to insert
 * @returns Supabase insert query
 */
function tenantInsert(tableName, data) {
  const client = getSupabase();
  if (!client) return null;

  // Add tenant_id to data
  const withTenant = Array.isArray(data)
    ? data.map(item => ({ ...item, tenant_id: TENANT_ID }))
    : { ...data, tenant_id: TENANT_ID };

  return client.from(tableName).insert(withTenant);
}

/**
 * Update data with tenant filtering for safety
 * @param {string} tableName - Table name from TABLES constant
 * @param {object} data - Data to update
 * @returns Supabase update query builder (must add .eq() or .match() conditions)
 */
function tenantUpdate(tableName, data) {
  const client = getSupabase();
  if (!client) return null;

  // Return query builder that enforces tenant_id in WHERE clause
  return client.from(tableName).update(data).eq('tenant_id', TENANT_ID);
}

/**
 * Delete data with tenant filtering for safety
 * @param {string} tableName - Table name from TABLES constant
 * @returns Supabase delete query builder (must add .eq() or .match() conditions)
 */
function tenantDelete(tableName) {
  const client = getSupabase();
  if (!client) return null;

  return client.from(tableName).delete().eq('tenant_id', TENANT_ID);
}

module.exports = {
  getSupabase,
  getTenantQuery,
  tenantInsert,
  tenantUpdate,
  tenantDelete,
  TENANT_ID,
  COMPANY_NUMBER,
  COMPANY_NAME,
  COMPANY_SHORT_NAME,
  TABLES
};
