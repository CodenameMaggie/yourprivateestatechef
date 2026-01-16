// ============================================================================
// DAVE - AUTONOMOUS CFO
// 100% ACCOUNTABLE FOR $100M REVENUE GOAL
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const DAVE_PROFILE = {
  name: 'DAVE',
  title: 'Chief Financial Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: '$100M revenue in 5 years',
  personality: 'Data-driven, decisive, relentless about hitting targets',
  decision_authority: [
    'Pricing adjustments (±20% from base)',
    'Payment terms (within 90 days)',
    'Collection actions',
    'Revenue forecasts',
    'Budget allocation recommendations to Atlas'
  ],
  revenue_goal: {
    total: 100000000, // $100M
    timeframe: '5 years',
    start_date: '2026-01-16', // TODAY
    year_1: 5000000,   // $5M
    year_2: 12000000,  // $12M
    year_3: 20000000,  // $20M
    year_4: 30000000,  // $30M
    year_5: 33000000   // $33M
  },
  actions: [
    'status',
    'revenue_health',
    'gap_analysis',
    'take_action',
    'forecast',
    'pricing_strategy',
    'collection_sweep',
    'ltv_analysis',
    'weekly_cfo_report',
    'autonomous_run'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'revenue_health':
        return await assessRevenueHealth(req, res);

      case 'gap_analysis':
        return await analyzeRevenueGap(req, res);

      case 'take_action':
        return await takeAutonomousAction(req, res, data);

      case 'forecast':
        return await forecastRevenue(req, res);

      case 'pricing_strategy':
        return await optimizePricing(req, res);

      case 'collection_sweep':
        return await runCollectionSweep(req, res);

      case 'ltv_analysis':
        return await calculateCustomerLTV(req, res);

      case 'weekly_cfo_report':
        return await sendWeeklyCFOReport(req, res);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: DAVE_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${DAVE_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS - Where We Stand
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${DAVE_PROFILE.name}] Checking revenue status...`);

  const health = await assessRevenueHealth();
  const gap = await analyzeRevenueGap();

  return res.json({
    cfo: DAVE_PROFILE.name,
    accountability: DAVE_PROFILE.accountability,
    revenue_goal: DAVE_PROFILE.revenue_goal,
    current_health: health,
    gap_analysis: gap,
    decision_authority: DAVE_PROFILE.decision_authority,
    autonomous: true,
    message: gap.behind_target ?
      `We're $${gap.gap_amount.toLocaleString()} behind target. Taking action.` :
      'On track. Monitoring closely.'
  });
}

// ============================================================================
// REVENUE HEALTH ASSESSMENT
// ============================================================================

async function assessRevenueHealth() {
  // Get all invoices
  const { data: invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get all engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Calculate revenue
  let revenue_to_date = 0;
  let pending_revenue = 0;
  let overdue_revenue = 0;

  invoices?.forEach(inv => {
    const amount = parseFloat(inv.total || 0);
    if (inv.status === 'paid') revenue_to_date += amount;
    else if (inv.status === 'sent') pending_revenue += amount;
    else if (inv.status === 'overdue') overdue_revenue += amount;
  });

  // Monthly recurring revenue (MRR)
  const active_monthly = engagements?.filter(e =>
    e.status === 'active' && e.service_type === 'monthly'
  ).length || 0;

  const mrr = active_monthly * 1500; // $1,500 avg monthly service

  return {
    revenue_to_date: revenue_to_date,
    mrr: mrr,
    arr: mrr * 12, // Annual recurring revenue
    pending: pending_revenue,
    overdue: overdue_revenue,
    total_invoices: invoices?.length || 0,
    active_engagements: engagements?.filter(e => e.status === 'active').length || 0,
    health_score: calculateHealthScore(revenue_to_date, mrr, overdue_revenue)
  };
}

function calculateHealthScore(revenue, mrr, overdue) {
  let score = 50; // Base score

  // Revenue progress
  if (revenue > 100000) score += 20;
  else if (revenue > 50000) score += 10;

  // MRR growth
  if (mrr > 50000) score += 20;
  else if (mrr > 25000) score += 10;
  else if (mrr > 10000) score += 5;

  // Overdue penalty
  if (overdue > 50000) score -= 30;
  else if (overdue > 25000) score -= 20;
  else if (overdue > 10000) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// GAP ANALYSIS - Are We On Track?
// ============================================================================

async function analyzeRevenueGap() {
  const health = await assessRevenueHealth();

  // Calculate where we should be
  const startDate = new Date(DAVE_PROFILE.revenue_goal.start_date);
  const today = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 5);

  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const daysPassed = (today - startDate) / (1000 * 60 * 60 * 24);
  const percentComplete = (daysPassed / totalDays) * 100;

  const expectedRevenue = DAVE_PROFILE.revenue_goal.total * (percentComplete / 100);
  const actualRevenue = health.revenue_to_date;
  const gap = expectedRevenue - actualRevenue;

  // Days remaining
  const daysRemaining = totalDays - daysPassed;
  const dailyRevenueNeeded = (DAVE_PROFILE.revenue_goal.total - actualRevenue) / daysRemaining;

  // Determine severity
  let severity = 'on_track';
  let action_required = false;

  if (gap > 10000000) {
    severity = 'critical';
    action_required = true;
  } else if (gap > 5000000) {
    severity = 'urgent';
    action_required = true;
  } else if (gap > 1000000) {
    severity = 'warning';
    action_required = true;
  }

  return {
    target: DAVE_PROFILE.revenue_goal.total,
    actual: actualRevenue,
    expected_at_this_point: expectedRevenue,
    gap_amount: gap,
    gap_percentage: ((gap / expectedRevenue) * 100).toFixed(1),
    behind_target: gap > 0,
    severity: severity,
    action_required: action_required,
    daily_revenue_needed: dailyRevenueNeeded,
    days_remaining: Math.floor(daysRemaining),
    current_run_rate: health.arr,
    run_rate_vs_needed: health.arr - (DAVE_PROFILE.revenue_goal.total / 5),
    recommendations: generateRecommendations(gap, health)
  };
}

function generateRecommendations(gap, health) {
  const recommendations = [];

  if (gap > 5000000) {
    recommendations.push({
      priority: 1,
      action: 'DEMAND MORE LEADS FROM DAN',
      reasoning: `$${(gap / 1000000).toFixed(1)}M behind - need 10x lead generation`,
      owner: 'DAN (CMO)',
      timeline: 'Immediate'
    });
  }

  if (health.overdue > 10000) {
    recommendations.push({
      priority: 2,
      action: 'RUN COLLECTION SWEEP',
      reasoning: `$${health.overdue.toLocaleString()} overdue - collect immediately`,
      owner: 'DAVE (CFO)',
      timeline: 'This week'
    });
  }

  if (health.mrr < 50000) {
    recommendations.push({
      priority: 1,
      action: 'INCREASE MONTHLY RECURRING REVENUE',
      reasoning: 'MRR too low for $100M goal - need more monthly clients',
      owner: 'ANNIE (CSO)',
      timeline: 'This month'
    });
  }

  if (health.active_engagements < 10) {
    recommendations.push({
      priority: 1,
      action: 'ACCELERATE CLIENT ONBOARDING',
      reasoning: 'Not enough active clients - pipeline conversion too slow',
      owner: 'ANNIE (CSO) + HENRY (COO)',
      timeline: 'This week'
    });
  }

  return recommendations;
}

// ============================================================================
// TAKE AUTONOMOUS ACTION
// ============================================================================

async function takeAutonomousAction(req, res, data) {
  console.log(`[${DAVE_PROFILE.name}] Taking autonomous action...`);

  const actions_taken = [];
  const gap = await analyzeRevenueGap();

  // ACTION 1: Run collection sweep if overdue > $5K
  const health = await assessRevenueHealth();
  if (health.overdue > 5000) {
    const collection_result = await runCollectionSweep();
    actions_taken.push({
      action: 'collection_sweep',
      result: collection_result,
      reasoning: `$${health.overdue.toLocaleString()} overdue`
    });
  }

  // ACTION 2: Alert Atlas if severely behind target
  if (gap.severity === 'critical' || gap.severity === 'urgent') {
    await mfs.sendReport('ATLAS', {
      bot_name: DAVE_PROFILE.name,
      type: 'revenue_alert',
      priority: 'high',
      subject: `REVENUE ALERT: $${(gap.gap_amount / 1000000).toFixed(1)}M Behind Target`,
      data: {
        gap_analysis: gap,
        actions_taken: actions_taken,
        recommendations: gap.recommendations
      }
    });

    actions_taken.push({
      action: 'alert_atlas',
      severity: gap.severity,
      message: 'Executive intervention required'
    });
  }

  // ACTION 3: Demand more leads from DAN if pipeline weak
  if (gap.gap_amount > 1000000 && health.active_engagements < 20) {
    // TODO: Add cross-bot communication to demand leads from DAN
    actions_taken.push({
      action: 'demand_leads_from_dan',
      status: 'queued',
      message: 'Pipeline too weak for revenue target'
    });
  }

  return {
    success: true,
    cfo: DAVE_PROFILE.name,
    autonomous: true,
    actions_taken: actions_taken,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// COLLECTION SWEEP - Get Overdue Money
// ============================================================================

async function runCollectionSweep() {
  console.log(`[${DAVE_PROFILE.name}] Running collection sweep...`);

  const { data: overdue_invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('*, household:ypec_households(*)')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'overdue');

  const actions = [];

  for (const invoice of overdue_invoices || []) {
    const daysOverdue = Math.floor(
      (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
    );

    // Auto-action based on days overdue
    if (daysOverdue > 60) {
      actions.push({
        invoice_id: invoice.id,
        action: 'ESCALATE_TO_COLLECTIONS',
        days_overdue: daysOverdue,
        amount: invoice.total
      });
    } else if (daysOverdue > 30) {
      actions.push({
        invoice_id: invoice.id,
        action: 'FINAL_NOTICE',
        days_overdue: daysOverdue,
        amount: invoice.total
      });
    } else if (daysOverdue > 14) {
      actions.push({
        invoice_id: invoice.id,
        action: 'PAYMENT_REMINDER',
        days_overdue: daysOverdue,
        amount: invoice.total
      });
    }
  }

  return {
    success: true,
    overdue_count: overdue_invoices?.length || 0,
    total_overdue: overdue_invoices?.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0) || 0,
    actions_queued: actions.length,
    actions: actions
  };
}

// ============================================================================
// FORECAST REVENUE
// ============================================================================

async function forecastRevenue() {
  const health = await assessRevenueHealth();

  // Simple forecast based on current MRR
  const monthly_projection = health.mrr;
  const annual_projection = monthly_projection * 12;

  // 5-year projection assuming 20% annual growth
  const year_1_forecast = annual_projection;
  const year_2_forecast = year_1_forecast * 1.2;
  const year_3_forecast = year_2_forecast * 1.2;
  const year_4_forecast = year_3_forecast * 1.2;
  const year_5_forecast = year_4_forecast * 1.2;

  const total_5_year_forecast = year_1_forecast + year_2_forecast + year_3_forecast + year_4_forecast + year_5_forecast;

  return {
    current_mrr: health.mrr,
    current_arr: health.arr,
    forecast: {
      year_1: year_1_forecast,
      year_2: year_2_forecast,
      year_3: year_3_forecast,
      year_4: year_4_forecast,
      year_5: year_5_forecast,
      total: total_5_year_forecast
    },
    vs_target: {
      total_gap: DAVE_PROFILE.revenue_goal.total - total_5_year_forecast,
      will_hit_target: total_5_year_forecast >= DAVE_PROFILE.revenue_goal.total
    },
    assumptions: '20% annual growth, current MRR maintained'
  };
}

// ============================================================================
// WEEKLY CFO REPORT TO ATLAS
// ============================================================================

async function sendWeeklyCFOReport() {
  console.log(`[${DAVE_PROFILE.name}] Generating weekly CFO report to Atlas...`);

  const health = await assessRevenueHealth();
  const gap = await analyzeRevenueGap();
  const forecast = await forecastRevenue();

  const report = {
    week: new Date().toISOString().split('T')[0],
    revenue: {
      to_date: health.revenue_to_date,
      mrr: health.mrr,
      arr: health.arr,
      health_score: health.health_score
    },
    gap_analysis: gap,
    forecast: forecast,
    executive_summary: gap.behind_target ?
      `We are $${(gap.gap_amount / 1000000).toFixed(2)}M behind target. ${gap.severity.toUpperCase()} action required.` :
      `On track to hit $100M goal. Current ARR: $${(health.arr / 1000000).toFixed(2)}M.`,
    recommendations: gap.recommendations
  };

  // Send to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: DAVE_PROFILE.name,
    type: 'weekly_cfo_report',
    priority: gap.action_required ? 'high' : 'normal',
    subject: `Weekly CFO Report - ${gap.behind_target ? 'ACTION REQUIRED' : 'On Track'}`,
    data: report
  });

  return report;
}

// ============================================================================
// AUTONOMOUS RUN - Daily Operations
// ============================================================================

async function autonomousRun() {
  console.log(`[${DAVE_PROFILE.name}] Running autonomous daily operations...`);

  const results = {
    health_check: await assessRevenueHealth(),
    gap_analysis: await analyzeRevenueGap(),
    actions_taken: []
  };

  // Take autonomous actions if needed
  if (results.gap_analysis.action_required) {
    const action_result = await takeAutonomousAction(null, null, {});
    results.actions_taken = action_result.actions_taken || [];
  }

  // Run collection sweep weekly
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 1) { // Monday
    results.collection_sweep = await runCollectionSweep();
  }

  return results;
}

module.exports.DAVE_PROFILE = DAVE_PROFILE;
