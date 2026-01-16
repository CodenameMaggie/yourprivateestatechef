// ============================================================================
// ATLAS - AUTONOMOUS CEO
// "THE BRAIN" - Strategic Decision-Maker for $100M Goal
// Reports to: Board of Directors
// Accountability: Overall company success, strategic direction, executive performance
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const ATLAS_PROFILE = {
  name: 'ATLAS',
  title: 'Chief Executive Officer',
  reports_to: 'Board of Directors',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Strategic decision-making, executive accountability, $100M revenue goal oversight',
  personality: 'Decisive, data-driven, holds people accountable, makes tough calls',
  decision_authority: [
    'Hire/fire executives (requires board approval)',
    'Approve/reject expansion plans',
    'Reallocate budgets between departments',
    'Set strategic priorities',
    'Approve pricing changes > 20%',
    'Authorize new market entry',
    'Approve partnerships > $100K',
    'Issue executive directives'
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
  strategic_pillars: [
    'Revenue Growth',
    'Operational Excellence',
    'Market Expansion',
    'Talent Acquisition',
    'Client Satisfaction'
  ],
  actions: [
    'status',
    'dashboard',
    'strategic_review',
    'evaluate_executives',
    'make_decision',
    'reallocate_resources',
    'issue_directive',
    'approve_plan',
    'hold_accountable',
    'autonomous_run',
    'weekly_strategic_review'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'dashboard':
        return await getCEODashboard(req, res);

      case 'strategic_review':
        return await strategicReview(req, res);

      case 'evaluate_executives':
        return await evaluateExecutives(req, res);

      case 'make_decision':
        return await makeDecision(req, res, data);

      case 'reallocate_resources':
        return await reallocateResources(req, res, data);

      case 'issue_directive':
        return await issueDirective(req, res, data);

      case 'approve_plan':
        return await approvePlan(req, res, data);

      case 'hold_accountable':
        return await holdAccountable(req, res, data);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      case 'weekly_strategic_review':
        return await weeklyStrategicReview(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: ATLAS_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${ATLAS_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS - CEO Overview
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${ATLAS_PROFILE.name}] CEO status check...`);

  const dashboard = await generateCEODashboard();
  const executive_performance = await evaluateExecutives();

  return res.json({
    ceo: ATLAS_PROFILE.name,
    role: 'THE BRAIN',
    accountability: 'Overall company success & $100M revenue goal',
    revenue_goal: ATLAS_PROFILE.revenue_goal,
    dashboard: dashboard,
    executive_performance: executive_performance,
    decision_authority: ATLAS_PROFILE.decision_authority,
    autonomous: true,
    message: dashboard.on_track ?
      'Company on track. Monitoring all departments.' :
      'Performance gaps detected. Taking action.'
  });
}

// ============================================================================
// CEO DASHBOARD - Real-Time Executive View
// ============================================================================

async function getCEODashboard(req, res) {
  const dashboard = await generateCEODashboard();
  return res.json(dashboard);
}

async function generateCEODashboard() {
  // Get metrics from all departments
  const revenue_health = await getRevenueHealth();
  const operations_health = await getOperationsHealth();
  const marketing_health = await getMarketingHealth();
  const service_health = await getServiceHealth();
  const talent_health = await getTalentHealth();

  // Calculate overall company health
  const department_scores = {
    finance: calculateDepartmentScore(revenue_health),
    operations: calculateDepartmentScore(operations_health),
    marketing: calculateDepartmentScore(marketing_health),
    service: calculateDepartmentScore(service_health),
    talent: calculateDepartmentScore(talent_health)
  };

  const overall_health = Object.values(department_scores).reduce((a, b) => a + b, 0) / 5;

  // Revenue gap analysis
  const gap = await analyzeRevenueGap();

  // Strategic priorities
  const priorities = await determineStrategicPriorities(gap, department_scores);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    overall_health: Math.round(overall_health),
    revenue_status: {
      target: ATLAS_PROFILE.revenue_goal.total,
      actual: revenue_health.revenue_to_date,
      gap: gap.gap_amount,
      on_track: !gap.behind_target,
      severity: gap.severity
    },
    departments: {
      finance: { score: department_scores.finance, ...revenue_health },
      operations: { score: department_scores.operations, ...operations_health },
      marketing: { score: department_scores.marketing, ...marketing_health },
      service: { score: department_scores.service, ...service_health },
      talent: { score: department_scores.talent, ...talent_health }
    },
    strategic_priorities: priorities,
    decisions_pending: await getDecisionsPending(),
    on_track: !gap.behind_target && overall_health > 70
  };
}

// ============================================================================
// STRATEGIC REVIEW - Daily Analysis & Decision-Making
// ============================================================================

async function strategicReview(req, res) {
  console.log(`[${ATLAS_PROFILE.name}] Running strategic review...`);

  const dashboard = await generateCEODashboard();
  const executive_performance = await evaluateExecutives();
  const decisions_made = [];

  // DECISION 1: If revenue gap critical, demand action from executives
  if (dashboard.revenue_status.severity === 'critical') {
    const decision = await makeDecision(null, null, {
      type: 'DEMAND_PERFORMANCE',
      target: 'ALL_EXECUTIVES',
      reasoning: `$${(dashboard.revenue_status.gap / 1000000).toFixed(1)}M behind target`
    });
    decisions_made.push(decision);
  }

  // DECISION 2: If marketing underperforming, reallocate to paid ads
  if (executive_performance.dan?.performance_score < 50) {
    const decision = await makeDecision(null, null, {
      type: 'REALLOCATE_BUDGET',
      from: 'operations',
      to: 'marketing',
      amount: 50000,
      reasoning: 'Marketing lead generation too slow'
    });
    decisions_made.push(decision);
  }

  // DECISION 3: If talent shortage, authorize recruitment spend
  if (dashboard.departments.talent.available_chefs < 5) {
    const decision = await makeDecision(null, null, {
      type: 'AUTHORIZE_SPEND',
      department: 'talent',
      amount: 25000,
      purpose: 'Emergency chef recruitment campaign',
      reasoning: 'Critical chef shortage blocking revenue'
    });
    decisions_made.push(decision);
  }

  return res.json({
    success: true,
    ceo: ATLAS_PROFILE.name,
    autonomous: true,
    dashboard: dashboard,
    executive_performance: executive_performance,
    decisions_made: decisions_made,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EVALUATE EXECUTIVES - Performance Scorecard
// ============================================================================

async function evaluateExecutives() {
  const revenue = await getRevenueHealth();
  const operations = await getOperationsHealth();
  const marketing = await getMarketingHealth();
  const service = await getServiceHealth();
  const talent = await getTalentHealth();

  // DAVE (CFO) - 100% Accountable for Revenue
  const dave_performance = {
    executive: 'DAVE',
    title: 'CFO',
    accountability: '$100M revenue in 5 years',
    performance_score: calculateExecutiveScore({
      revenue_to_date: revenue.revenue_to_date,
      mrr: revenue.mrr,
      overdue: revenue.overdue,
      target: 5000000 // Year 1 target
    }),
    kpis: {
      revenue_to_date: revenue.revenue_to_date,
      mrr: revenue.mrr,
      arr: revenue.arr,
      overdue: revenue.overdue
    },
    status: revenue.revenue_to_date > 100000 ? 'exceeding' : revenue.revenue_to_date > 10000 ? 'on_track' : 'needs_improvement',
    actions_taken: 'Monitoring invoices, running collection sweeps'
  };

  // HENRY (COO) - Operations & Capacity
  const henry_performance = {
    executive: 'HENRY',
    title: 'COO',
    accountability: 'Operational excellence, capacity management',
    performance_score: calculateExecutiveScore({
      active_engagements: operations.active_engagements,
      upcoming_events: operations.upcoming_events,
      target: 20 // Target 20 active engagements
    }),
    kpis: {
      active_engagements: operations.active_engagements,
      upcoming_events: operations.upcoming_events,
      total_events: operations.total_events
    },
    status: operations.active_engagements > 15 ? 'exceeding' : operations.active_engagements > 5 ? 'on_track' : 'needs_improvement',
    actions_taken: 'Daily summaries, event monitoring'
  };

  // DAN (CMO) - Marketing & Growth
  const dan_performance = {
    executive: 'DAN',
    title: 'CMO',
    accountability: 'Lead generation, growth, $100M pipeline',
    performance_score: calculateExecutiveScore({
      total_leads: marketing.total_leads,
      qualified_leads: marketing.qualified_leads,
      target: 100 // Target 100 leads for pipeline
    }),
    kpis: {
      total_leads: marketing.total_leads,
      qualified_leads: marketing.qualified_leads,
      campaigns_sent: marketing.campaigns_sent,
      conversion_rate: marketing.conversion_rate || 0
    },
    status: marketing.total_leads > 50 ? 'on_track' : 'needs_improvement',
    actions_taken: 'Culinary school outreach, lead scraping'
  };

  // ANNIE (CSO) - Customer Support & Conversion
  const annie_performance = {
    executive: 'ANNIE',
    title: 'CSO',
    accountability: 'Client conversion, satisfaction, retention',
    performance_score: calculateExecutiveScore({
      active_clients: service.active_clients,
      consultations: service.scheduled_consultations,
      target: 10 // Target 10 active clients
    }),
    kpis: {
      active_clients: service.active_clients,
      inquiries: service.total_inquiries,
      scheduled_consultations: service.scheduled_consultations,
      conversion_rate: service.conversion_rate || 0
    },
    status: service.active_clients > 5 ? 'on_track' : 'needs_improvement',
    actions_taken: 'Inquiry processing, consultation scheduling'
  };

  // JORDAN (Legal) - Compliance
  const jordan_performance = {
    executive: 'JORDAN',
    title: 'General Counsel',
    accountability: 'Legal compliance, risk management',
    performance_score: 75, // Assume good for now
    kpis: {
      compliance_status: 'Monitoring',
      contracts_reviewed: 0,
      legal_risks: 0
    },
    status: 'on_track',
    actions_taken: 'Compliance monitoring, legal oversight'
  };

  return {
    dave: dave_performance,
    henry: henry_performance,
    dan: dan_performance,
    annie: annie_performance,
    jordan: jordan_performance,
    overall_executive_health: Math.round(
      (dave_performance.performance_score +
       henry_performance.performance_score +
       dan_performance.performance_score +
       annie_performance.performance_score +
       jordan_performance.performance_score) / 5
    )
  };
}

function calculateExecutiveScore(metrics) {
  let score = 50; // Base score

  if (metrics.revenue_to_date !== undefined) {
    // CFO scoring
    if (metrics.revenue_to_date > 500000) score += 30;
    else if (metrics.revenue_to_date > 100000) score += 20;
    else if (metrics.revenue_to_date > 10000) score += 10;

    if (metrics.mrr > 50000) score += 20;
    else if (metrics.mrr > 10000) score += 10;

    if (metrics.overdue > 10000) score -= 20;
  }

  if (metrics.active_engagements !== undefined) {
    // COO scoring
    if (metrics.active_engagements > 20) score += 30;
    else if (metrics.active_engagements > 10) score += 20;
    else if (metrics.active_engagements > 5) score += 10;
  }

  if (metrics.total_leads !== undefined) {
    // CMO scoring
    if (metrics.total_leads > 100) score += 30;
    else if (metrics.total_leads > 50) score += 20;
    else if (metrics.total_leads > 20) score += 10;

    if (metrics.qualified_leads > 20) score += 10;
  }

  if (metrics.active_clients !== undefined) {
    // CSO scoring
    if (metrics.active_clients > 20) score += 30;
    else if (metrics.active_clients > 10) score += 20;
    else if (metrics.active_clients > 5) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// MAKE DECISION - Autonomous Decision-Making
// ============================================================================

async function makeDecision(req, res, data) {
  console.log(`[${ATLAS_PROFILE.name}] Making decision:`, data?.type);

  const decision = {
    decision_id: `DEC-${Date.now()}`,
    ceo: ATLAS_PROFILE.name,
    timestamp: new Date().toISOString(),
    type: data?.type || 'STRATEGIC',
    decision: null,
    reasoning: data?.reasoning || 'Strategic necessity',
    impact: null,
    status: 'executed'
  };

  switch (data?.type) {
    case 'DEMAND_PERFORMANCE':
      decision.decision = `EXECUTIVE DIRECTIVE: All C-suite must submit action plans to close revenue gap within 24 hours`;
      decision.impact = 'high';
      decision.action_items = [
        { executive: 'DAVE', directive: 'Accelerate collections, forecast recovery plan' },
        { executive: 'DAN', directive: '10x lead generation - launch paid campaigns immediately' },
        { executive: 'HENRY', directive: 'Increase chef utilization to 80%+' },
        { executive: 'ANNIE', directive: 'Convert 50%+ of qualified leads this week' }
      ];
      break;

    case 'REALLOCATE_BUDGET':
      decision.decision = `BUDGET REALLOCATION: Transfer $${data.amount.toLocaleString()} from ${data.from} to ${data.to}`;
      decision.impact = 'medium';
      decision.details = {
        from_department: data.from,
        to_department: data.to,
        amount: data.amount,
        effective_immediately: true
      };
      break;

    case 'AUTHORIZE_SPEND':
      decision.decision = `AUTHORIZED: $${data.amount.toLocaleString()} for ${data.purpose}`;
      decision.impact = 'medium';
      decision.details = {
        department: data.department,
        amount: data.amount,
        purpose: data.purpose,
        approved: true
      };
      break;

    case 'APPROVE_EXPANSION':
      decision.decision = `EXPANSION APPROVED: ${data.market} - Budget $${data.budget.toLocaleString()}`;
      decision.impact = 'high';
      decision.details = {
        market: data.market,
        budget: data.budget,
        timeline: data.timeline,
        owner: data.owner
      };
      break;

    case 'REJECT_PLAN':
      decision.decision = `PLAN REJECTED: ${data.plan_name}`;
      decision.reasoning = data.reasoning || 'Does not align with strategic priorities';
      decision.impact = 'low';
      break;

    default:
      decision.decision = 'General strategic decision';
      decision.impact = 'low';
  }

  // Log decision to database
  await logDecision(decision);

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
// HOLD ACCOUNTABLE - Executive Performance Management
// ============================================================================

async function holdAccountable(req, res, data) {
  console.log(`[${ATLAS_PROFILE.name}] Holding ${data?.executive} accountable...`);

  const executive_performance = await evaluateExecutives();
  const executive = executive_performance[data?.executive?.toLowerCase()];

  if (!executive) {
    return res.json({ error: 'Executive not found' });
  }

  const accountability_action = {
    executive: executive.executive,
    performance_score: executive.performance_score,
    status: executive.status,
    action: null,
    message: null
  };

  if (executive.performance_score < 40) {
    accountability_action.action = 'PERFORMANCE_IMPROVEMENT_PLAN';
    accountability_action.message = `${executive.executive}: Performance below acceptable. 30-day improvement plan required.`;
    accountability_action.requirements = [
      'Submit weekly progress reports to Atlas',
      'Hit minimum KPI targets within 30 days',
      'Daily standups with Atlas'
    ];
  } else if (executive.performance_score < 60) {
    accountability_action.action = 'WARNING';
    accountability_action.message = `${executive.executive}: Performance needs improvement. Focus on core KPIs.`;
  } else if (executive.performance_score > 80) {
    accountability_action.action = 'COMMENDATION';
    accountability_action.message = `${executive.executive}: Excellent performance. Keep it up.`;
  } else {
    accountability_action.action = 'MONITOR';
    accountability_action.message = `${executive.executive}: On track. Continue current trajectory.`;
  }

  // Send accountability message via MFS
  await mfs.sendReport(executive.executive.toUpperCase(), {
    bot_name: ATLAS_PROFILE.name,
    type: 'accountability',
    priority: accountability_action.action === 'PERFORMANCE_IMPROVEMENT_PLAN' ? 'high' : 'normal',
    subject: `CEO Accountability Check - ${accountability_action.action}`,
    data: accountability_action
  });

  return res.json({
    success: true,
    accountability: accountability_action
  });
}

// ============================================================================
// AUTONOMOUS RUN - Daily CEO Operations
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${ATLAS_PROFILE.name}] Running autonomous CEO operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    dashboard: await generateCEODashboard(),
    executive_performance: await evaluateExecutives(),
    decisions_made: [],
    actions_taken: []
  };

  // ACTION 1: If revenue critically behind, demand performance
  const gap = await analyzeRevenueGap();
  if (gap.severity === 'critical' || gap.severity === 'urgent') {
    const decision = await makeDecision(null, null, {
      type: 'DEMAND_PERFORMANCE',
      reasoning: `$${(gap.gap_amount / 1000000).toFixed(1)}M behind target - executive action required`
    });
    results.decisions_made.push(decision);
  }

  // ACTION 2: Hold underperforming executives accountable
  for (const [exec_name, exec_data] of Object.entries(results.executive_performance)) {
    if (exec_data.performance_score && exec_data.performance_score < 50) {
      results.actions_taken.push({
        action: 'ACCOUNTABILITY_CHECK',
        executive: exec_data.executive,
        score: exec_data.performance_score,
        message: 'Performance review initiated'
      });
    }
  }

  // ACTION 3: If marketing leads too low, authorize emergency spend
  const marketing = await getMarketingHealth();
  if (marketing.total_leads < 20 && gap.gap_amount > 1000000) {
    const decision = await makeDecision(null, null, {
      type: 'AUTHORIZE_SPEND',
      department: 'marketing',
      amount: 50000,
      purpose: 'Emergency paid ad campaign',
      reasoning: 'Lead pipeline critically low for revenue target'
    });
    results.decisions_made.push(decision);
  }

  if (res) {
    return res.json(results);
  } else {
    return results;
  }
}

// ============================================================================
// WEEKLY STRATEGIC REVIEW - Monday Morning CEO Report
// ============================================================================

async function weeklyStrategicReview(req, res) {
  console.log(`[${ATLAS_PROFILE.name}] Weekly strategic review...`);

  const dashboard = await generateCEODashboard();
  const executive_performance = await evaluateExecutives();
  const gap = await analyzeRevenueGap();

  const report = {
    week: new Date().toISOString().split('T')[0],
    executive_summary: gap.behind_target ?
      `Company ${gap.gap_amount > 5000000 ? 'CRITICALLY' : 'SIGNIFICANTLY'} behind $100M target. Immediate action required.` :
      'Company on track for $100M goal. Maintaining momentum.',
    revenue: {
      target: ATLAS_PROFILE.revenue_goal.total,
      actual: dashboard.revenue_status.actual,
      gap: gap.gap_amount,
      severity: gap.severity
    },
    executive_performance: executive_performance,
    strategic_decisions_this_week: await getRecentDecisions(),
    top_priorities: await determineStrategicPriorities(gap, dashboard.departments),
    board_message: gap.behind_target ?
      'Revenue gaps detected. CEO taking corrective action. Monitoring closely.' :
      'Business progressing toward $100M goal. No board intervention required.'
  };

  // Send to board (via MFS to central command)
  // await mfs.sendReport('BOARD', {...});

  if (res) {
    return res.json({
      success: true,
      report: report
    });
  } else {
    return report;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getRevenueHealth() {
  const { data: invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  let revenue_to_date = 0;
  let pending_revenue = 0;
  let overdue_revenue = 0;

  invoices?.forEach(inv => {
    const amount = parseFloat(inv.total || 0);
    if (inv.status === 'paid') revenue_to_date += amount;
    else if (inv.status === 'sent') pending_revenue += amount;
    else if (inv.status === 'overdue') overdue_revenue += amount;
  });

  const active_monthly = engagements?.filter(e =>
    e.status === 'active' && e.service_type === 'monthly'
  ).length || 0;

  const mrr = active_monthly * 1500; // $1,500 avg monthly service

  return {
    revenue_to_date,
    mrr,
    arr: mrr * 12,
    pending: pending_revenue,
    overdue: overdue_revenue,
    active_engagements: engagements?.filter(e => e.status === 'active').length || 0
  };
}

async function getOperationsHealth() {
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: events } = await getSupabase()
    .from(TABLES.EVENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  return {
    total_engagements: engagements?.length || 0,
    active_engagements: engagements?.filter(e => e.status === 'active').length || 0,
    total_events: events?.length || 0,
    upcoming_events: events?.filter(e => new Date(e.event_date) > new Date()).length || 0
  };
}

async function getMarketingHealth() {
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: campaigns } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  return {
    total_leads: leads?.length || 0,
    qualified_leads: leads?.filter(l => l.status === 'qualified').length || 0,
    campaigns_sent: campaigns?.filter(c => c.status === 'sent').length || 0,
    campaigns_responded: campaigns?.filter(c => c.status === 'responded').length || 0,
    conversion_rate: leads?.length > 0 ?
      ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0
  };
}

async function getServiceHealth() {
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  return {
    total_inquiries: leads?.length || 0,
    active_clients: clients?.filter(c => c.status === 'active').length || 0,
    scheduled_consultations: leads?.filter(l => l.status === 'scheduled').length || 0,
    conversion_rate: leads?.length > 0 ?
      ((clients?.filter(c => c.status === 'active').length / leads.length) * 100).toFixed(1) : 0
  };
}

async function getTalentHealth() {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('role', 'chef');

  return {
    total_chefs: chefs?.length || 0,
    active_chefs: chefs?.filter(c => c.status === 'active').length || 0,
    available_chefs: chefs?.filter(c => c.availability === 'available').length || 0
  };
}

async function analyzeRevenueGap() {
  const health = await getRevenueHealth();

  const startDate = new Date(ATLAS_PROFILE.revenue_goal.start_date);
  const today = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 5);

  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const daysPassed = (today - startDate) / (1000 * 60 * 60 * 24);
  const percentComplete = (daysPassed / totalDays) * 100;

  const expectedRevenue = ATLAS_PROFILE.revenue_goal.total * (percentComplete / 100);
  const actualRevenue = health.revenue_to_date;
  const gap = expectedRevenue - actualRevenue;

  let severity = 'on_track';
  if (gap > 10000000) severity = 'critical';
  else if (gap > 5000000) severity = 'urgent';
  else if (gap > 1000000) severity = 'warning';

  return {
    gap_amount: gap,
    behind_target: gap > 0,
    severity: severity,
    actual: actualRevenue,
    expected: expectedRevenue
  };
}

function calculateDepartmentScore(health) {
  let score = 50;
  const total = Object.values(health).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  return Math.min(100, score + (total > 0 ? Math.min(50, total) : 0));
}

async function determineStrategicPriorities(gap, departments) {
  const priorities = [];

  if (gap.behind_target) {
    priorities.push({
      priority: 1,
      title: `Close $${(gap.gap_amount / 1000000).toFixed(1)}M Revenue Gap`,
      owner: 'DAVE (CFO)',
      status: 'urgent',
      actions: ['Accelerate collections', 'Increase pricing', 'Upsell existing clients']
    });
  }

  if (departments?.talent?.available_chefs < 5) {
    priorities.push({
      priority: 2,
      title: 'Emergency Chef Recruitment',
      owner: 'HENRY (COO)',
      status: 'urgent',
      actions: ['Launch paid job ads', 'Culinary school partnerships', 'Referral bonuses']
    });
  }

  if (departments?.marketing?.total_leads < 50) {
    priorities.push({
      priority: 1,
      title: 'Scale Lead Generation to 500+/month',
      owner: 'DAN (CMO)',
      status: 'urgent',
      actions: ['Launch paid ads', 'SEO optimization', 'Partnership outreach']
    });
  }

  return priorities;
}

async function getDecisionsPending() {
  return [
    { decision: 'Approve Q1 marketing budget increase', urgency: 'medium' },
    { decision: 'Review expansion into Miami market', urgency: 'low' }
  ];
}

async function logDecision(decision) {
  try {
    await tenantInsert(TABLES.COMMUNICATIONS, {
      direction: 'internal',
      from_contact: ATLAS_PROFILE.name,
      to_contact: 'Executive Team',
      subject: `CEO Decision: ${decision.type}`,
      message: JSON.stringify(decision),
      channel: 'executive_decision',
      status: 'executed',
      metadata: {
        decision_id: decision.decision_id,
        impact: decision.impact,
        autonomous: true
      }
    });
  } catch (error) {
    console.error('[ATLAS] Error logging decision:', error.message);
  }
}

async function getRecentDecisions() {
  const { data: decisions } = await getSupabase()
    .from(TABLES.COMMUNICATIONS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('channel', 'executive_decision')
    .order('created_at', { ascending: false })
    .limit(10);

  return decisions?.map(d => ({
    decision_id: d.metadata?.decision_id,
    type: d.subject,
    timestamp: d.created_at
  })) || [];
}

// Placeholder functions
async function reallocateResources(req, res, data) {
  return makeDecision(req, res, { type: 'REALLOCATE_BUDGET', ...data });
}

async function issueDirective(req, res, data) {
  return res.json({
    success: true,
    directive: {
      from: ATLAS_PROFILE.name,
      to: data?.executive || 'ALL_EXECUTIVES',
      message: data?.message || 'Executive directive issued',
      timestamp: new Date().toISOString()
    }
  });
}

async function approvePlan(req, res, data) {
  const approved = data?.approve !== false; // Default to approve
  return makeDecision(req, res, {
    type: approved ? 'APPROVE_EXPANSION' : 'REJECT_PLAN',
    ...data
  });
}

module.exports.ATLAS_PROFILE = ATLAS_PROFILE;
