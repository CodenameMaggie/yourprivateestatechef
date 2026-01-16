// ============================================================================
// DAN'S CLIENT LEAD GENERATION & SCRAPING BOT
// Reports to: Dan (CMO)
// Purpose: HNW client lead generation, website inquiries, lead qualification
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'Dan-ClientLeads',
  reports_to: 'Dan (CMO)',
  supports: 'Annie (CSO) for sales pipeline',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'HNW client lead generation: website inquiries, scraping, qualification',
  actions: ['status', 'capture_inquiry', 'scrape_leads', 'qualify_lead', 'leads', 'analytics', 'run']
};

// Lead sources configuration
const LEAD_SOURCES = {
  website: {
    name: 'YPEC Website',
    type: 'inbound',
    quality: 'high',
    conversion_rate: '15-25%',
    notes: 'Direct inquiries from yourprivateestatechef.com'
  },
  luxury_real_estate_listings: {
    name: 'Luxury Real Estate Listings',
    type: 'scraping',
    quality: 'high',
    conversion_rate: '5-10%',
    notes: 'Scrape listings $2M+ from Zillow, Realtor.com, Sothebys, etc.'
  },
  forbes_highest_earners: {
    name: 'Forbes Lists',
    type: 'scraping',
    quality: 'very_high',
    conversion_rate: '10-20%',
    notes: 'Forbes 400, local business journals, wealth lists'
  },
  private_club_members: {
    name: 'Private Club Directories',
    type: 'scraping',
    quality: 'high',
    conversion_rate: '8-15%',
    notes: 'Soho House, country clubs, yacht clubs (public member info)'
  },
  charity_gala_attendees: {
    name: 'Charity Gala Attendees',
    type: 'scraping',
    quality: 'high',
    conversion_rate: '10-15%',
    notes: 'High-profile charity events, gala attendees (public lists)'
  },
  partnership_referrals: {
    name: 'Partnership Referrals',
    type: 'referral',
    quality: 'very_high',
    conversion_rate: '20-40%',
    notes: 'Referrals from Sothebys, Airbnb Luxe, Amex Centurion, etc.'
  }
};

// Wealth indicators for lead scoring
const WEALTH_INDICATORS = {
  home_value: {
    '$10M+': 100,
    '$5M-$10M': 80,
    '$2M-$5M': 60,
    '$1M-$2M': 40,
    'Under $1M': 20
  },
  location_tier: {
    'tier_1_ultra_luxury': 100,
    'tier_1_primary': 80,
    'tier_2_secondary': 60,
    'tier_3_expansion': 40
  },
  source_quality: {
    'forbes_list': 100,
    'partnership_referral': 90,
    'charity_gala': 80,
    'luxury_real_estate': 70,
    'website_inquiry': 60,
    'private_club': 50
  }
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'capture_inquiry':
        return await captureWebsiteInquiry(req, res, data);

      case 'scrape_leads':
        return await scrapeLeads(req, res, data);

      case 'qualify_lead':
        return await qualifyLead(req, res, data);

      case 'leads':
        return await getLeads(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

      case 'run':
        return await dailyRun(req, res);

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
  // Get all client leads
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('status, lead_score, source')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    total_leads: leads?.length || 0,
    new: leads?.filter(l => l.status === 'new').length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    qualified: leads?.filter(l => l.status === 'qualified').length || 0,
    consultation_scheduled: leads?.filter(l => l.status === 'consultation_scheduled').length || 0,
    converted: leads?.filter(l => l.status === 'converted').length || 0,
    avg_lead_score: leads?.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length)
      : 0
  };

  // Leads by source
  const bySource = {};
  leads?.forEach(lead => {
    const source = lead.source || 'unknown';
    bySource[source] = (bySource[source] || 0) + 1;
  });

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    leads_by_source: bySource,
    lead_sources: LEAD_SOURCES,
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// CAPTURE WEBSITE INQUIRY
// ============================================================================

async function captureWebsiteInquiry(req, res, data) {
  const { name, email, phone, location, message, service_interest, referral_source } = data;

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  console.log(`[${BOT_INFO.name}] New website inquiry from ${email}`);

  // Check if lead already exists
  const { data: existing } = await getSupabase()
    .from(TABLES.LEADS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('email', email)
    .single();

  if (existing) {
    // Update existing lead with new inquiry
    await getSupabase()
      .from(TABLES.LEADS)
      .update({
        last_inquiry_date: new Date().toISOString(),
        inquiry_count: getSupabase().rpc('increment', { x: 1 }),
        notes: `Additional inquiry: ${message || 'No message'}`
      })
      .eq('tenant_id', TENANT_ID)
      .eq('id', existing.id);

    return res.json({
      success: true,
      message: 'Existing lead updated with new inquiry',
      lead_id: existing.id
    });
  }

  // Calculate lead score
  const leadScore = calculateLeadScore({
    location,
    source: 'website',
    referral_source
  });

  // Create new lead
  const lead = {
    source: 'website',
    name,
    email,
    phone,
    location,
    message,
    service_interest,
    referral_source,
    status: 'new',
    lead_score: leadScore,
    created_at: new Date().toISOString(),
    first_inquiry_date: new Date().toISOString(),
    last_inquiry_date: new Date().toISOString(),
    inquiry_count: 1
  };

  const { data: created, error } = await tenantInsert(TABLES.LEADS, lead).select().single();

  if (error) throw error;

  // Automatically trigger market expansion check for new location
  if (location) {
    console.log(`[${BOT_INFO.name}] New location inquiry: ${location} - triggering market expansion check`);

    try {
      // Parse location into city, state, country
      const locationParts = location.split(',').map(s => s.trim());
      const city = locationParts[0] || location;
      const province_state = locationParts[1] || '';
      const country = locationParts[2] || 'USA'; // Default to USA if not specified

      // Call Market Expansion Bot to register inquiry
      const marketResponse = await fetch('https://yourprivateestatechef.com/api/ypec/market-expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_inquiry',
          data: { city, province_state, country }
        })
      });

      const marketData = await marketResponse.json();

      if (marketData.market_type === 'new') {
        console.log(`[${BOT_INFO.name}] 🚀 NEW MARKET DISCOVERED: ${location}`);
        console.log(`[${BOT_INFO.name}] Chef recruitment automatically launched in ${location}`);
      } else if (marketData.market_type === 'emerging') {
        console.log(`[${BOT_INFO.name}] 📈 Emerging market inquiry registered: ${location} (${marketData.total_inquiries} total)`);
      }
    } catch (error) {
      console.error(`[${BOT_INFO.name}] Market expansion integration error:`, error.message);
      // Don't fail lead capture if market expansion fails
    }
  }

  console.log(`[${BOT_INFO.name}] Lead created: ${created.id}, Score: ${leadScore}`);

  return res.json({
    success: true,
    lead: created,
    lead_score: leadScore,
    priority: leadScore >= 80 ? 'high' : leadScore >= 60 ? 'medium' : 'low',
    next_steps: [
      leadScore >= 80 ? '1. Contact within 24 hours (high priority)' : '1. Contact within 48 hours',
      '2. Schedule consultation call',
      '3. Discuss culinary preferences and requirements',
      '4. Match with appropriate chef',
      '5. Finalize placement'
    ]
  });
}

// ============================================================================
// SCRAPE LEADS
// ============================================================================

async function scrapeLeads(req, res, data) {
  const { source, location, limit } = data || {};

  console.log(`[${BOT_INFO.name}] Scraping leads from ${source || 'all sources'}`);

  // This is a framework for lead scraping - actual scraping would require specific integrations
  const scrapingSources = [];

  if (!source || source === 'luxury_real_estate') {
    scrapingSources.push({
      source: 'luxury_real_estate_listings',
      description: 'Scrape luxury real estate listings $2M+ from Zillow API, Realtor.com API',
      api_required: true,
      estimated_leads_per_month: '100-500',
      steps: [
        '1. Use Zillow API to find homes $2M+ in target markets',
        '2. Extract owner contact info (if available)',
        '3. Cross-reference with public records for contact details',
        '4. Create lead entries with estimated wealth score'
      ],
      cost: '$50-$200/month (API access)',
      legal: 'Ensure compliance with data privacy laws (GDPR, CCPA)'
    });
  }

  if (!source || source === 'forbes') {
    scrapingSources.push({
      source: 'forbes_highest_earners',
      description: 'Forbes 400, Forbes Under 30, local business journals',
      api_required: false,
      estimated_leads_per_month: '50-200',
      steps: [
        '1. Scrape Forbes lists (public data)',
        '2. Local business journals for regional HNW individuals',
        '3. Extract names, locations, estimated net worth',
        '4. Research contact info via LinkedIn, company websites',
        '5. Create high-priority lead entries'
      ],
      cost: 'Free (public data)',
      legal: 'Public information, scraping permitted for B2B use'
    });
  }

  if (!source || source === 'charity') {
    scrapingSources.push({
      source: 'charity_gala_attendees',
      description: 'High-profile charity events, gala attendees',
      api_required: false,
      estimated_leads_per_month: '20-100',
      steps: [
        '1. Find charity gala guest lists (often published)',
        '2. Art auction attendees, museum patron lists',
        '3. Extract names and affiliations',
        '4. Research contact info',
        '5. Create lead entries with high lead score'
      ],
      cost: 'Free',
      legal: 'Public guest lists only'
    });
  }

  console.log(`[${BOT_INFO.name}] Scraping framework ready for ${scrapingSources.length} sources`);

  return res.json({
    success: true,
    message: 'Lead scraping framework prepared',
    sources: scrapingSources,
    note: 'Actual scraping requires API integrations and compliance review',
    next_steps: [
      '1. Select scraping sources to activate',
      '2. Obtain necessary API keys (Zillow, Realtor.com, etc.)',
      '3. Review legal compliance for each source',
      '4. Implement scrapers with rate limiting',
      '5. Schedule daily/weekly scraping runs',
      '6. Automatically qualify and score new leads'
    ],
    estimated_lead_volume: '200-800 leads/month across all sources',
    recommended_activation: 'Start with Forbes lists (free, legal, high quality)'
  });
}

// ============================================================================
// QUALIFY LEAD
// ============================================================================

async function qualifyLead(req, res, data) {
  const { lead_id, qualification_data } = data;

  if (!lead_id) {
    return res.status(400).json({ error: 'lead_id required' });
  }

  // Get lead
  const { data: lead } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', lead_id)
    .single();

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Recalculate lead score with additional qualification data
  const newLeadScore = calculateLeadScore({
    location: lead.location,
    source: lead.source,
    referral_source: lead.referral_source,
    home_value: qualification_data?.home_value,
    budget: qualification_data?.budget,
    timeline: qualification_data?.timeline
  });

  // Determine qualification status
  const qualified = newLeadScore >= 60;
  const priority = newLeadScore >= 80 ? 'high' : newLeadScore >= 60 ? 'medium' : 'low';

  // Update lead
  const updates = {
    lead_score: newLeadScore,
    status: qualified ? 'qualified' : 'contacted',
    qualification_date: qualified ? new Date().toISOString() : null,
    priority,
    qualification_notes: qualification_data?.notes || null,
    home_value: qualification_data?.home_value || null,
    budget: qualification_data?.budget || null,
    timeline: qualification_data?.timeline || null
  };

  const { data: updated, error } = await getSupabase()
    .from(TABLES.LEADS)
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('id', lead_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Lead ${lead_id} qualified: Score ${newLeadScore}, Status: ${updates.status}`);

  return res.json({
    success: true,
    lead: updated,
    qualified,
    lead_score: newLeadScore,
    priority,
    recommendation: qualified
      ? 'Schedule consultation call within 48 hours'
      : 'Continue nurturing, not yet qualified for immediate placement'
  });
}

// ============================================================================
// GET LEADS
// ============================================================================

async function getLeads(req, res, data) {
  const { status, location, min_score, source } = data || {};

  let query = getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  if (status) {
    query = query.eq('status', status);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  if (min_score) {
    query = query.gte('lead_score', min_score);
  }

  if (source) {
    query = query.eq('source', source);
  }

  const { data: leads, error } = await query.order('lead_score', { ascending: false });

  if (error) throw error;

  const categorized = {
    hot: leads?.filter(l => l.lead_score >= 80) || [],
    warm: leads?.filter(l => l.lead_score >= 60 && l.lead_score < 80) || [],
    cold: leads?.filter(l => l.lead_score < 60) || []
  };

  return res.json({
    success: true,
    total: leads?.length || 0,
    categorized,
    leads
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const byStatus = {};
  const bySource = {};
  const byLocation = {};

  leads?.forEach(lead => {
    const status = lead.status || 'new';
    const source = lead.source || 'unknown';
    const location = lead.location || 'unknown';

    byStatus[status] = (byStatus[status] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
    byLocation[location] = (byLocation[location] || 0) + 1;
  });

  const conversionRate = leads && leads.length > 0
    ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1)
    : '0';

  const avgLeadScore = leads && leads.length > 0
    ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length)
    : 0;

  return res.json({
    success: true,
    analytics: {
      total_leads: leads?.length || 0,
      by_status: byStatus,
      by_source: bySource,
      top_locations: Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 10),
      conversion_rate: conversionRate + '%',
      avg_lead_score: avgLeadScore,
      high_priority_leads: leads?.filter(l => l.lead_score >= 80).length || 0
    }
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Get new leads that need follow-up
  const { data: newLeads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'new')
    .order('lead_score', { ascending: false })
    .limit(10);

  // Get leads with consultations scheduled today
  const today = new Date().toISOString().split('T')[0];
  const { data: consultations } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'consultation_scheduled')
    .gte('consultation_date', today)
    .lte('consultation_date', today);

  console.log(`[${BOT_INFO.name}] Daily run: ${newLeads?.length || 0} new leads, ${consultations?.length || 0} consultations today`);

  return res.json({
    success: true,
    new_leads_to_contact: newLeads?.length || 0,
    consultations_today: consultations?.length || 0,
    new_leads: newLeads?.map(l => ({ id: l.id, name: l.name, email: l.email, lead_score: l.lead_score })),
    consultations: consultations?.map(c => ({ id: c.id, name: c.name, consultation_date: c.consultation_date })),
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// HELPER: CALCULATE LEAD SCORE
// ============================================================================

function calculateLeadScore(params) {
  let score = 0;

  // Source quality (0-100 points)
  const sourceMap = {
    forbes_list: 100,
    partnership_referral: 90,
    charity_gala: 80,
    luxury_real_estate: 70,
    website: 60,
    private_club: 50
  };
  score += sourceMap[params.source] || 40;

  // Location tier (bonus points for primary markets)
  if (params.location) {
    const primaryMarkets = ['kelowna', 'vancouver', 'whistler', 'toronto', 'new york', 'los angeles', 'miami', 'aspen', 'hamptons'];
    if (primaryMarkets.some(market => params.location.toLowerCase().includes(market))) {
      score += 20;
    }
  }

  // Referral source (bonus points)
  if (params.referral_source && params.referral_source !== 'none') {
    score += 15;
  }

  // Home value (if available)
  if (params.home_value) {
    if (params.home_value >= 10000000) score += 30;
    else if (params.home_value >= 5000000) score += 20;
    else if (params.home_value >= 2000000) score += 10;
  }

  // Budget (if provided)
  if (params.budget) {
    if (params.budget >= 150000) score += 20;
    else if (params.budget >= 100000) score += 15;
    else if (params.budget >= 60000) score += 10;
  }

  // Ensure score is 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Export for testing
module.exports.calculateLeadScore = calculateLeadScore;
module.exports.BOT_INFO = BOT_INFO;
module.exports.LEAD_SOURCES = LEAD_SOURCES;
