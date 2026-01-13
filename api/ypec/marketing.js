// ============================================================================
// YPEC-MARKETING BOT
// Reports to: DAN (CMO - Chief Marketing Officer)
// Purpose: Referrals, content creation, waitlist management, growth
// ============================================================================

const { getSupabase } = require('./database');
const mfs = require('./mfs-integration');
const mfsDb = require('./mfs-database');


const BOT_INFO = {
  name: 'DAN (CMO Marketing Bot)',
  alias: 'YPEC-Marketing',
  reports_to: 'Self (DAN is the bot)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: '🤖 FREE LEAD SCRAPING EVERYWHERE - Pinterest, LinkedIn, Google, forums, directories. Also: referral tracking, content, waitlist, growth',
  actions: ['status', 'referrals', 'content', 'waitlist', 'sources', 'run', 'test_mfs_connection', 'sync_mfs_leads', 'cross_portfolio_leads', 'scrape_leads_everywhere']
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'referrals':
        return await getReferrals(req, res);

      case 'content':
        return await manageContent(req, res, data);

      case 'waitlist':
        return await getWaitlist(req, res);

      case 'sources':
        return await analyzeInquirySources(req, res);

      case 'run':
        return await dailyRun(req, res);

      case 'test_mfs_connection':
        return await testMFSConnection(req, res);

      case 'sync_mfs_leads':
        return await syncMFSLeads(req, res);

      case 'cross_portfolio_leads':
        return await getCrossPortfolioLeads(req, res);

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
  const { data: referrals } = await getSupabase()
    .from('ypec_referrals')
    .select('status');

  const { data: waitlist } = await getSupabase()
    .from('ypec_households')
    .select('id')
    .eq('status', 'waitlist');

  const { data: thisMonthInquiries } = await getSupabase()
    .from('ypec_inquiries')
    .select('id, referral_source')
    .gte('created_at', new Date(new Date().setDate(1)).toISOString());

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: {
      active_referrals: referrals?.filter(r => r.status === 'pending').length || 0,
      converted_referrals: referrals?.filter(r => r.status === 'converted').length || 0,
      waitlist_size: waitlist?.length || 0,
      this_month_inquiries: thisMonthInquiries?.length || 0
    },
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET REFERRALS
// ============================================================================

async function getReferrals(req, res) {
  const { data: referrals, error } = await getSupabase()
    .from('ypec_referrals')
    .select(`
      *,
      referrer:referrer_household_id(primary_contact_name, email),
      converted:converted_household_id(primary_contact_name, email)
    `)
    .order('referred_date', { ascending: false });

  if (error) throw error;

  const grouped = {
    pending: referrals?.filter(r => r.status === 'pending') || [],
    contacted: referrals?.filter(r => r.status === 'contacted') || [],
    converted: referrals?.filter(r => r.status === 'converted') || [],
    declined: referrals?.filter(r => r.status === 'declined') || []
  };

  // Calculate conversion rate
  const totalReferrals = referrals?.length || 0;
  const converted = grouped.converted.length;
  const conversionRate = totalReferrals > 0 ? ((converted / totalReferrals) * 100).toFixed(1) : 0;

  return res.json({
    success: true,
    total: totalReferrals,
    conversion_rate: `${conversionRate}%`,
    grouped,
    referrals
  });
}

// ============================================================================
// MANAGE CONTENT
// ============================================================================

async function manageContent(req, res, data) {
  const { action: contentAction } = data || {};

  console.log(`[${BOT_INFO.name}] Content management: ${contentAction}`);

  // Content ideas for YPEC cross-promotion
  const contentIdeas = [
    {
      platform: 'Sovereign Design It Podcast',
      idea: 'Interview featured YPEC chef',
      frequency: 'Monthly',
      status: 'active'
    },
    {
      platform: 'Steading Home',
      idea: 'Chef cooking heritage recipes from SH',
      frequency: 'Weekly',
      status: 'active'
    },
    {
      platform: 'Timber Homestead',
      idea: 'Estate kitchen tours / off-grid cooking',
      frequency: 'Monthly',
      status: 'planned'
    },
    {
      platform: 'YPEC Website',
      idea: 'Featured household spotlight (with permission)',
      frequency: 'Quarterly',
      status: 'planned'
    }
  ];

  return res.json({
    success: true,
    content_calendar: contentIdeas,
    next_steps: 'Schedule content with DAN and Sovereign Design It team'
  });
}

// ============================================================================
// GET WAITLIST
// ============================================================================

async function getWaitlist(req, res) {
  const { data: waitlist, error } = await getSupabase()
    .from('ypec_households')
    .select('*')
    .eq('status', 'waitlist')
    .order('inquiry_date');

  if (error) throw error;

  // Also get inquiries marked as waitlist
  const { data: inquiries } = await getSupabase()
    .from('ypec_inquiries')
    .select('*')
    .eq('status', 'waitlist')
    .order('created_at');

  return res.json({
    success: true,
    waitlist_households: waitlist?.length || 0,
    waitlist_inquiries: inquiries?.length || 0,
    total_waitlist: (waitlist?.length || 0) + (inquiries?.length || 0),
    households: waitlist,
    inquiries
  });
}

// ============================================================================
// ANALYZE INQUIRY SOURCES
// ============================================================================

async function analyzeInquirySources(req, res) {
  const { data: inquiries } = await getSupabase()
    .from('ypec_inquiries')
    .select('referral_source, status, created_at');

  // Group by source
  const sources = {};
  inquiries?.forEach(inq => {
    const source = inq.referral_source || 'Unknown';
    if (!sources[source]) {
      sources[source] = {
        total: 0,
        converted: 0,
        pending: 0
      };
    }
    sources[source].total++;
    if (inq.status === 'converted') sources[source].converted++;
    if (inq.status === 'new' || inq.status === 'reviewing') sources[source].pending++;
  });

  // Calculate conversion rates
  const analyzed = Object.keys(sources).map(source => ({
    source,
    total_inquiries: sources[source].total,
    converted: sources[source].converted,
    conversion_rate: sources[source].total > 0
      ? ((sources[source].converted / sources[source].total) * 100).toFixed(1) + '%'
      : '0%',
    pending: sources[source].pending
  })).sort((a, b) => b.total_inquiries - a.total_inquiries);

  return res.json({
    success: true,
    total_sources: analyzed.length,
    sources: analyzed,
    recommendations: generateSourceRecommendations(analyzed)
  });
}

// ============================================================================
// HELPER: GENERATE SOURCE RECOMMENDATIONS
// ============================================================================

function generateSourceRecommendations(sources) {
  const recommendations = [];

  // Identify best performing sources
  const bestSource = sources
    .filter(s => s.total_inquiries >= 5)
    .sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate))[0];

  if (bestSource) {
    recommendations.push({
      type: 'scale',
      message: `Focus on scaling ${bestSource.source} - highest conversion at ${bestSource.conversion_rate}`
    });
  }

  // Identify underperforming sources
  const underperforming = sources.filter(s =>
    s.total_inquiries >= 10 && parseFloat(s.conversion_rate) < 20
  );

  if (underperforming.length > 0) {
    recommendations.push({
      type: 'optimize',
      message: `Optimize or reduce investment in: ${underperforming.map(s => s.source).join(', ')}`
    });
  }

  // Referral opportunity
  const referralSource = sources.find(s => s.source.toLowerCase().includes('referral'));
  if (referralSource && parseFloat(referralSource.conversion_rate) > 50) {
    recommendations.push({
      type: 'referral',
      message: 'Referral program performing well - consider incentivizing referrers'
    });
  }

  return recommendations;
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Check for referrals that need follow-up
  const { data: pendingReferrals } = await getSupabase()
    .from('ypec_referrals')
    .select('*')
    .eq('status', 'pending')
    .lt('referred_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Get today's leads
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todayLeads } = await getSupabase()
    .from('ypec_inquiries')
    .select('*')
    .gte('created_at', today.toISOString());

  // Get conversion rate (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data: recentInquiries } = await getSupabase()
    .from('ypec_inquiries')
    .select('status')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const converted = recentInquiries?.filter(i => i.status === 'converted').length || 0;
  const total = recentInquiries?.length || 1;
  const conversionRate = ((converted / total) * 100).toFixed(1);

  // Get lead source analysis
  const sourcesResponse = await analyzeInquirySources({ body: {} }, null);
  const bestSource = sourcesResponse?.sources?.[0] || null;

  // Check waitlist for capacity openings
  const { data: availableChefs } = await getSupabase()
    .from('ypec_chefs')
    .select('id, current_households, max_households')
    .eq('status', 'active')
    .lt('current_households', getSupabase().raw('max_households'));

  const { data: waitlist } = await getSupabase()
    .from('ypec_households')
    .select('id')
    .eq('status', 'waitlist');

  // Get referral stats
  const { data: allReferrals } = await getSupabase()
    .from('ypec_referrals')
    .select('status');

  const referralStats = {
    active: allReferrals?.filter(r => r.status === 'pending' || r.status === 'contacted').length || 0,
    converted: allReferrals?.filter(r => r.status === 'converted').length || 0,
    conversion_rate: allReferrals?.length > 0
      ? ((allReferrals.filter(r => r.status === 'converted').length / allReferrals.length) * 100).toFixed(1) + '%'
      : '0%'
  };

  // Prepare recommendations
  const recommendations = [];
  if (pendingReferrals && pendingReferrals.length > 0) {
    recommendations.push(`${pendingReferrals.length} referrals need follow-up (>7 days old)`);
  }
  if (availableChefs && availableChefs.length > 0 && waitlist && waitlist.length > 0) {
    recommendations.push(`${waitlist.length} households on waitlist - capacity available`);
  }
  if (parseFloat(conversionRate) < 20) {
    recommendations.push(`Low conversion rate (${conversionRate}%) - review lead quality and follow-up process`);
  }

  // Send marketing insights to DAN (CMO)
  await mfs.sendMarketingInsightsToDan({
    period: 'daily',
    total_leads: todayLeads?.length || 0,
    conversion_rate: parseFloat(conversionRate),
    best_source: bestSource,
    referrals: referralStats,
    waitlist: {
      total: waitlist?.length || 0,
      capacity_available: availableChefs && availableChefs.length > 0
    },
    recommendations
  });

  return res.json({
    success: true,
    message: 'Daily run completed - insights sent to DAN',
    pending_referral_followups: pendingReferrals?.length || 0,
    waitlist_opportunities: (availableChefs?.length || 0) > 0 && (waitlist?.length || 0) > 0,
    conversion_rate: conversionRate + '%',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// MFS CENTRAL DATABASE INTEGRATION
// ============================================================================

async function testMFSConnection(req, res) {
  console.log(`[${BOT_INFO.name}] Testing MFS Central Database connection`);

  const result = await mfsDb.testMFSConnection();

  return res.json({
    success: result.connected,
    ...result,
    timestamp: new Date().toISOString()
  });
}

async function syncMFSLeads(req, res) {
  console.log(`[${BOT_INFO.name}] Syncing leads to MFS Central Database`);

  // Get all YPEC inquiries not yet synced to MFS
  const { data: inquiries, error } = await getSupabase()
    .from('ypec_inquiries')
    .select('*')
    .is('mfs_lead_id', null)
    .limit(100);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  let synced = 0;
  let failed = 0;

  for (const inquiry of inquiries || []) {
    const result = await mfsDb.storeMFSLead({
      email: inquiry.email,
      name: inquiry.name || inquiry.household_name,
      phone: inquiry.phone,
      location: inquiry.location,
      income_level: 'high_net_worth',
      interest_level: inquiry.service_interest || 'inquiry',
      notes: `YPEC inquiry: ${inquiry.service_interest || 'General inquiry'}`,
      status: inquiry.status === 'converted' ? 'converted' : 'new'
    });

    if (result.data && !result.error) {
      // Update YPEC inquiry with MFS lead ID
      await getSupabase()
        .from('ypec_inquiries')
        .update({ mfs_lead_id: result.data.id })
        .eq('id', inquiry.id);

      synced++;
    } else {
      failed++;
      console.error(`[${BOT_INFO.name}] Failed to sync inquiry ${inquiry.id}:`, result.error);
    }
  }

  console.log(`[${BOT_INFO.name}] Synced ${synced} leads to MFS, ${failed} failed`);

  return res.json({
    success: true,
    synced,
    failed,
    total_processed: inquiries?.length || 0,
    message: `Synced ${synced} YPEC leads to MFS Central Database`
  });
}

async function getCrossPortfolioLeads(req, res) {
  console.log(`[${BOT_INFO.name}] Fetching cross-portfolio lead opportunities`);

  const result = await mfsDb.getCrossPortfolioLeads({ limit: 50 });

  if (result.error) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  // Filter for leads that might be interested in YPEC
  const opportunities = result.data?.filter(lead => {
    // High-net-worth individuals from Steading Home or Timber Homestead
    return lead.income_level === 'high_net_worth' ||
           lead.income_level === 'ultra_high_net_worth';
  }) || [];

  return res.json({
    success: true,
    total_opportunities: opportunities.length,
    leads: opportunities.map(lead => ({
      id: lead.id,
      source: lead.source,
      name: lead.name,
      email: lead.email,
      location: lead.location,
      income_level: lead.income_level,
      created_at: lead.created_at,
      opportunity_reason: lead.source === 'SH_osm'
        ? 'Estate owner - likely needs private chef'
        : 'Luxury homeowner - potential YPEC client'
    })),
    message: 'Cross-portfolio opportunities from Steading Home and Timber Homestead'
  });
}
