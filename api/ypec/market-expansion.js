// ============================================================================
// YPEC MARKET EXPANSION BOT
// Reports to: Dan (CMO) & Atlas (CEO)
// Purpose: Demand-driven geographic expansion - tracks new markets, recruits chefs
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'YPEC-MarketExpansion',
  reports_to: 'Dan (CMO) and Atlas (CEO)',
  supports: 'Henry (COO) for chef recruitment',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Demand-driven geographic expansion - we go where clients are',
  philosophy: 'NOT LIMITED to 10 cities. When client inquiries come from new locations, we do targeted chef outreach in that area and surrounding regions.',
  actions: ['status', 'register_inquiry', 'emerging_markets', 'launch_recruitment', 'market_maturity', 'analytics']
};

// Load strategic markets (primary + emerging)
let STRATEGIC_MARKETS = [];
let EMERGING_MARKETS = [];
try {
  const marketsPath = path.join(__dirname, '../../data/strategic-markets.json');
  const marketsData = JSON.parse(fs.readFileSync(marketsPath, 'utf8'));
  STRATEGIC_MARKETS = marketsData.markets;
  EMERGING_MARKETS = marketsData.emerging_markets?.examples || [];
} catch (error) {
  console.error('[MarketExpansion] Error loading markets database:', error);
}

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'register_inquiry':
        return await registerClientInquiry(req, res, data);

      case 'emerging_markets':
        return await getEmergingMarkets(req, res);

      case 'launch_recruitment':
        return await launchRecruitmentCampaign(req, res, data);

      case 'market_maturity':
        return await updateMarketMaturity(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

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
  // Get all markets from database
  const { data: markets } = await getSupabase()
    .from('ypec_markets')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    primary_markets: STRATEGIC_MARKETS.length,
    emerging_markets: markets?.filter(m => m.status === 'emerging').length || 0,
    established_markets: markets?.filter(m => m.status === 'established').length || 0,
    total_markets_served: (markets?.length || 0) + STRATEGIC_MARKETS.length,
    markets_with_chefs: markets?.filter(m => m.chefs_recruited > 0).length || 0,
    markets_pending_chefs: markets?.filter(m => m.client_inquiries > 0 && m.chefs_recruited === 0).length || 0
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    philosophy: BOT_INFO.philosophy,
    expansion_strategy: 'Client inquiry → Chef recruitment → Market establishment',
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// REGISTER CLIENT INQUIRY
// ============================================================================

async function registerClientInquiry(req, res, data) {
  const { city, province_state, country, client_id, inquiry_details } = data;

  if (!city || !province_state || !country) {
    return res.status(400).json({ error: 'city, province_state, and country required' });
  }

  console.log(`[${BOT_INFO.name}] Client inquiry from ${city}, ${province_state}, ${country}`);

  // Check if this is a primary market
  const isPrimaryMarket = STRATEGIC_MARKETS.find(m =>
    m.city.toLowerCase() === city.toLowerCase() &&
    m.province_state.toLowerCase() === province_state.toLowerCase()
  );

  if (isPrimaryMarket) {
    console.log(`[${BOT_INFO.name}] ${city} is a primary market - existing chef network available`);
    return res.json({
      success: true,
      market_type: 'primary',
      market: isPrimaryMarket,
      chefs_available: 'Check existing chef network',
      action_required: 'Match client with available chefs in primary market'
    });
  }

  // Check if this is an emerging market we're already tracking
  const { data: existingMarket } = await getSupabase()
    .from('ypec_markets')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('city', city)
    .eq('province_state', province_state)
    .single();

  if (existingMarket) {
    // Update inquiry count
    const { data: updated } = await getSupabase()
      .from('ypec_markets')
      .update({
        client_inquiries: existingMarket.client_inquiries + 1,
        last_inquiry_date: new Date().toISOString()
      })
      .eq('tenant_id', TENANT_ID)
      .eq('id', existingMarket.id)
      .select()
      .single();

    console.log(`[${BOT_INFO.name}] Updated inquiry count for ${city}: ${updated.client_inquiries} total inquiries`);

    return res.json({
      success: true,
      market_type: 'emerging',
      market: updated,
      action_required: updated.chefs_recruited > 0
        ? 'Match client with recruited chefs'
        : 'Launch chef recruitment campaign in this area'
    });
  }

  // NEW MARKET - Create emerging market entry
  const market_id = `${city.toLowerCase().replace(/\s+/g, '-')}-${province_state.toLowerCase().replace(/\s+/g, '')}`;

  const { data: newMarket, error } = await tenantInsert('ypec_markets', {
    id: market_id,
    city,
    province_state,
    country,
    status: 'emerging',
    client_inquiries: 1,
    chefs_recruited: 0,
    first_inquiry_date: new Date().toISOString(),
    last_inquiry_date: new Date().toISOString(),
    target_chefs: calculateTargetChefs(1), // Start with 3-5 chefs for 1 inquiry
    created_at: new Date().toISOString()
  }).select().single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] NEW MARKET DISCOVERED: ${city}, ${province_state}`);
  console.log(`[${BOT_INFO.name}] Target: Recruit ${newMarket.target_chefs} chefs in this area`);

  return res.json({
    success: true,
    market_type: 'new',
    market: newMarket,
    message: `🚀 NEW MARKET DISCOVERED: ${city}, ${province_state}!`,
    action_required: 'Launch targeted chef recruitment campaign',
    next_steps: [
      `1. Research culinary scene in ${city}`,
      '2. Identify local culinary schools',
      '3. Post job ads in local markets (Indeed, Craigslist, etc.)',
      '4. Reach out to chefs in 50-mile radius',
      `5. Recruit ${newMarket.target_chefs} chefs to establish presence`
    ],
    recruitment_campaign: {
      target_location: `${city}, ${province_state}`,
      target_radius: '50 miles',
      target_chefs: newMarket.target_chefs,
      channels: ['Indeed', 'Culinary Schools', 'LinkedIn', 'Local Job Boards']
    }
  });
}

// ============================================================================
// GET EMERGING MARKETS
// ============================================================================

async function getEmergingMarkets(req, res) {
  const { data: markets, error } = await getSupabase()
    .from('ypec_markets')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('client_inquiries', { ascending: false });

  if (error) throw error;

  const categorized = {
    high_priority: markets?.filter(m => m.client_inquiries >= 3 && m.chefs_recruited === 0) || [],
    medium_priority: markets?.filter(m => m.client_inquiries >= 1 && m.client_inquiries < 3 && m.chefs_recruited === 0) || [],
    established: markets?.filter(m => m.chefs_recruited > 0) || []
  };

  return res.json({
    success: true,
    total_emerging: markets?.length || 0,
    categorized,
    all_markets: markets
  });
}

// ============================================================================
// LAUNCH RECRUITMENT CAMPAIGN
// ============================================================================

async function launchRecruitmentCampaign(req, res, data) {
  const { market_id, channels } = data;

  if (!market_id) {
    return res.status(400).json({ error: 'market_id required' });
  }

  // Get market details
  const { data: market } = await getSupabase()
    .from('ypec_markets')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', market_id)
    .single();

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  console.log(`[${BOT_INFO.name}] Launching recruitment campaign in ${market.city}, ${market.province_state}`);

  // Generate recruitment campaign plan
  const campaign = {
    market: `${market.city}, ${market.province_state}`,
    target_chefs: market.target_chefs,
    search_radius: '50 miles',
    channels: channels || [
      'Indeed (local job posting)',
      'LinkedIn (chef recruitment ads)',
      'Culinary schools in area',
      'Local restaurant associations',
      'Craigslist (gig section)'
    ],
    job_posting_template: generateJobPosting(market),
    outreach_strategy: [
      `1. Post job ads on Indeed targeting ${market.city}`,
      `2. LinkedIn outreach to chefs within 50 miles of ${market.city}`,
      '3. Contact local culinary schools',
      '4. Reach out to restaurant associations',
      '5. Post on local job boards and community forums'
    ],
    estimated_timeline: '2-4 weeks to recruit first chef',
    budget: '$200-$500 for job postings'
  };

  // Update market status
  await getSupabase()
    .from('ypec_markets')
    .update({
      status: 'recruiting',
      recruitment_launched_date: new Date().toISOString()
    })
    .eq('tenant_id', TENANT_ID)
    .eq('id', market_id);

  console.log(`[${BOT_INFO.name}] Recruitment campaign active for ${market.city}`);

  return res.json({
    success: true,
    campaign,
    message: `Recruitment campaign launched in ${market.city}, ${market.province_state}`,
    next_action: 'Post job ads and begin outreach'
  });
}

// ============================================================================
// UPDATE MARKET MATURITY
// ============================================================================

async function updateMarketMaturity(req, res, data) {
  const { market_id, chefs_recruited, new_status } = data;

  if (!market_id) {
    return res.status(400).json({ error: 'market_id required' });
  }

  const updates = {};

  if (chefs_recruited !== undefined) {
    updates.chefs_recruited = chefs_recruited;

    // Auto-promote market status based on chef count
    if (chefs_recruited >= 5) {
      updates.status = 'established';
    } else if (chefs_recruited >= 1) {
      updates.status = 'growing';
    }
  }

  if (new_status) {
    updates.status = new_status;
  }

  const { data: updated, error } = await getSupabase()
    .from('ypec_markets')
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('id', market_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Market ${market_id} updated: ${updated.chefs_recruited} chefs, status: ${updated.status}`);

  return res.json({
    success: true,
    market: updated,
    milestone: updated.status === 'established' ? `🎉 ${updated.city} is now an ESTABLISHED market!` : null
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: markets } = await getSupabase()
    .from('ypec_markets')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const totalInquiries = markets?.reduce((sum, m) => sum + m.client_inquiries, 0) || 0;
  const totalChefs = markets?.reduce((sum, m) => sum + m.chefs_recruited, 0) || 0;

  const byStatus = {};
  markets?.forEach(m => {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  });

  const topMarkets = markets
    ?.sort((a, b) => b.client_inquiries - a.client_inquiries)
    .slice(0, 5)
    .map(m => ({
      market: `${m.city}, ${m.province_state}`,
      inquiries: m.client_inquiries,
      chefs: m.chefs_recruited,
      status: m.status
    })) || [];

  return res.json({
    success: true,
    analytics: {
      total_primary_markets: STRATEGIC_MARKETS.length,
      total_emerging_markets: markets?.length || 0,
      total_markets_served: STRATEGIC_MARKETS.length + (markets?.length || 0),
      total_client_inquiries: totalInquiries,
      total_chefs_recruited_in_new_markets: totalChefs,
      markets_by_status: byStatus,
      top_emerging_markets: topMarkets,
      geographic_reach: `${STRATEGIC_MARKETS.length + (markets?.length || 0)} cities across North America`
    }
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateTargetChefs(inquiries) {
  if (inquiries >= 5) return 10;
  if (inquiries >= 3) return 7;
  if (inquiries >= 2) return 5;
  return 3; // Start with 3 chefs for first inquiry
}

function generateJobPosting(market) {
  return {
    title: `Private Estate Chef - ${market.city}, ${market.province_state}`,
    company: 'Your Private Estate Chef',
    location: `${market.city}, ${market.province_state}`,
    salary: '$60,000 - $150,000/year',
    description: `Your Private Estate Chef is expanding to ${market.city} and seeking talented culinary professionals for private household placements.

Work directly with high-net-worth families in beautiful private estates. Enjoy stable, long-term positions with competitive compensation and benefits.

WHAT WE OFFER:
• Competitive salary ($60K-$150K based on experience)
• Long-term, stable placements
• Work-life balance
• Professional development
• Benefits package

REQUIREMENTS:
• Culinary degree or equivalent experience
• 3+ years professional cooking experience
• Criminal background check (required)
• Flexible and creative menu planning
• Dietary restriction expertise (allergies, health conditions)

ABOUT US:
Your Private Estate Chef connects elite culinary talent with discerning private households across North America. We're expanding to ${market.city} based on client demand in your area.

TO APPLY:
Visit: https://yourprivateestatechef.com/chef-careers
Or email: chef-relations@yourprivateestatechef.com`
  };
}

// Export for testing
module.exports.generateJobPosting = generateJobPosting;
module.exports.calculateTargetChefs = calculateTargetChefs;
module.exports.BOT_INFO = BOT_INFO;
