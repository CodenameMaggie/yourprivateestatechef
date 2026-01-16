// ============================================================================
// YPEC CHEF COMPLIANCE & VETTING BOT
// Reports to: Henry (COO)
// Purpose: Background checks, compliance tracking, chef safety vetting
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'YPEC-ChefCompliance',
  reports_to: 'Henry (COO)',
  supports: 'All placement operations - SAFETY FIRST',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Background checks, criminal record screening, compliance tracking',
  actions: ['status', 'chef_compliance', 'request_background_check', 'update_compliance', 'verify_documents', 'analytics', 'expiry_alerts']
};

// Load strategic markets (for jurisdiction requirements)
let STRATEGIC_MARKETS = [];
try {
  const marketsPath = path.join(__dirname, '../../data/strategic-markets.json');
  const marketsData = JSON.parse(fs.readFileSync(marketsPath, 'utf8'));
  STRATEGIC_MARKETS = marketsData.markets;
} catch (error) {
  console.error('[ChefCompliance] Error loading strategic markets:', error);
}

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'chef_compliance':
        return await getChefCompliance(req, res, data);

      case 'request_background_check':
        return await requestBackgroundCheck(req, res, data);

      case 'update_compliance':
        return await updateCompliance(req, res, data);

      case 'verify_documents':
        return await verifyDocuments(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

      case 'expiry_alerts':
        return await getExpiryAlerts(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: BOT_INFO.actions
        });
    }
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Error:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS) // chefs stored as users
    .select('id, compliance_status')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef');

  const stats = {
    total_chefs: chefs?.length || 0,
    compliant: chefs?.filter(c => c.compliance_status === 'verified').length || 0,
    pending_checks: chefs?.filter(c => c.compliance_status === 'pending_background_check').length || 0,
    under_review: chefs?.filter(c => c.compliance_status === 'under_review').length || 0,
    non_compliant: chefs?.filter(c => c.compliance_status === 'non_compliant' || c.compliance_status === 'rejected').length || 0,
    expiring_soon: 0 // TODO: Calculate from background_check_expiry_date
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    policy: {
      background_checks_required: true,
      jurisdictions: STRATEGIC_MARKETS.map(m => ({
        location: `${m.city}, ${m.province_state}`,
        jurisdiction: m.background_check_jurisdiction,
        requirements: m.background_check_requirements
      }))
    },
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET CHEF COMPLIANCE
// ============================================================================

async function getChefCompliance(req, res, data) {
  const { chef_id, location_filter } = data || {};

  let query = getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef');

  if (chef_id) {
    query = query.eq('id', chef_id);
  }

  const { data: chefs, error } = await query;
  if (error) throw error;

  // Enrich with compliance details
  const enriched = chefs?.map(chef => {
    const preferredLocation = chef.preferred_location || chef.current_location;
    const market = STRATEGIC_MARKETS.find(m =>
      m.city.toLowerCase() === preferredLocation?.toLowerCase() ||
      m.id === preferredLocation?.toLowerCase()
    );

    return {
      ...chef,
      compliance: {
        status: chef.compliance_status || 'not_started',
        background_check_status: chef.background_check_status || 'not_requested',
        background_check_date: chef.background_check_date,
        background_check_expiry: chef.background_check_expiry_date,
        background_check_jurisdiction: chef.background_check_jurisdiction,
        vulnerable_sector_check: chef.vulnerable_sector_check || false,
        rcmp_clearance: chef.rcmp_clearance || false,
        documents_verified: chef.documents_verified || false,
        placement_eligible: chef.compliance_status === 'verified'
      },
      location: {
        preferred: preferredLocation,
        market_info: market || null,
        jurisdiction: market?.background_check_jurisdiction,
        requirements: market?.background_check_requirements
      }
    };
  }) || [];

  // Filter by location if requested
  let filtered = enriched;
  if (location_filter) {
    filtered = enriched.filter(c =>
      c.location.preferred?.toLowerCase().includes(location_filter.toLowerCase())
    );
  }

  return res.json({
    success: true,
    total: filtered.length,
    chefs: filtered
  });
}

// ============================================================================
// REQUEST BACKGROUND CHECK
// ============================================================================

async function requestBackgroundCheck(req, res, data) {
  const { chef_id, jurisdiction, check_types } = data;

  if (!chef_id || !jurisdiction) {
    return res.status(400).json({ error: 'chef_id and jurisdiction required' });
  }

  console.log(`[${BOT_INFO.name}] Requesting background check for chef ${chef_id} in ${jurisdiction}`);

  // Get market requirements
  const market = STRATEGIC_MARKETS.find(m =>
    m.background_check_jurisdiction === jurisdiction ||
    m.id === jurisdiction ||
    m.city.toLowerCase() === jurisdiction.toLowerCase()
  );

  if (!market) {
    return res.status(400).json({ error: `Unknown jurisdiction: ${jurisdiction}` });
  }

  // Generate background check request email
  const checkRequest = {
    jurisdiction: market.background_check_jurisdiction,
    location: `${market.city}, ${market.province_state}, ${market.country}`,
    required_checks: market.background_check_requirements,
    processing_time: market.country === 'Canada' ? '2-6 weeks' : '2-8 weeks',
    instructions: generateBackgroundCheckInstructions(market)
  };

  // Update chef record
  const { data: updated, error } = await getSupabase()
    .from(TABLES.USERS)
    .update({
      compliance_status: 'pending_background_check',
      background_check_status: 'requested',
      background_check_jurisdiction: market.background_check_jurisdiction,
      background_check_requested_date: new Date().toISOString(),
      background_check_instructions: checkRequest.instructions
    })
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Background check requested for chef ${chef_id}`);

  return res.json({
    success: true,
    chef_id,
    check_request: checkRequest,
    message: 'Background check request created. Chef will receive instructions via email.',
    next_steps: [
      '1. Chef completes background check application',
      '2. Submits fingerprints/documents as required',
      '3. Uploads certificate to YPEC portal',
      '4. YPEC verifies and approves'
    ]
  });
}

// ============================================================================
// UPDATE COMPLIANCE
// ============================================================================

async function updateCompliance(req, res, data) {
  const { chef_id, compliance_update } = data;

  if (!chef_id || !compliance_update) {
    return res.status(400).json({ error: 'chef_id and compliance_update required' });
  }

  const updates = {
    updated_at: new Date().toISOString()
  };

  // Handle different compliance updates
  if (compliance_update.background_check_completed) {
    updates.background_check_status = 'submitted';
    updates.background_check_date = compliance_update.completion_date || new Date().toISOString();
    updates.background_check_document_url = compliance_update.document_url;
    updates.compliance_status = 'under_review';

    // Calculate expiry (typically 5 years)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
    updates.background_check_expiry_date = expiryDate.toISOString();
  }

  if (compliance_update.vulnerable_sector_check) {
    updates.vulnerable_sector_check = true;
    updates.vulnerable_sector_check_date = compliance_update.completion_date || new Date().toISOString();
  }

  if (compliance_update.rcmp_clearance) {
    updates.rcmp_clearance = true;
    updates.rcmp_clearance_date = compliance_update.completion_date || new Date().toISOString();
  }

  if (compliance_update.verification_status) {
    updates.compliance_status = compliance_update.verification_status; // verified, rejected, non_compliant
    updates.documents_verified = compliance_update.verification_status === 'verified';
    updates.verified_by = compliance_update.verified_by;
    updates.verified_at = new Date().toISOString();
    updates.verification_notes = compliance_update.notes;
  }

  const { data: updated, error } = await getSupabase()
    .from(TABLES.USERS)
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Compliance updated for chef ${chef_id}: ${JSON.stringify(updates)}`);

  return res.json({
    success: true,
    chef_id,
    updated,
    placement_eligible: updated.compliance_status === 'verified'
  });
}

// ============================================================================
// VERIFY DOCUMENTS
// ============================================================================

async function verifyDocuments(req, res, data) {
  const { chef_id, verification_result, verified_by, notes } = data;

  if (!chef_id || !verification_result || !verified_by) {
    return res.status(400).json({ error: 'chef_id, verification_result, and verified_by required' });
  }

  const updates = {
    documents_verified: verification_result === 'approved',
    compliance_status: verification_result === 'approved' ? 'verified' : 'rejected',
    verified_by,
    verified_at: new Date().toISOString(),
    verification_notes: notes || null
  };

  const { data: updated, error } = await getSupabase()
    .from(TABLES.USERS)
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Documents verified for chef ${chef_id}: ${verification_result}`);

  return res.json({
    success: true,
    chef_id,
    verification_result,
    placement_eligible: verification_result === 'approved',
    updated
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef');

  const byStatus = {};
  const byJurisdiction = {};
  const expiringIn90Days = [];

  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  chefs?.forEach(chef => {
    const status = chef.compliance_status || 'not_started';
    byStatus[status] = (byStatus[status] || 0) + 1;

    const jurisdiction = chef.background_check_jurisdiction;
    if (jurisdiction) {
      byJurisdiction[jurisdiction] = (byJurisdiction[jurisdiction] || 0) + 1;
    }

    if (chef.background_check_expiry_date) {
      const expiry = new Date(chef.background_check_expiry_date);
      if (expiry >= now && expiry <= ninetyDaysFromNow) {
        expiringIn90Days.push({
          chef_id: chef.id,
          name: chef.full_name || chef.email,
          expiry_date: chef.background_check_expiry_date,
          days_remaining: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
        });
      }
    }
  });

  const complianceRate = chefs && chefs.length > 0
    ? ((byStatus.verified || 0) / chefs.length * 100).toFixed(1)
    : '0';

  return res.json({
    success: true,
    analytics: {
      total_chefs: chefs?.length || 0,
      by_status: byStatus,
      by_jurisdiction: byJurisdiction,
      compliance_rate: complianceRate + '%',
      expiring_in_90_days: expiringIn90Days.length,
      expiring_details: expiringIn90Days
    }
  });
}

// ============================================================================
// EXPIRY ALERTS
// ============================================================================

async function getExpiryAlerts(req, res) {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef')
    .not('background_check_expiry_date', 'is', null);

  const now = new Date();
  const alerts = {
    expired: [],
    expiring_30_days: [],
    expiring_90_days: []
  };

  chefs?.forEach(chef => {
    const expiry = new Date(chef.background_check_expiry_date);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    const alert = {
      chef_id: chef.id,
      name: chef.full_name || chef.email,
      email: chef.email,
      expiry_date: chef.background_check_expiry_date,
      days_remaining: daysUntilExpiry,
      jurisdiction: chef.background_check_jurisdiction,
      placement_eligible: daysUntilExpiry > 0
    };

    if (daysUntilExpiry < 0) {
      alerts.expired.push(alert);
    } else if (daysUntilExpiry <= 30) {
      alerts.expiring_30_days.push(alert);
    } else if (daysUntilExpiry <= 90) {
      alerts.expiring_90_days.push(alert);
    }
  });

  return res.json({
    success: true,
    alerts,
    action_required: alerts.expired.length + alerts.expiring_30_days.length,
    message: alerts.expired.length > 0
      ? 'URGENT: Some chefs have expired background checks and are not eligible for placement'
      : 'All chefs have valid background checks'
  });
}

// ============================================================================
// HELPER: GENERATE BACKGROUND CHECK INSTRUCTIONS
// ============================================================================

function generateBackgroundCheckInstructions(market) {
  if (market.country === 'Canada') {
    return {
      provider: market.province_state === 'British Columbia'
        ? 'BC Ministry of Justice - Criminal Records Review Program'
        : `${market.province_state} Ministry of Justice`,
      steps: [
        '1. Visit your provincial Ministry of Justice website',
        '2. Apply for Criminal Record Check (CRC)',
        '3. If working with children/elderly, request Vulnerable Sector Check',
        '4. Submit fingerprints at authorized location',
        '5. Pay processing fee (typically $25-$50 CAD)',
        '6. Wait 2-6 weeks for results',
        '7. Upload certificate to YPEC portal'
      ],
      links: {
        bc: 'https://www2.gov.bc.ca/gov/content/safety/crime-prevention/criminal-record-check',
        on: 'https://www.ontario.ca/page/criminal-background-check',
        general: 'https://www.rcmp-grc.gc.ca/en/criminal-record-checks'
      },
      cost: '$25-$50 CAD',
      processing_time: '2-6 weeks'
    };
  } else {
    return {
      provider: 'FBI and State Department of Justice',
      steps: [
        '1. Visit FBI Identity History Summary Request',
        '2. Complete application and submit fingerprints',
        '3. Apply for state-specific criminal history check',
        '4. Complete Live Scan fingerprinting at authorized location',
        '5. Pay processing fees (FBI $18 + State fees)',
        '6. Wait 2-8 weeks for results',
        '7. Upload certificates to YPEC portal'
      ],
      links: {
        fbi: 'https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks',
        state: `${market.province_state} Department of Justice - Criminal History`
      },
      cost: '$18 (FBI) + $30-$75 (State)',
      processing_time: '2-8 weeks'
    };
  }
}

// Export for testing
module.exports.generateBackgroundCheckInstructions = generateBackgroundCheckInstructions;
module.exports.BOT_INFO = BOT_INFO;
module.exports.STRATEGIC_MARKETS = STRATEGIC_MARKETS;
