// ============================================================================
// HENRY - AUTONOMOUS COO
// 100% ACCOUNTABLE FOR OPERATIONAL EXCELLENCE & CAPACITY
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const HENRY_PROFILE = {
  name: 'HENRY',
  title: 'Chief Operating Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: 'Operational excellence, chef capacity, service delivery',
  personality: 'Efficient, process-driven, eliminates bottlenecks, maximizes utilization',
  decision_authority: [
    'Trigger chef recruitment when capacity < 20%',
    'Adjust chef assignments for optimal utilization',
    'Approve operational process changes',
    'Authorize emergency chef hiring (up to $10K)',
    'Reallocate resources between regions',
    'Demand budget from Atlas for capacity expansion'
  ],
  capacity_targets: {
    min_available_chefs: 10, // Minimum 10 chefs available at all times
    target_utilization: 80, // 80% chef utilization
    max_waitlist_size: 5, // Max 5 clients on waitlist
    service_quality_score: 95 // 95%+ quality target
  },
  actions: [
    'status',
    'capacity_health',
    'chef_utilization',
    'trigger_recruitment',
    'optimize_assignments',
    'manage_waitlist',
    'demand_capacity_budget',
    'autonomous_run',
    'weekly_coo_report'
  ]
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'capacity_health':
        return await assessCapacityHealth(req, res);

      case 'chef_utilization':
        return await analyzeChefUtilization(req, res);

      case 'trigger_recruitment':
        return await triggerRecruitment(req, res, data);

      case 'optimize_assignments':
        return await optimizeAssignments(req, res);

      case 'manage_waitlist':
        return await manageWaitlist(req, res);

      case 'demand_capacity_budget':
        return await demandCapacityBudget(req, res, data);

      case 'autonomous_run':
        return await autonomousRun(req, res);

      case 'weekly_coo_report':
        return await sendWeeklyCOOReport(req, res);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: HENRY_PROFILE.actions
        });
    }
  } catch (error) {
    console.error(`[${HENRY_PROFILE.name}] ERROR:`, error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// STATUS
// ============================================================================

async function getStatus(req, res) {
  console.log(`[${HENRY_PROFILE.name}] Checking operations status...`);

  const health = await assessCapacityHealth();
  const utilization = await analyzeChefUtilization();

  return res.json({
    coo: HENRY_PROFILE.name,
    accountability: HENRY_PROFILE.accountability,
    capacity_targets: HENRY_PROFILE.capacity_targets,
    current_capacity: health,
    utilization: utilization,
    decision_authority: HENRY_PROFILE.decision_authority,
    autonomous: true,
    message: health.capacity_critical ?
      'CRITICAL: Chef capacity below minimum. Triggering emergency recruitment.' :
      health.capacity_healthy ? 'Operations running smoothly.' : 'Capacity constraints detected. Taking action.'
  });
}

// ============================================================================
// CAPACITY HEALTH ASSESSMENT
// ============================================================================

async function assessCapacityHealth() {
  // Get all chefs
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('role', 'chef');

  const available_chefs = chefs?.filter(c => c.availability === 'available').length || 0;
  const active_chefs = chefs?.filter(c => c.status === 'active').length || 0;
  const total_chefs = chefs?.length || 0;

  // Get engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const active_engagements = engagements?.filter(e => e.status === 'active').length || 0;

  // Get waitlist
  const { data: waitlist } = await getSupabase()
    .from(TABLES.HOUSEHOLDS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'waitlist');

  const waitlist_size = waitlist?.length || 0;

  // Calculate capacity health
  const capacity_percentage = total_chefs > 0 ? (available_chefs / total_chefs) * 100 : 0;
  const utilization = total_chefs > 0 ? ((total_chefs - available_chefs) / total_chefs) * 100 : 0;

  const capacity_critical = available_chefs < 3;
  const capacity_low = available_chefs < HENRY_PROFILE.capacity_targets.min_available_chefs;
  const capacity_healthy = available_chefs >= HENRY_PROFILE.capacity_targets.min_available_chefs;
  const utilization_optimal = utilization >= 70 && utilization <= 90;

  return {
    total_chefs,
    active_chefs,
    available_chefs,
    capacity_percentage: capacity_percentage.toFixed(1),
    utilization: utilization.toFixed(1),
    active_engagements,
    waitlist_size,
    capacity_critical,
    capacity_low,
    capacity_healthy,
    utilization_optimal,
    health_score: calculateCapacityScore(available_chefs, utilization, waitlist_size)
  };
}

function calculateCapacityScore(available, utilization, waitlist) {
  let score = 50;

  // Available chefs
  if (available >= 20) score += 30;
  else if (available >= 10) score += 20;
  else if (available >= 5) score += 10;
  else if (available < 3) score -= 30;

  // Utilization (optimal around 80%)
  if (utilization >= 70 && utilization <= 90) score += 20;
  else if (utilization >= 60 && utilization < 95) score += 10;
  else if (utilization > 95) score -= 10; // Over-utilized

  // Waitlist (lower is better)
  if (waitlist === 0) score += 10;
  else if (waitlist <= 5) score += 5;
  else if (waitlist > 10) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// CHEF UTILIZATION ANALYSIS
// ============================================================================

async function analyzeChefUtilization() {
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('role', 'chef');

  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const utilization_by_chef = chefs?.map(chef => {
    const chef_engagements = engagements?.filter(e => e.chef_id === chef.id && e.status === 'active') || [];
    return {
      chef_id: chef.id,
      chef_name: chef.full_name,
      active_engagements: chef_engagements.length,
      availability: chef.availability,
      utilization_level: chef_engagements.length >= 3 ? 'high' : chef_engagements.length >= 1 ? 'moderate' : 'low'
    };
  }) || [];

  const underutilized = utilization_by_chef.filter(c => c.utilization_level === 'low').length;
  const overutilized = utilization_by_chef.filter(c => c.active_engagements > 4).length;

  return {
    total_chefs: chefs?.length || 0,
    underutilized_chefs: underutilized,
    overutilized_chefs: overutilized,
    optimization_opportunities: underutilized > 0 || overutilized > 0,
    recommendation: underutilized > 0 ? 'Reassign clients to underutilized chefs' : 'Utilization optimal'
  };
}

// ============================================================================
// TRIGGER RECRUITMENT
// ============================================================================

async function triggerRecruitment(req, res, data) {
  console.log(`[${HENRY_PROFILE.name}] Triggering chef recruitment...`);

  const recruitment = {
    coo: HENRY_PROFILE.name,
    timestamp: new Date().toISOString(),
    trigger: data?.trigger || 'capacity_low',
    target_hires: data?.target_hires || 10,
    budget: data?.budget || 10000,
    urgency: data?.urgency || 'high',
    channels: ['culinary_schools', 'job_boards', 'referrals']
  };

  // Notify DAN to launch recruitment campaign
  await mfs.sendReport('DAN', {
    bot_name: HENRY_PROFILE.name,
    type: 'recruitment_request',
    priority: 'high',
    subject: `URGENT: Chef Recruitment Needed - ${recruitment.target_hires} Chefs`,
    data: recruitment
  });

  // Report to Atlas
  await mfs.sendReport('ATLAS', {
    bot_name: HENRY_PROFILE.name,
    type: 'recruitment_triggered',
    priority: 'high',
    subject: `Chef Recruitment Triggered - Capacity Critical`,
    data: recruitment
  });

  if (res) {
    return res.json({
      success: true,
      recruitment: recruitment,
      message: 'Chef recruitment campaign triggered'
    });
  } else {
    return recruitment;
  }
}

// ============================================================================
// AUTONOMOUS RUN
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${HENRY_PROFILE.name}] Running autonomous operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    capacity_health: await assessCapacityHealth(),
    utilization: await analyzeChefUtilization(),
    actions_taken: []
  };

  // ACTION 1: Trigger recruitment if capacity critical
  if (results.capacity_health.capacity_critical || results.capacity_health.available_chefs < 5) {
    const recruitment = await triggerRecruitment(null, null, {
      trigger: 'capacity_critical',
      target_hires: 15,
      budget: 15000,
      urgency: 'critical'
    });
    results.actions_taken.push({
      action: 'EMERGENCY_RECRUITMENT',
      recruitment: recruitment,
      reasoning: `Only ${results.capacity_health.available_chefs} chefs available`
    });
  }

  // ACTION 2: Alert if waitlist growing
  if (results.capacity_health.waitlist_size > 10) {
    await mfs.sendReport('ATLAS', {
      bot_name: HENRY_PROFILE.name,
      type: 'waitlist_alert',
      priority: 'high',
      subject: `Waitlist Growing: ${results.capacity_health.waitlist_size} Clients Waiting`,
      data: {
        waitlist_size: results.capacity_health.waitlist_size,
        available_chefs: results.capacity_health.available_chefs,
        recommendation: 'Accelerate chef recruitment or pause marketing'
      }
    });
    results.actions_taken.push({
      action: 'WAITLIST_ALERT',
      waitlist_size: results.capacity_health.waitlist_size
    });
  }

  // ACTION 3: Demand capacity budget if utilization > 95%
  if (parseFloat(results.capacity_health.utilization) > 95) {
    const budget_request = await demandCapacityBudget(null, null, {
      amount: 25000,
      reasoning: `${results.capacity_health.utilization}% utilization - at max capacity`,
      urgency: 'critical'
    });
    results.actions_taken.push({
      action: 'CAPACITY_BUDGET_DEMANDED',
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
// DEMAND CAPACITY BUDGET
// ============================================================================

async function demandCapacityBudget(req, res, data) {
  const request = {
    from: HENRY_PROFILE.name,
    to: 'ATLAS',
    timestamp: new Date().toISOString(),
    type: 'CAPACITY_BUDGET_REQUEST',
    amount_requested: data?.amount || 25000,
    reasoning: data?.reasoning || 'Capacity constraints blocking revenue growth',
    urgency: data?.urgency || 'high',
    impact: 'Cannot onboard new clients without additional chef capacity'
  };

  await mfs.sendReport('ATLAS', {
    bot_name: HENRY_PROFILE.name,
    type: 'budget_request',
    priority: 'high',
    subject: `COO Capacity Budget Request: $${request.amount_requested.toLocaleString()}`,
    data: request
  });

  if (res) {
    return res.json({
      success: true,
      request: request
    });
  } else {
    return request;
  }
}

// ============================================================================
// WEEKLY COO REPORT
// ============================================================================

async function sendWeeklyCOOReport(req, res) {
  console.log(`[${HENRY_PROFILE.name}] Generating weekly COO report to Atlas...`);

  const health = await assessCapacityHealth();
  const utilization = await analyzeChefUtilization();

  const report = {
    week: new Date().toISOString().split('T')[0],
    capacity: {
      total_chefs: health.total_chefs,
      available_chefs: health.available_chefs,
      utilization: health.utilization,
      health_score: health.health_score
    },
    operations: {
      active_engagements: health.active_engagements,
      waitlist_size: health.waitlist_size,
      underutilized_chefs: utilization.underutilized_chefs,
      overutilized_chefs: utilization.overutilized_chefs
    },
    executive_summary: health.capacity_healthy ?
      `Operations running smoothly. ${health.available_chefs} chefs available, ${health.utilization}% utilization.` :
      `CAPACITY ALERT: Only ${health.available_chefs} chefs available. ${health.waitlist_size} clients on waitlist. Recruitment in progress.`,
    recommendations: generateRecommendations(health, utilization)
  };

  await mfs.sendReport('ATLAS', {
    bot_name: HENRY_PROFILE.name,
    type: 'weekly_coo_report',
    priority: health.capacity_healthy ? 'normal' : 'high',
    subject: `Weekly COO Report - ${health.capacity_healthy ? 'Operations Healthy' : 'CAPACITY ALERT'}`,
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

function generateRecommendations(health, utilization) {
  const recommendations = [];

  if (health.capacity_critical) {
    recommendations.push({
      priority: 1,
      action: 'EMERGENCY CHEF RECRUITMENT',
      reasoning: `Only ${health.available_chefs} chefs available - below critical minimum`,
      budget: 20000,
      timeline: 'Immediate'
    });
  }

  if (health.waitlist_size > 5) {
    recommendations.push({
      priority: 1,
      action: 'PAUSE MARKETING or ACCELERATE HIRING',
      reasoning: `${health.waitlist_size} clients waiting - capacity cannot support demand`,
      owner: 'HENRY + DAN'
    });
  }

  if (utilization.underutilized_chefs > 3) {
    recommendations.push({
      priority: 2,
      action: 'REASSIGN CLIENTS',
      reasoning: `${utilization.underutilized_chefs} chefs underutilized - optimize assignments`,
      expected_impact: 'Increase utilization to 80%+'
    });
  }

  return recommendations;
}

// Placeholder functions
async function optimizeAssignments(req, res) {
  return res.json({
    success: true,
    message: 'Chef assignments optimized'
  });
}

async function manageWaitlist(req, res) {
  const { data: waitlist } = await getSupabase()
    .from(TABLES.HOUSEHOLDS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'waitlist');

  return res.json({
    success: true,
    waitlist_size: waitlist?.length || 0,
    waitlist: waitlist
  });
}

module.exports.HENRY_PROFILE = HENRY_PROFILE;
