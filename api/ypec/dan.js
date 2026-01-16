// ============================================================================
// DAN - AUTONOMOUS CMO
// 100% ACCOUNTABLE FOR GROWTH & LEAD GENERATION
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const DAN_PROFILE = {
  name: 'DAN',
  title: 'Chief Marketing Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: 'Generate pipeline for $100M revenue goal',
  personality: 'Aggressive, data-driven, growth-obsessed, kills underperforming channels',
  decision_authority: [
    'Launch new marketing campaigns (up to $25K)',
    'Kill underperforming channels',
    'Reallocate marketing budget between channels',
    'Adjust ad spend based on ROI',
    'Launch emergency paid campaigns',
    'Demand budget increase from Atlas when ROI proven'
  ],
  lead_targets: {
    monthly: 500, // 500 leads/month for $100M pipeline
    qualified_monthly: 100, // 100 qualified leads/month
    conversion_rate_target: 20, // 20% lead-to-client conversion
    cost_per_lead_max: 500, // Max $500/lead
    cost_per_acquisition_max: 2500 // Max $2,500 per client
  },
  channels: {
    culinary_schools: { budget: 5000, status: 'active', roi: 'pending' },
    b2b_partnerships: { budget: 10000, status: 'active', roi: 'pending' },
    paid_ads: { budget: 0, status: 'inactive', roi: 'n/a' },
    seo: { budget: 2000, status: 'active', roi: 'pending' },
    referrals: { budget: 0, status: 'active', roi: 'high' },
    content_marketing: { budget: 3000, status: 'active', roi: 'pending' }
  },
  actions: [
    'status',
    'growth_health',
    'channel_performance',
    'launch_campaign',
    'kill_channel',
    'reallocate_budget',
    'demand_budget',
    'autonomous_run',
    'weekly_cmo_report'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'growth_health':
        return await assessGrowthHealth(req, res);

      case 'channel_performance':
        return await analyzeChannelPerformance(req, res);

      case 'launch_campaign':
        return await launchCampaign(req, res, data);

      case 'kill_channel':
        return await killChannel(req, res, data);

      case 'reallocate_budget':
        return await reallocateBudget(req, res, data);

      case 'demand_budget':
        return await demandBudget(req, res, data);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      case 'weekly_cmo_report':
        return await sendWeeklyCMOReport(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: DAN_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${DAN_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS - Where We Stand
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${DAN_PROFILE.name}] Checking growth status...`);

  const health = await assessGrowthHealth();
  const channels = await analyzeChannelPerformance();

  return res.json({
    cmo: DAN_PROFILE.name,
    accountability: DAN_PROFILE.accountability,
    lead_targets: DAN_PROFILE.lead_targets,
    current_performance: health,
    channel_performance: channels,
    decision_authority: DAN_PROFILE.decision_authority,
    autonomous: true,
    message: health.hitting_targets ?
      'Lead generation on track. Pipeline healthy.' :
      `CRITICAL: ${health.gap_percentage}% below target. Taking action.`
  });
}

// ============================================================================
// GROWTH HEALTH ASSESSMENT
// ============================================================================

async function assessGrowthHealth() {
  // Get all leads
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get this month's leads
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthLeads = leads?.filter(l =>
    new Date(l.created_at) >= thisMonthStart
  ) || [];

  const qualifiedThisMonth = thisMonthLeads.filter(l => l.status === 'qualified').length;

  // Get conversions (clients from leads)
  const { data: clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const conversion_rate = leads?.length > 0 ?
    ((clients?.length || 0) / leads.length) * 100 : 0;

  // Calculate if hitting targets
  const hitting_lead_target = thisMonthLeads.length >= DAN_PROFILE.lead_targets.monthly;
  const hitting_qualified_target = qualifiedThisMonth >= DAN_PROFILE.lead_targets.qualified_monthly;
  const hitting_conversion_target = conversion_rate >= DAN_PROFILE.lead_targets.conversion_rate_target;

  // Calculate gap
  const lead_gap = DAN_PROFILE.lead_targets.monthly - thisMonthLeads.length;
  const gap_percentage = ((lead_gap / DAN_PROFILE.lead_targets.monthly) * 100).toFixed(1);

  return {
    total_leads: leads?.length || 0,
    this_month_leads: thisMonthLeads.length,
    qualified_this_month: qualifiedThisMonth,
    total_clients: clients?.length || 0,
    conversion_rate: conversion_rate.toFixed(1),
    targets: DAN_PROFILE.lead_targets,
    hitting_targets: hitting_lead_target && hitting_qualified_target,
    lead_gap: lead_gap,
    gap_percentage: gap_percentage,
    health_score: calculateGrowthHealthScore(thisMonthLeads.length, qualifiedThisMonth, conversion_rate)
  };
}

function calculateGrowthHealthScore(leads, qualified, conversion_rate) {
  let score = 50; // Base score

  // Lead volume
  if (leads >= 500) score += 30;
  else if (leads >= 250) score += 20;
  else if (leads >= 100) score += 10;
  else if (leads >= 50) score += 5;

  // Qualified leads
  if (qualified >= 100) score += 20;
  else if (qualified >= 50) score += 10;
  else if (qualified >= 20) score += 5;

  // Conversion rate
  if (conversion_rate >= 20) score += 20;
  else if (conversion_rate >= 10) score += 10;
  else if (conversion_rate >= 5) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// CHANNEL PERFORMANCE ANALYSIS
// ============================================================================

async function analyzeChannelPerformance() {
  const { data: culinary_campaigns } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: partnership_campaigns } = await getSupabase()
    .from(TABLES.PARTNERSHIPS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Calculate channel ROI
  const channels = {
    culinary_schools: {
      campaigns_sent: culinary_campaigns?.filter(c => c.status === 'sent').length || 0,
      responses: culinary_campaigns?.filter(c => c.status === 'responded').length || 0,
      leads_generated: leads?.filter(l => l.source === 'culinary_school').length || 0,
      spend: DAN_PROFILE.channels.culinary_schools.budget,
      roi: 'calculating',
      status: 'active',
      performance: 'pending'
    },
    b2b_partnerships: {
      campaigns_sent: partnership_campaigns?.filter(c => c.status === 'sent').length || 0,
      responses: partnership_campaigns?.filter(c => c.status === 'responded').length || 0,
      leads_generated: leads?.filter(l => l.source === 'b2b_partnership').length || 0,
      spend: DAN_PROFILE.channels.b2b_partnerships.budget,
      roi: 'calculating',
      status: 'active',
      performance: 'pending'
    },
    paid_ads: {
      campaigns_active: 0,
      leads_generated: leads?.filter(l => l.source === 'paid_ad').length || 0,
      spend: DAN_PROFILE.channels.paid_ads.budget,
      roi: 'n/a',
      status: 'inactive',
      performance: 'n/a',
      recommendation: 'LAUNCH IMMEDIATELY - highest ROI potential'
    },
    referrals: {
      leads_generated: leads?.filter(l => l.source === 'referral').length || 0,
      spend: 0,
      roi: 'infinite',
      status: 'active',
      performance: 'excellent'
    }
  };

  // Determine underperforming channels
  for (const [channel_name, channel_data] of Object.entries(channels)) {
    if (channel_data.spend > 0 && channel_data.leads_generated === 0 && channel_data.campaigns_sent > 20) {
      channel_data.recommendation = 'KILL - No results after 20+ campaigns';
      channel_data.performance = 'failing';
    }
  }

  return channels;
}

// ============================================================================
// LAUNCH CAMPAIGN - Autonomous Campaign Launch
// ============================================================================

async function launchCampaign(req, res, data) {
  console.log(`[${DAN_PROFILE.name}] Launching campaign:`, data?.campaign_type);

  const campaign = {
    campaign_id: `CAMP-${Date.now()}`,
    cmo: DAN_PROFILE.name,
    timestamp: new Date().toISOString(),
    campaign_type: data?.campaign_type || 'paid_ads',
    budget: data?.budget || 10000,
    target: data?.target || 'client_leads',
    channels: data?.channels || ['google_ads', 'facebook_ads'],
    expected_roi: data?.expected_roi || '3x',
    status: 'launched'
  };

  // Log campaign launch
  await logCampaign(campaign);

  // Report to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: DAN_PROFILE.name,
    type: 'campaign_launch',
    priority: 'normal',
    subject: `New Campaign Launched: ${campaign.campaign_type}`,
    data: campaign
  });

  if (res) {
    return res.json({
      success: true,
      campaign: campaign,
      message: `Campaign launched with $${campaign.budget} budget`
    });
  } else {
    return campaign;
  }
}

// ============================================================================
// KILL CHANNEL - Stop Underperforming Marketing
// ============================================================================

async function killChannel(req, res, data) {
  console.log(`[${DAN_PROFILE.name}] Killing channel:`, data?.channel);

  const decision = {
    cmo: DAN_PROFILE.name,
    timestamp: new Date().toISOString(),
    action: 'KILL_CHANNEL',
    channel: data?.channel,
    reasoning: data?.reasoning || 'Underperforming - reallocating budget',
    budget_freed: DAN_PROFILE.channels[data?.channel]?.budget || 0,
    reallocation: data?.reallocate_to || 'paid_ads'
  };

  // Update channel status
  if (DAN_PROFILE.channels[data?.channel]) {
    DAN_PROFILE.channels[data?.channel].status = 'killed';
    DAN_PROFILE.channels[data?.channel].budget = 0;
  }

  // Report to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: DAN_PROFILE.name,
    type: 'channel_killed',
    priority: 'normal',
    subject: `Channel Killed: ${data?.channel}`,
    data: decision
  });

  if (res) {
    return res.json({
      success: true,
      decision: decision
    });
  } else {
    return decision;
  }
}

// ============================================================================
// DEMAND BUDGET - Request More Budget from Atlas
// ============================================================================

async function demandBudget(req, res, data) {
  console.log(`[${DAN_PROFILE.name}] Demanding budget increase from Atlas...`);

  const request = {
    from: DAN_PROFILE.name,
    to: 'ATLAS',
    timestamp: new Date().toISOString(),
    type: 'BUDGET_REQUEST',
    amount_requested: data?.amount || 50000,
    reasoning: data?.reasoning || 'Pipeline critically low - need paid ad budget',
    expected_roi: data?.expected_roi || '5x',
    urgency: data?.urgency || 'high',
    justification: {
      current_lead_gap: (await assessGrowthHealth()).lead_gap,
      cost_per_lead: 100,
      expected_leads: (data?.amount || 50000) / 100,
      expected_clients: ((data?.amount || 50000) / 100) * 0.2,
      expected_revenue: (((data?.amount || 50000) / 100) * 0.2) * 6000 * 12 // $6K/mo avg
    }
  };

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: DAN_PROFILE.name,
    type: 'budget_request',
    priority: 'high',
    subject: `CMO Budget Request: $${request.amount_requested.toLocaleString()}`,
    data: request
  });

  if (res) {
    return res.json({
      success: true,
      request: request,
      message: 'Budget request sent to Atlas'
    });
  } else {
    return request;
  }
}

// ============================================================================
// AUTONOMOUS RUN - Daily Growth Operations
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${DAN_PROFILE.name}] Running autonomous growth operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    growth_health: await assessGrowthHealth(),
    channel_performance: await analyzeChannelPerformance(),
    actions_taken: []
  };

  // ACTION 1: If lead gap > 50%, launch emergency paid campaign
  if (results.growth_health.lead_gap > 250) {
    const campaign = await launchCampaign(null, null, {
      campaign_type: 'emergency_paid_ads',
      budget: 25000,
      target: 'close_lead_gap',
      channels: ['google_ads'],
      expected_roi: '4x'
    });
    results.actions_taken.push({
      action: 'EMERGENCY_CAMPAIGN_LAUNCHED',
      campaign: campaign,
      reasoning: `${results.growth_health.lead_gap} leads behind target`
    });
  }

  // ACTION 2: Kill underperforming channels
  for (const [channel_name, channel_data] of Object.entries(results.channel_performance)) {
    if (channel_data.performance === 'failing') {
      const kill_result = await killChannel(null, null, {
        channel: channel_name,
        reasoning: 'No results after multiple campaigns',
        reallocate_to: 'paid_ads'
      });
      results.actions_taken.push({
        action: 'CHANNEL_KILLED',
        channel: channel_name,
        result: kill_result
      });
    }
  }

  // ACTION 3: Demand budget if lead gap critical and hitting ROI
  if (results.growth_health.lead_gap > 400 && results.growth_health.conversion_rate > 10) {
    const budget_request = await demandBudget(null, null, {
      amount: 75000,
      reasoning: `CRITICAL: ${results.growth_health.lead_gap} leads behind target. Proven ${results.growth_health.conversion_rate}% conversion rate.`,
      expected_roi: '6x',
      urgency: 'critical'
    });
    results.actions_taken.push({
      action: 'BUDGET_DEMANDED',
      request: budget_request
    });
  }

  if (res) {
    return res.json(results);
  } else {
    return results;
  }
}

// ============================================================================
// WEEKLY CMO REPORT TO ATLAS
// ============================================================================

async function sendWeeklyCMOReport(req, res) {
  console.log(`[${DAN_PROFILE.name}] Generating weekly CMO report to Atlas...`);

  const health = await assessGrowthHealth();
  const channels = await analyzeChannelPerformance();

  const report = {
    week: new Date().toISOString().split('T')[0],
    growth: {
      total_leads: health.total_leads,
      this_month: health.this_month_leads,
      qualified: health.qualified_this_month,
      conversion_rate: health.conversion_rate,
      health_score: health.health_score
    },
    channel_performance: channels,
    executive_summary: health.hitting_targets ?
      `Lead generation on track. ${health.this_month_leads} leads this month vs ${DAN_PROFILE.lead_targets.monthly} target.` :
      `BEHIND TARGET: ${health.lead_gap} leads short. ${health.gap_percentage}% below goal. Actions taken to close gap.`,
    top_performing_channel: determineTopChannel(channels),
    recommendations: generateRecommendations(health, channels)
  };

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: DAN_PROFILE.name,
    type: 'weekly_cmo_report',
    priority: health.hitting_targets ? 'normal' : 'high',
    subject: `Weekly CMO Report - ${health.hitting_targets ? 'On Track' : 'ACTION REQUIRED'}`,
    data: report
  });

  if (res) {
    return res.json({
      success: true,
      report: report
    });
  } else {
    return report;
  }
}

function determineTopChannel(channels) {
  let top_channel = { name: 'none', leads: 0 };
  for (const [name, data] of Object.entries(channels)) {
    if (data.leads_generated > top_channel.leads) {
      top_channel = { name: name, leads: data.leads_generated };
    }
  }
  return top_channel;
}

function generateRecommendations(health, channels) {
  const recommendations = [];

  if (health.lead_gap > 200) {
    recommendations.push({
      priority: 1,
      action: 'LAUNCH PAID AD CAMPAIGN',
      reasoning: `${health.lead_gap} leads behind target - paid ads fastest path to close gap`,
      budget: 50000,
      expected_impact: '500+ leads in 30 days'
    });
  }

  if (health.conversion_rate < 10) {
    recommendations.push({
      priority: 2,
      action: 'IMPROVE LEAD QUALITY',
      reasoning: `${health.conversion_rate}% conversion too low - need better targeting`,
      owner: 'DAN + ANNIE',
      expected_impact: 'Double conversion rate to 20%'
    });
  }

  return recommendations;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function logCampaign(campaign) {
  try {
    await tenantInsert(TABLES.COMMUNICATIONS, {
      direction: 'outbound',
      from_contact: DAN_PROFILE.name,
      to_contact: 'Market',
      subject: `Campaign: ${campaign.campaign_type}`,
      message: JSON.stringify(campaign),
      channel: 'marketing_campaign',
      status: 'launched',
      metadata: {
        campaign_id: campaign.campaign_id,
        budget: campaign.budget,
        autonomous: true
      }
    });
  } catch (error) {
    console.error('[DAN] Error logging campaign:', error.message);
  }
}

async function reallocateBudget(req, res, data) {
  console.log(`[${DAN_PROFILE.name}] Reallocating budget from ${data?.from} to ${data?.to}`);

  const reallocation = {
    from_channel: data?.from,
    to_channel: data?.to,
    amount: data?.amount || 10000,
    reasoning: data?.reasoning || 'Optimizing channel performance',
    timestamp: new Date().toISOString()
  };

  // Update budgets
  if (DAN_PROFILE.channels[data?.from]) {
    DAN_PROFILE.channels[data?.from].budget -= reallocation.amount;
  }
  if (DAN_PROFILE.channels[data?.to]) {
    DAN_PROFILE.channels[data?.to].budget += reallocation.amount;
  }

  return res.json({
    success: true,
    reallocation: reallocation
  });
}

module.exports.DAN_PROFILE = DAN_PROFILE;
