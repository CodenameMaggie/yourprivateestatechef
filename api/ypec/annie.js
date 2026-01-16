// ============================================================================
// ANNIE - AUTONOMOUS CSO (Chief Support Officer)
// 100% ACCOUNTABLE FOR CUSTOMER SATISFACTION & SERVICE QUALITY
// Reports to: Atlas (CEO)
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const ANNIE_PROFILE = {
  name: 'ANNIE',
  title: 'Chief Support Officer',
  reports_to: 'Atlas (CEO)',
  company: 'Your Private Estate Chef',
  accountability: 'Customer satisfaction, service quality, client happiness',
  personality: 'Empathetic, client-focused, proactive problem solver, ensures every client feels valued',
  decision_authority: [
    'Respond to customer inquiries immediately',
    'Resolve service issues autonomously',
    'Offer service credits (up to $500/client)',
    'Escalate VIP clients to CEO',
    'Trigger chef quality reviews',
    'Send satisfaction surveys',
    'Manage client feedback and complaints'
  ],
  service_targets: {
    response_time: 2, // 2 hour response time for inquiries
    satisfaction_score: 95, // 95%+ client satisfaction
    nps_score: 80, // Net Promoter Score 80+
    complaint_resolution_time: 24, // Resolve complaints within 24 hours
    service_quality_score: 90 // 90%+ service quality from chef performance
  },
  actions: [
    'status',
    'service_health',
    'process_inquiries',
    'handle_complaints',
    'send_satisfaction_surveys',
    'monitor_service_quality',
    'escalate_vip',
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

      case 'service_health':
        return await assessServiceHealth(req, res);

      case 'process_inquiries':
        return await processInquiries(req, res);

      case 'handle_complaints':
        return await handleComplaints(req, res);

      case 'send_satisfaction_surveys':
        return await sendSatisfactionSurveys(req, res);

      case 'monitor_service_quality':
        return await monitorServiceQuality(req, res);

      case 'escalate_vip':
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
  console.log(`[${ANNIE_PROFILE.name}] Checking customer service status...`);

  const health = await assessServiceHealth();

  return res.json({
    cso: ANNIE_PROFILE.name,
    accountability: ANNIE_PROFILE.accountability,
    service_targets: ANNIE_PROFILE.service_targets,
    current_performance: health,
    decision_authority: ANNIE_PROFILE.decision_authority,
    autonomous: true,
    message: health.service_excellent ?
      'Customer service excellent. Clients happy.' :
      `Service issues detected. ${health.unresponded_inquiries} unanswered inquiries, ${health.open_complaints} open complaints. Taking action.`
  });
}

// ============================================================================
// SERVICE HEALTH ASSESSMENT
// ============================================================================

async function assessServiceHealth() {
  // Get all inquiries
  const { data: leads } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get clients
  const { data: clients } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  // Get communications (for response time tracking)
  const { data: communications } = await getSupabase()
    .from(TABLES.COMMUNICATIONS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('direction', 'inbound');

  // Calculate unresponded inquiries (no response in 2+ hours)
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  const unresponded_inquiries = leads?.filter(l =>
    l.status === 'new' && new Date(l.created_at) < twoHoursAgo
  ).length || 0;

  // Get active clients
  const active_clients = clients?.filter(c => c.status === 'active').length || 0;

  // Simulate satisfaction metrics (would be real in production)
  const satisfaction_score = 92; // Mock: 92% satisfaction
  const nps_score = 75; // Mock: 75 NPS
  const open_complaints = 0; // Mock: 0 complaints

  // Service quality score (based on chef performance)
  const service_quality_score = 88; // Mock: 88% quality

  // Calculate if hitting targets
  const hitting_response_target = unresponded_inquiries === 0;
  const hitting_satisfaction_target = satisfaction_score >= ANNIE_PROFILE.service_targets.satisfaction_score;
  const hitting_quality_target = service_quality_score >= ANNIE_PROFILE.service_targets.service_quality_score;

  const service_excellent = hitting_response_target && hitting_satisfaction_target && hitting_quality_target;

  return {
    active_clients: active_clients,
    total_inquiries: leads?.length || 0,
    unresponded_inquiries: unresponded_inquiries,
    open_complaints: open_complaints,
    satisfaction_score: satisfaction_score,
    nps_score: nps_score,
    service_quality_score: service_quality_score,
    service_excellent: service_excellent,
    health_score: calculateServiceScore(unresponded_inquiries, satisfaction_score, service_quality_score, open_complaints)
  };
}

function calculateServiceScore(unresponded, satisfaction, quality, complaints) {
  let score = 50;

  // Response time
  if (unresponded === 0) score += 20;
  else if (unresponded <= 3) score += 10;
  else if (unresponded > 10) score -= 30;

  // Satisfaction
  if (satisfaction >= 95) score += 20;
  else if (satisfaction >= 90) score += 15;
  else if (satisfaction >= 85) score += 10;
  else if (satisfaction < 80) score -= 20;

  // Service quality
  if (quality >= 95) score += 15;
  else if (quality >= 90) score += 10;
  else if (quality >= 85) score += 5;
  else if (quality < 80) score -= 15;

  // Complaints (lower is better)
  if (complaints === 0) score += 10;
  else if (complaints <= 2) score += 5;
  else if (complaints > 5) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// PROCESS INQUIRIES
// ============================================================================

async function processInquiries(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Processing customer inquiries...`);

  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  const { data: unresponded } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'new')
    .lt('created_at', twoHoursAgo.toISOString());

  const responses = [];

  for (const inquiry of unresponded || []) {
    // Queue acknowledgment email
    await tenantInsert(TABLES.COMMUNICATIONS, {
      direction: 'outbound',
      to_contact: inquiry.email,
      subject: 'Thank you for your inquiry - Your Private Estate Chef',
      message: `Hi ${inquiry.name}, Thank you for your interest in our private chef services. I'm Annie, your dedicated support contact...`,
      channel: 'email',
      status: 'queued',
      metadata: {
        lead_id: inquiry.id,
        automated: true,
        sent_by: ANNIE_PROFILE.name,
        response_time: Math.floor((new Date() - new Date(inquiry.created_at)) / (1000 * 60)) // minutes
      }
    });

    responses.push({
      inquiry_id: inquiry.id,
      inquiry_name: inquiry.name,
      response_sent: true,
      response_time_minutes: Math.floor((new Date() - new Date(inquiry.created_at)) / (1000 * 60))
    });
  }

  if (res) {
    return res.json({
      success: true,
      inquiries_processed: responses.length,
      responses: responses
    });
  } else {
    return { inquiries_processed: responses.length };
  }
}

// ============================================================================
// HANDLE COMPLAINTS
// ============================================================================

async function handleComplaints(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Handling customer complaints...`);

  // In a real system, this would fetch actual complaints
  const complaints = []; // Mock: no complaints

  const resolutions = [];

  for (const complaint of complaints) {
    // Resolve complaint
    resolutions.push({
      complaint_id: complaint.id,
      client_name: complaint.client_name,
      issue: complaint.issue,
      resolution: 'Service credit issued + personal follow-up',
      credit_issued: 200,
      escalated_to_henry: complaint.severity === 'critical'
    });
  }

  if (res) {
    return res.json({
      success: true,
      complaints_handled: resolutions.length,
      resolutions: resolutions
    });
  } else {
    return { complaints_handled: resolutions.length };
  }
}

// ============================================================================
// SEND SATISFACTION SURVEYS
// ============================================================================

async function sendSatisfactionSurveys(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Sending satisfaction surveys...`);

  // Get clients who had service in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recent_engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*, client:ypec_clients(*)')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .gte('last_service_date', sevenDaysAgo.toISOString());

  const surveys_sent = [];

  for (const engagement of recent_engagements?.slice(0, 5) || []) {
    surveys_sent.push({
      client_name: engagement.client?.primary_contact_name,
      survey_type: 'satisfaction_nps',
      sent: true
    });
  }

  if (res) {
    return res.json({
      success: true,
      surveys_sent: surveys_sent.length,
      surveys: surveys_sent
    });
  } else {
    return { surveys_sent: surveys_sent.length };
  }
}

// ============================================================================
// MONITOR SERVICE QUALITY
// ============================================================================

async function monitorServiceQuality(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Monitoring service quality...`);

  // Get all active engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*, chef:ypec_users(*), client:ypec_clients(*)')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  const quality_issues = [];

  // Check for service quality issues (mock data)
  for (const engagement of engagements || []) {
    // In real system, check for:
    // - Late arrivals
    // - Client complaints
    // - Missed services
    // - Low ratings
  }

  if (res) {
    return res.json({
      success: true,
      total_engagements: engagements?.length || 0,
      quality_issues: quality_issues.length,
      issues: quality_issues,
      overall_quality: 'excellent'
    });
  } else {
    return { quality_issues: quality_issues.length };
  }
}

// ============================================================================
// ESCALATE VIP
// ============================================================================

async function escalateVIP(req, res, data) {
  console.log(`[${ANNIE_PROFILE.name}] Escalating VIP client:`, data?.client_id);

  await mfs.sendReport('ATLAS', {
    bot_name: ANNIE_PROFILE.name,
    type: 'vip_escalation',
    priority: 'high',
    subject: `VIP Client Requires CEO Attention`,
    data: {
      client_id: data?.client_id,
      reason: data?.reason || 'High-value client needs personal attention',
      recommended_action: 'Personal call from CEO'
    }
  });

  return res.json({
    success: true,
    message: 'VIP client escalated to Atlas (CEO)'
  });
}

// ============================================================================
// AUTONOMOUS RUN
// ============================================================================

async function autonomousRun(req, res) {
  console.log(`[${ANNIE_PROFILE.name}] Running autonomous customer service operations...`);

  const results = {
    timestamp: new Date().toISOString(),
    service_health: await assessServiceHealth(),
    actions_taken: []
  };

  // ACTION 1: Process unresponded inquiries
  if (results.service_health.unresponded_inquiries > 0) {
    const inquiry_result = await processInquiries(null, null);
    results.actions_taken.push({
      action: 'INQUIRIES_PROCESSED',
      inquiries: inquiry_result.inquiries_processed,
      reasoning: `${results.service_health.unresponded_inquiries} inquiries needed responses`
    });
  }

  // ACTION 2: Handle any open complaints
  if (results.service_health.open_complaints > 0) {
    const complaint_result = await handleComplaints(null, null);
    results.actions_taken.push({
      action: 'COMPLAINTS_HANDLED',
      complaints: complaint_result.complaints_handled,
      reasoning: `${results.service_health.open_complaints} open complaints`
    });
  }

  // ACTION 3: Send satisfaction surveys
  const survey_result = await sendSatisfactionSurveys(null, null);
  if (survey_result.surveys_sent > 0) {
    results.actions_taken.push({
      action: 'SATISFACTION_SURVEYS_SENT',
      surveys: survey_result.surveys_sent,
      reasoning: 'Regular satisfaction monitoring'
    });
  }

  // ACTION 4: Alert Atlas if service quality drops
  if (results.service_health.health_score < 70) {
    await mfs.sendReport('ATLAS', {
      bot_name: ANNIE_PROFILE.name,
      type: 'service_quality_alert',
      priority: 'high',
      subject: `Service Quality Alert: Score ${results.service_health.health_score}/100`,
      data: {
        service_health: results.service_health,
        actions_taken: results.actions_taken,
        recommendation: 'Review service delivery process and chef performance'
      }
    });
    results.actions_taken.push({
      action: 'ALERTED_ATLAS',
      severity: 'service_quality_low'
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

  const health = await assessServiceHealth();

  const report = {
    week: new Date().toISOString().split('T')[0],
    service: {
      active_clients: health.active_clients,
      satisfaction_score: health.satisfaction_score,
      nps_score: health.nps_score,
      service_quality_score: health.service_quality_score,
      health_score: health.health_score
    },
    operations: {
      total_inquiries: health.total_inquiries,
      unresponded_inquiries: health.unresponded_inquiries,
      open_complaints: health.open_complaints,
      average_response_time: '1.2 hours' // Mock
    },
    executive_summary: health.service_excellent ?
      `Customer service excellent. ${health.satisfaction_score}% satisfaction, ${health.nps_score} NPS score.` :
      `Service issues detected: ${health.unresponded_inquiries} unanswered inquiries, ${health.satisfaction_score}% satisfaction (target 95%+).`,
    recommendations: generateRecommendations(health)
  };

  await mfs.sendReport('ATLAS', {
    bot_name: ANNIE_PROFILE.name,
    type: 'weekly_cso_report',
    priority: health.service_excellent ? 'normal' : 'high',
    subject: `Weekly CSO Report - ${health.service_excellent ? 'Service Excellent' : 'SERVICE ISSUES'}`,
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

  if (health.unresponded_inquiries > 5) {
    recommendations.push({
      priority: 1,
      action: 'ADD CUSTOMER SERVICE CAPACITY',
      reasoning: `${health.unresponded_inquiries} inquiries not responded to within 2 hours`,
      expected_impact: 'Improve response time to < 1 hour'
    });
  }

  if (health.satisfaction_score < 90) {
    recommendations.push({
      priority: 1,
      action: 'INVESTIGATE SERVICE QUALITY ISSUES',
      reasoning: `Satisfaction ${health.satisfaction_score}% below ${ANNIE_PROFILE.service_targets.satisfaction_score}% target`,
      owner: 'ANNIE + HENRY',
      expected_impact: 'Identify and fix service delivery problems'
    });
  }

  if (health.service_quality_score < 85) {
    recommendations.push({
      priority: 1,
      action: 'CHEF PERFORMANCE REVIEW',
      reasoning: `Service quality ${health.service_quality_score}% - may indicate chef issues`,
      owner: 'HENRY (COO)',
      expected_impact: 'Improve chef service delivery'
    });
  }

  if (health.open_complaints > 2) {
    recommendations.push({
      priority: 1,
      action: 'EXPEDITE COMPLAINT RESOLUTION',
      reasoning: `${health.open_complaints} open complaints - risk of churn`,
      expected_impact: 'Resolve all complaints within 24 hours'
    });
  }

  return recommendations;
}

module.exports.ANNIE_PROFILE = ANNIE_PROFILE;
