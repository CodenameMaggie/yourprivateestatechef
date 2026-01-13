// ============================================================================
// MFS CENTRAL DATABASE CONNECTION
// Purpose: Connect to Maggie Forbes Strategies central Supabase database
// All Forbes companies (SH, TH, IC, FF, YPEC) share this central leads database
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

let mfsSupabase = null;

/**
 * Get MFS Central Database connection
 * Used for centralized lead management across all Forbes portfolio companies
 */
function getMFSSupabase() {
  if (!mfsSupabase) {
    const url = process.env.MFS_SUPABASE_URL;
    const key = process.env.MFS_SUPABASE_SERVICE_KEY || process.env.MFS_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('[MFS Database] MFS_SUPABASE_URL or MFS_SUPABASE_SERVICE_KEY not set');
      console.warn('[MFS Database] Lead sync disabled until MFS credentials are added');
      return null;
    }

    mfsSupabase = createClient(url, key);
    console.log('[MFS Database] Connected to MFS Central Database');
  }

  return mfsSupabase;
}

/**
 * Store lead in MFS central database with YPEC source tag
 */
async function storeMFSLead(leadData) {
  const client = getMFSSupabase();

  if (!client) {
    console.warn('[MFS Database] Cannot store lead - MFS database not configured');
    return { error: 'MFS database not configured' };
  }

  try {
    const { data, error } = await client.from('leads').insert({
      source: 'YPEC_osm',
      email: leadData.email,
      name: leadData.name || leadData.full_name,
      phone: leadData.phone,
      location: leadData.location || leadData.address,
      income_level: leadData.income_level || 'high_net_worth',
      interest_level: leadData.interest_level || 'inquiry',
      notes: leadData.notes,
      status: leadData.status || 'new',
      created_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.error('[MFS Database] Error storing lead:', error);
      return { error: error.message };
    }

    console.log('[MFS Database] Lead stored successfully:', data.id);
    return { data };
  } catch (error) {
    console.error('[MFS Database] Exception storing lead:', error);
    return { error: error.message };
  }
}

/**
 * Get all YPEC leads from MFS central database
 */
async function getYPECLeads(filters = {}) {
  const client = getMFSSupabase();

  if (!client) {
    return { data: [], error: 'MFS database not configured' };
  }

  try {
    let query = client
      .from('leads')
      .select('*')
      .eq('source', 'YPEC_osm')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[MFS Database] Error fetching YPEC leads:', error);
      return { data: [], error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[MFS Database] Exception fetching leads:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Get cross-portfolio leads (from other Forbes companies)
 * Useful for identifying cross-selling opportunities
 */
async function getCrossPortfolioLeads(filters = {}) {
  const client = getMFSSupabase();

  if (!client) {
    return { data: [], error: 'MFS database not configured' };
  }

  try {
    // Get leads from Steading Home and Timber Homestead (luxury homeowners)
    let query = client
      .from('leads')
      .select('*')
      .in('source', ['SH_osm', 'TH_osm'])
      .eq('income_level', 'high_net_worth')
      .order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[MFS Database] Error fetching cross-portfolio leads:', error);
      return { data: [], error: error.message };
    }

    console.log(`[MFS Database] Found ${data?.length || 0} potential cross-sell opportunities`);
    return { data, error: null };
  } catch (error) {
    console.error('[MFS Database] Exception fetching cross-portfolio leads:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Update lead status in MFS database
 */
async function updateMFSLeadStatus(leadId, status, notes = null) {
  const client = getMFSSupabase();

  if (!client) {
    return { error: 'MFS database not configured' };
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await client
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('[MFS Database] Error updating lead:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('[MFS Database] Exception updating lead:', error);
    return { error: error.message };
  }
}

/**
 * Test MFS database connection
 */
async function testMFSConnection() {
  const client = getMFSSupabase();

  if (!client) {
    return {
      connected: false,
      message: 'MFS credentials not configured'
    };
  }

  try {
    const { data, error } = await client
      .from('leads')
      .select('id')
      .eq('source', 'YPEC_osm')
      .limit(1);

    if (error) {
      return {
        connected: false,
        message: error.message
      };
    }

    return {
      connected: true,
      message: 'MFS Central Database connected successfully',
      ypec_leads_count: data?.length || 0
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message
    };
  }
}

module.exports = {
  getMFSSupabase,
  storeMFSLead,
  getYPECLeads,
  getCrossPortfolioLeads,
  updateMFSLeadStatus,
  testMFSConnection
};
