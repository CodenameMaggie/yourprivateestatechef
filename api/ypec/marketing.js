// ============================================================================
// YPEC-MARKETING BOT
// Reports to: DAN (CMO - Chief Marketing Officer)
// Purpose: Referrals, content creation, waitlist management, growth
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const mfs = require('./mfs-integration');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOT_INFO = {
  name: 'YPEC-Marketing',
  reports_to: 'DAN (CMO)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Referral tracking, content creation, waitlist management, growth',
  actions: ['status', 'referrals', 'content', 'waitlist', 'sources', 'run']
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
  const { data: referrals } = await supabase
    .from('ypec_referrals')
    .select('status');

  const { data: waitlist } = await supabase
    .from('ypec_households')
    .select('id')
    .eq('status', 'waitlist');

  const { data: thisMonthInquiries } = await supabase
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
  const { data: referrals, error } = await supabase
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
  const { data: waitlist, error } = await supabase
    .from('ypec_households')
    .select('*')
    .eq('status', 'waitlist')
    .order('inquiry_date');

  if (error) throw error;

  // Also get inquiries marked as waitlist
  const { data: inquiries } = await supabase
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
  const { data: inquiries } = await supabase
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
  const { data: pendingReferrals } = await supabase
    .from('ypec_referrals')
    .select('*')
    .eq('status', 'pending')
    .lt('referred_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Get today's leads
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todayLeads } = await supabase
    .from('ypec_inquiries')
    .select('*')
    .gte('created_at', today.toISOString());

  // Get conversion rate (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data: recentInquiries } = await supabase
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
  const { data: availableChefs } = await supabase
    .from('ypec_chefs')
    .select('id, current_households, max_households')
    .eq('status', 'active')
    .lt('current_households', supabase.raw('max_households'));

  const { data: waitlist } = await supabase
    .from('ypec_households')
    .select('id')
    .eq('status', 'waitlist');

  // Get referral stats
  const { data: allReferrals } = await supabase
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
