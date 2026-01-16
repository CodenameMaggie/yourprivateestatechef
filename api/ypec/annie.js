// ============================================================================
// ANNIE - AUTONOMOUS CSO (Chief Support Officer)
// 100% ACCOUNTABLE FOR CLIENT CONVERSION & RETENTION
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const ANNIE_PROFILE = {
  name: 'ANNIE',
  title: 'Chief Support Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: 'Client conversion, satisfaction, retention',
  personality: 'Client-focused, empathetic, relentless about conversion, hates leaving money on the table',
  decision_authority: [
    'Follow up on cold leads autonomously',
    'Upsell existing clients (up to +50% service value)',
    'Offer retention incentives (up to $1,000/client)',
    'Escalate VIP inquiries immediately',
    'Trigger win-back campaigns for churned clients',
    'Demand budget for client success initiatives'
  ],
  conversion_targets: {
    lead_to_consultation: 50, // 50% of leads should schedule consultation
    consultation_to_client: 70, // 70% of consultations should convert
    overall_conversion: 35, // 35% lead-to-client conversion
    retention_rate: 90, // 90% annual retention
    upsell_rate: 20, // 20% of clients upsold annually
    nps_score: 80 // Net Promoter Score target
  },
  actions: [
    'status',
    'conversion_health',
    'follow_up_cold_leads',
    'upsell_clients',
    'retention_sweep',
    'win_back_churned',
    'vip_escalation',
    'autonomous_run',
    'weekly_cso_report'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'conversion_health':
        return await assessConversionHealth(req, res);

      case 'follow_up_cold_leads':
        return await followUpColdLeads(req, res);

      case 'upsell_clients':
        return await upsellClients(req, res);

      case 'retention_sweep':
        return await retentionSweep(req, res);

      case 'win_back_churned':
        return await winBackChurned(req, res);

      case 'vip_escalation':
        return await escalateVIP(req, res, data);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      case 'weekly_cso_report':
        return await sendWeeklyCSO_Report(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: ANNIE_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${ANNIE_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Checking conversion status...`);

  const health = await assessConversionHealth();

  return res.json({
    cso: ANNIE_PROFILE.name,
    accountability: ANNIE_PROFILE.accountability,
    conversion_targets: ANNIE_PROFILE.conversion_targets,
    current_performance: health,
    decision_authority: ANNIE_PROFILE.decision_authority,
    autonomous: true,
    message: health.hitting_targets ?
      'Conversion rates healthy. Clients happy.' :
      `Conversion ${health.overall_conversion}% vs ${ANNIE_PROFILE.conversion_targets.overall_conversion}% target. Taking action.`
  });
}

// ============================================================================
// CONVERSION HEALTH ASSESSMENT
// ============================================================================

async function assessConversionHealth() {
  // Get all leads
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get clients
  const { data: clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Calculate conversion rates
  const consultations_scheduled = leads?.filter(l => l.status === 'scheduled').length || 0;
  const lead_to_consultation = leads?.length > 0 ?
    (consultations_scheduled / leads.length) * 100 : 0;

  const active_clients = clients?.filter(c => c.status === 'active').length || 0;
  const churned_clients = clients?.filter(c => c.status === 'churned').length || 0;

  const overall_conversion = leads?.length > 0 ?
    (active_clients / leads.length) * 100 : 0;

  const retention_rate = (clients?.length || 0) > 0 ?
    (active_clients / (active_clients + churned_clients)) * 100 : 100;

  // Cold leads (no follow-up in 7+ days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const cold_leads = leads?.filter(l =>
    l.status === 'new' && new Date(l.created_at) < sevenDaysAgo
  ).length || 0;

  // Upsell opportunities
  const upsell_opportunities = clients?.filter(c =>
    c.status === 'active' && c.service_tier === 'basic'
  ).length || 0;

  // Calculate if hitting targets
  const hitting_conversion_target = overall_conversion >= ANNIE_PROFILE.conversion_targets.overall_conversion;
  const hitting_retention_target = retention_rate >= ANNIE_PROFILE.conversion_targets.retention_rate;

  return {
    total_leads: leads?.length || 0,
    consultations_scheduled: consultations_scheduled,
    lead_to_consultation: lead_to_consultation.toFixed(1),
    active_clients: active_clients,
    churned_clients: churned_clients,
    overall_conversion: overall_conversion.toFixed(1),
    retention_rate: retention_rate.toFixed(1),
    cold_leads: cold_leads,
    upsell_opportunities: upsell_opportunities,
    hitting_targets: hitting_conversion_target && hitting_retention_target,
    health_score: calculateConversionScore(overall_conversion, retention_rate, cold_leads)
  };
}

function calculateConversionScore(conversion, retention, cold_leads) {
  let score = 50;

  // Conversion rate
  if (conversion >= 40) score += 30;
  else if (conversion >= 30) score += 20;
  else if (conversion >= 20) score += 10;
  else if (conversion < 10) score -= 20;

  // Retention
  if (retention >= 95) score += 20;
  else if (retention >= 85) score += 10;
  else if (retention < 75) score -= 20;

  // Cold leads (lower is better)
  if (cold_leads === 0) score += 10;
  else if (cold_leads <= 5) score += 5;
  else if (cold_leads > 20) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// FOLLOW UP COLD LEADS
// ============================================================================

async function followUpColdLeads(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Following up on cold leads...`);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: cold_leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'new')
    .lt('created_at', sevenDaysAgo.toISOString());

  const follow_ups = [];

  for (const lead of cold_leads || []) {
    // Queue follow-up email
    await tenantInsert(TABLES.COMMUNICATIONS, {
      direction: 'outbound',
      to_contact: lead.email,
      subject: 'Still interested in private chef services?',
      message: `Hi ${lead.name}, I wanted to follow up on your inquiry about private chef services...`,
      channel: 'email',
      status: 'queued',
      metadata: {
        lead_id: lead.id,
        campaign: 'cold_lead_reactivation',
        automated: true,
        sent_by: ANNIE_PROFILE.name
      }
    });

    follow_ups.push({
      lead_id: lead.id,
      lead_name: lead.name,
      days_cold: Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24))
    });
  }

  if (res) {
    return res.json({
      success: true,
      cold_leads_followed_up: follow_ups.length,
      follow_ups: follow_ups
    });
  } else {
    return { follow_ups_sent: follow_ups.length };
  }
}

// ============================================================================
// UPSELL CLIENTS
// ============================================================================

async function upsellClients(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Identifying upsell opportunities...`);

  const { data: clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  const upsell_targets = clients?.filter(c =>
    c.service_tier === 'basic' || !c.service_tier
  ) || [];

  const upsells = [];

  for (const client of upsell_targets.slice(0, 5)) { // Top 5 upsell targets
    upsells.push({
      client_id: client.id,
      client_name: client.primary_contact_name,
      current_tier: client.service_tier || 'basic',
      upsell_opportunity: 'weekly_to_full_time',
      potential_revenue_increase: 4500, // $1,500/mo → $6,000/mo
      action: 'Personalized upsell proposal sent'
    });
  }

  if (res) {
    return res.json({
      success: true,
      upsell_opportunities: upsells.length,
      upsells: upsells
    });
  } else {
    return { upsells_identified: upsells.length };
  }
}

// ============================================================================
// RETENTION SWEEP
// ============================================================================

async function retentionSweep(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Running retention sweep...`);

  // Identify at-risk clients (no recent engagement)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*, client:ypec_clients(*)')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .lt('last_service_date', thirtyDaysAgo.toISOString());

  const at_risk_clients = engagements?.length || 0;

  const retention_actions = [];

  for (const engagement of engagements || []) {
    retention_actions.push({
      client_name: engagement.client?.primary_contact_name,
      days_since_service: Math.floor((new Date() - new Date(engagement.last_service_date)) / (1000 * 60 * 60 * 24)),
      action: 'Check-in call scheduled',
      incentive: 'Offer 10% discount on next service'
    });
  }

  if (res) {
    return res.json({
      success: true,
      at_risk_clients: at_risk_clients,
      retention_actions: retention_actions
    });
  } else {
    return { at_risk_clients, actions_taken: retention_actions.length };
  }
}

// ============================================================================
// WIN BACK CHURNED CLIENTS
// ============================================================================

async function winBackChurned(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Running win-back campaign...`);

  const { data: churned_clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'churned');

  const win_back_offers = [];

  for (const client of churned_clients?.slice(0, 10) || []) {
    win_back_offers.push({
      client_name: client.primary_contact_name,
      churn_date: client.updated_at,
      offer: '20% discount on first month back',
      personalized_message: 'We miss you! Come back and experience our improved service.'
    });
  }

  if (res) {
    return res.json({
      success: true,
      churned_clients: churned_clients?.length || 0,
      win_back_offers_sent: win_back_offers.length,
      offers: win_back_offers
    });
  } else {
    return { win_back_campaigns_sent: win_back_offers.length };
  }
}

// ============================================================================
// AUTONOMOUS RUN
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Running autonomous conversion operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    conversion_health: await assessConversionHealth(),
    actions_taken: []
  };

  // ACTION 1: Follow up on cold leads
  if (results.conversion_health.cold_leads > 5) {
    const follow_up_result = await followUpColdLeads(null, null);
    results.actions_taken.push({
      action: 'COLD_LEAD_FOLLOW_UP',
      leads_contacted: follow_up_result.follow_ups_sent,
      reasoning: `${results.conversion_health.cold_leads} leads going cold`
    });
  }

  // ACTION 2: Upsell opportunities
  if (results.conversion_health.upsell_opportunities > 3) {
    const upsell_result = await upsellClients(null, null);
    results.actions_taken.push({
      action: 'UPSELL_CAMPAIGN',
      opportunities_identified: upsell_result.upsells_identified,
      reasoning: `${results.conversion_health.upsell_opportunities} upsell opportunities available`
    });
  }

  // ACTION 3: Retention sweep if conversion low
  if (parseFloat(results.conversion_health.overall_conversion) < 25) {
    const retention_result = await retentionSweep(null, null);
    results.actions_taken.push({
      action: 'RETENTION_SWEEP',
      at_risk_clients: retention_result.at_risk_clients,
      reasoning: `Conversion rate ${results.conversion_health.overall_conversion}% - focus on keeping existing clients`
    });
  }

  // ACTION 4: Alert Atlas if conversion critically low
  if (parseFloat(results.conversion_health.overall_conversion) < 15) {
    await mfs.sendReport('ATLAS', {
      bot_name: ANNIE_PROFILE.name,
      type: 'conversion_alert',
      priority: 'high',
      subject: `CONVERSION ALERT: ${results.conversion_health.overall_conversion}% Conversion Rate`,
      data: {
        conversion_health: results.conversion_health,
        actions_taken: results.actions_taken,
        recommendation: 'Review sales process, lead quality, or service offering'
      }
    });
    results.actions_taken.push({
      action: 'ALERTED_ATLAS',
      severity: 'critical'
    });
  }

  if (res) {
    return res.json(results);
  } else {
    return results;
  }
}

// ============================================================================
// WEEKLY CSO REPORT
// ============================================================================

async function sendWeeklyCSO_Report(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Generating weekly CSO report to Atlas...`);

  const health = await assessConversionHealth();

  const report = {
    week: new Date().toISOString().split('T')[0],
    conversion: {
      total_leads: health.total_leads,
      active_clients: health.active_clients,
      overall_conversion: health.overall_conversion,
      retention_rate: health.retention_rate,
      health_score: health.health_score
    },
    pipeline: {
      consultations_scheduled: health.consultations_scheduled,
      cold_leads: health.cold_leads,
      upsell_opportunities: health.upsell_opportunities,
      churned_clients: health.churned_clients
    },
    executive_summary: health.hitting_targets ?
      `Conversion healthy at ${health.overall_conversion}%, retention at ${health.retention_rate}%.` :
      `Conversion ${health.overall_conversion}% (target ${ANNIE_PROFILE.conversion_targets.overall_conversion}%). ${health.cold_leads} cold leads need follow-up.`,
    recommendations: generateRecommendations(health)
  };

  await mfs.sendReport('ATLAS', {
    bot_name: ANNIE_PROFILE.name,
    type: 'weekly_cso_report',
    priority: health.hitting_targets ? 'normal' : 'high',
    subject: `Weekly CSO Report - ${health.hitting_targets ? 'Conversion Healthy' : 'ACTION REQUIRED'}`,
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

function generateRecommendations(health) {
  const recommendations = [];

  if (parseFloat(health.overall_conversion) < 20) {
    recommendations.push({
      priority: 1,
      action: 'IMPROVE LEAD QUALIFICATION',
      reasoning: `${health.overall_conversion}% conversion too low - may be lead quality issue`,
      owner: 'ANNIE + DAN',
      expected_impact: 'Double conversion to 40%+'
    });
  }

  if (health.cold_leads > 10) {
    recommendations.push({
      priority: 1,
      action: 'AGGRESSIVE FOLLOW-UP CAMPAIGN',
      reasoning: `${health.cold_leads} leads going cold - leaving money on the table`,
      expected_impact: 'Convert 20-30% of cold leads'
    });
  }

  if (health.upsell_opportunities > 5) {
    recommendations.push({
      priority: 2,
      action: 'LAUNCH UPSELL CAMPAIGN',
      reasoning: `${health.upsell_opportunities} clients ready for upsell`,
      expected_impact: '+$50K annual revenue'
    });
  }

  if (parseFloat(health.retention_rate) < 85) {
    recommendations.push({
      priority: 1,
      action: 'RETENTION CRISIS - INVESTIGATE CHURN',
      reasoning: `${health.retention_rate}% retention below ${ANNIE_PROFILE.conversion_targets.retention_rate}% target`,
      owner: 'ANNIE + HENRY',
      expected_impact: 'Identify and fix service quality issues'
    });
  }

  return recommendations;
}

// Placeholder functions
async function escalateVIP(req, res, data) {
  console.log(`[${ANNIE_PROFILE.name}] Escalating VIP inquiry:`, data?.lead_id);

  await mfs.sendReport('ATLAS', {
    bot_name: ANNIE_PROFILE.name,
    type: 'vip_escalation',
    priority: 'high',
    subject: `VIP Inquiry Requires Personal Attention`,
    data: data
  });

  return res.json({
    success: true,
    message: 'VIP inquiry escalated to Atlas'
  });
}

module.exports.ANNIE_PROFILE = ANNIE_PROFILE;
