// ============================================================================
// MFS C-SUITE INTEGRATION MODULE
// Purpose: Connect YPEC bots to Forbes Command C-suite (ANNIE, HENRY, DAVE, DAN)
// ============================================================================

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Lazy-load Supabase client to avoid startup crashes
let supabase = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

const MFS_BASE_URL = process.env.MFS_BASE_URL || 'http://5.78.139.9:3000';

// C-Suite Bot Endpoints
const C_SUITE = {
  ATLAS: {
    name: 'ATLAS',
    title: 'CEO - Chief Executive Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/atlas`,
    responsibilities: ['Strategic oversight', '$100M revenue goal', 'Board reporting', 'Executive decisions']
  },
  ANNIE: {
    name: 'ANNIE',
    title: 'CSO - Chief Support Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/annie`,
    responsibilities: ['Customer support', 'Client relations', 'Inquiry management']
  },
  HENRY: {
    name: 'HENRY',
    title: 'COO - Chief Operating Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/henry`,
    responsibilities: ['Operations', 'Resource management', 'Logistics']
  },
  DAVE: {
    name: 'DAVE',
    title: 'CFO - Chief Financial Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/dave`,
    responsibilities: ['Finance', 'Revenue', 'Budgeting']
  },
  DAN: {
    name: 'DAN',
    title: 'CMO - Chief Marketing Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/dan`,
    responsibilities: ['Marketing', 'Growth', 'Content']
  },
  JORDAN: {
    name: 'JORDAN',
    title: 'General Counsel - Chief Legal Officer',
    endpoint: `${MFS_BASE_URL}/api/mfs/jordan`,
    responsibilities: ['Legal compliance', 'Contracts', 'Risk management', 'Regulatory oversight']
  }
};

// ============================================================================
// SEND REPORT TO C-SUITE
// ============================================================================

async function sendReport(executive, report) {
  const csuite = C_SUITE[executive.toUpperCase()];

  if (!csuite) {
    console.error(`[MFS-Integration] Unknown executive: ${executive}`);
    return { success: false, error: 'Unknown executive' };
  }

  const message = {
    from: report.bot_name,
    company: 'Your Private Estate Chef',
    company_number: 7,
    type: report.type || 'status_update',
    priority: report.priority || 'normal',
    subject: report.subject,
    data: report.data,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`[MFS-Integration] Sending ${report.type} to ${csuite.name}`);

    const response = await axios.post(`${csuite.endpoint}/inbox`, message, {
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Number': '7',
        'X-Company-Name': 'YPEC'
      },
      timeout: 5000
    });

    // Log communication
    await logCommunication({
      direction: 'outbound',
      from_bot: report.bot_name,
      to_executive: csuite.name,
      subject: report.subject,
      message_type: report.type,
      status: 'sent',
      response_data: response.data
    });

    console.log(`[MFS-Integration] Report sent to ${csuite.name}:`, response.data);

    return {
      success: true,
      executive: csuite.name,
      acknowledged: response.data?.acknowledged || false
    };

  } catch (error) {
    console.error(`[MFS-Integration] Error sending to ${csuite.name}:`, error.message);

    // Log failed communication
    await logCommunication({
      direction: 'outbound',
      from_bot: report.bot_name,
      to_executive: csuite.name,
      subject: report.subject,
      message_type: report.type,
      status: 'failed',
      error_message: error.message
    });

    return {
      success: false,
      executive: csuite.name,
      error: error.message
    };
  }
}

// ============================================================================
// DAILY SUMMARY TO HENRY
// ============================================================================

async function sendDailySummaryToHenry(summary) {
  return await sendReport('HENRY', {
    bot_name: 'YPEC-Operations',
    type: 'daily_summary',
    priority: 'normal',
    subject: `YPEC Daily Operations Summary - ${summary.date}`,
    data: {
      events_today: summary.events_today || 0,
      active_engagements: summary.active_engagements || 0,
      upcoming_week: summary.upcoming_week || 0,
      today_events_detail: summary.today_events_detail || [],
      alerts: summary.alerts || [],
      recommendations: summary.recommendations || []
    }
  });
}

// ============================================================================
// WEEKLY REVENUE REPORT TO DAVE
// ============================================================================

async function sendWeeklyReportToDave(report) {
  return await sendReport('DAVE', {
    bot_name: 'YPEC-Revenue',
    type: 'weekly_revenue_report',
    priority: 'high',
    subject: `YPEC Weekly Revenue Report - Week of ${report.week_start}`,
    data: {
      total_revenue: report.revenue?.paid || 0,
      pending_invoices: report.revenue?.pending || 0,
      overdue_invoices: report.revenue?.overdue || 0,
      forecast: report.forecast || {},
      week_over_week_change: report.week_over_week_change || 0,
      alerts: report.alerts || []
    }
  });
}

// ============================================================================
// INQUIRY NOTIFICATION TO ANNIE
// ============================================================================

async function notifyAnnieNewInquiry(inquiry) {
  return await sendReport('ANNIE', {
    bot_name: 'YPEC-Concierge',
    type: 'new_inquiry',
    priority: inquiry.lead_quality === 'hot' ? 'high' : 'normal',
    subject: `New YPEC Inquiry - ${inquiry.name}`,
    data: {
      inquiry_id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      city: inquiry.city,
      state: inquiry.state,
      service_interest: inquiry.service_interest,
      lead_quality: inquiry.lead_quality,
      referral_source: inquiry.referral_source,
      message: inquiry.message,
      created_at: inquiry.created_at,
      recommended_action: inquiry.lead_quality === 'hot'
        ? 'Immediate personal follow-up'
        : 'Standard acknowledgment sent'
    }
  });
}

// ============================================================================
// CONSULTATION SCHEDULED TO ANNIE
// ============================================================================

async function notifyAnnieConsultationScheduled(consultation) {
  return await sendReport('ANNIE', {
    bot_name: 'YPEC-Concierge',
    type: 'consultation_scheduled',
    priority: 'normal',
    subject: `YPEC Consultation Scheduled - ${consultation.household_name}`,
    data: {
      consultation_id: consultation.id,
      household_name: consultation.household_name,
      household_email: consultation.household_email,
      consultation_date: consultation.consultation_date,
      consultation_time: consultation.consultation_time,
      service_interest: consultation.service_interest,
      notes: consultation.notes
    }
  });
}

// ============================================================================
// MARKETING INSIGHTS TO DAN
// ============================================================================

async function sendMarketingInsightsToDan(insights) {
  return await sendReport('DAN', {
    bot_name: 'YPEC-Marketing',
    type: 'marketing_insights',
    priority: 'normal',
    subject: `YPEC Marketing Insights - ${insights.period}`,
    data: {
      period: insights.period,
      total_leads: insights.total_leads || 0,
      conversion_rate: insights.conversion_rate || 0,
      best_performing_source: insights.best_source || null,
      referrals: {
        active: insights.referrals?.active || 0,
        converted: insights.referrals?.converted || 0,
        conversion_rate: insights.referrals?.conversion_rate || 0
      },
      waitlist: {
        total: insights.waitlist?.total || 0,
        capacity_available: insights.waitlist?.capacity_available || false
      },
      recommendations: insights.recommendations || []
    }
  });
}

// ============================================================================
// CHEF CAPACITY ALERT TO HENRY
// ============================================================================

async function alertHenryChefCapacity(alert) {
  return await sendReport('HENRY', {
    bot_name: 'YPEC-ChefRelations',
    type: 'capacity_alert',
    priority: alert.severity === 'critical' ? 'high' : 'normal',
    subject: `YPEC Chef Capacity ${alert.severity === 'critical' ? 'CRITICAL' : 'Alert'}`,
    data: {
      alert_type: alert.type,
      severity: alert.severity,
      available_chefs: alert.available_chefs || 0,
      total_chefs: alert.total_chefs || 0,
      waitlist_size: alert.waitlist_size || 0,
      regions_affected: alert.regions || [],
      recommended_action: alert.recommended_action,
      details: alert.details
    }
  });
}

// ============================================================================
// RECRUITMENT NEEDS ALERT TO HENRY
// ============================================================================

async function alertHenryRecruitmentNeeds(alert) {
  return await sendReport('HENRY', {
    bot_name: 'YPEC-ChefRelations',
    type: 'recruitment_needs',
    priority: alert.high_demand_regions?.length > 3 ? 'high' : 'normal',
    subject: `YPEC Chef Recruitment Needs - ${alert.high_demand_regions?.length || 0} Regions`,
    data: {
      alert_type: alert.type,
      total_regions_analyzed: alert.total_regions_analyzed || 0,
      high_demand_regions: alert.high_demand_regions || [],
      recommended_action: alert.recommended_action,
      details: alert.details,
      next_steps: [
        'Post job listings in high-demand regions',
        'Activate referral program for existing chefs',
        'Contact culinary schools in target areas',
        'Review chef application pipeline'
      ]
    }
  });
}

// ============================================================================
// OVERDUE INVOICE ALERT TO DAVE
// ============================================================================

async function alertDaveOverdueInvoices(invoices) {
  return await sendReport('DAVE', {
    bot_name: 'YPEC-Revenue',
    type: 'overdue_invoices',
    priority: 'high',
    subject: `YPEC Overdue Invoices - ${invoices.length} Total`,
    data: {
      count: invoices.length,
      total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0).toFixed(2),
      invoices: invoices.map(inv => ({
        invoice_number: inv.invoice_number,
        household_name: inv.household?.primary_contact_name,
        amount: inv.total,
        due_date: inv.due_date,
        days_overdue: Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24))
      })),
      recommended_action: 'Follow up with households regarding payment'
    }
  });
}

// ============================================================================
// LOG COMMUNICATION
// ============================================================================

async function logCommunication(comm) {
  try {
    const { error } = await supabase
      .from('ypec_communications')
      .insert({
        direction: comm.direction,
        from_contact: comm.from_bot || null,
        to_contact: comm.to_executive || comm.to_contact || null,
        subject: comm.subject,
        message: JSON.stringify({
          type: comm.message_type,
          status: comm.status,
          response: comm.response_data,
          error: comm.error_message
        }),
        channel: 'mfs_integration',
        status: comm.status,
        metadata: {
          executive: comm.to_executive,
          bot: comm.from_bot,
          company: 'YPEC'
        }
      });

    if (error) {
      console.error('[MFS-Integration] Error logging communication:', error);
    }
  } catch (error) {
    console.error('[MFS-Integration] Error logging communication:', error.message);
  }
}

// ============================================================================
// REQUEST FROM C-SUITE (Incoming Messages)
// ============================================================================

async function handleCSuiteRequest(request) {
  console.log(`[MFS-Integration] Received request from ${request.from}:`, request.subject);

  // Route request to appropriate YPEC bot
  let targetBot = null;
  let action = null;

  // Parse request and determine routing
  if (request.subject.toLowerCase().includes('inquiry') ||
      request.subject.toLowerCase().includes('customer')) {
    targetBot = 'concierge';
    action = 'status';
  } else if (request.subject.toLowerCase().includes('chef') ||
             request.subject.toLowerCase().includes('recruitment')) {
    targetBot = 'chef-relations';
    action = 'status';
  } else if (request.subject.toLowerCase().includes('revenue') ||
             request.subject.toLowerCase().includes('invoice')) {
    targetBot = 'revenue';
    action = 'status';
  } else if (request.subject.toLowerCase().includes('marketing') ||
             request.subject.toLowerCase().includes('lead')) {
    targetBot = 'marketing';
    action = 'status';
  } else if (request.subject.toLowerCase().includes('operation') ||
             request.subject.toLowerCase().includes('event')) {
    targetBot = 'operations';
    action = 'status';
  }

  if (targetBot) {
    try {
      const response = await axios.post(`http://localhost:3000/api/ypec/${targetBot}`, {
        action: action,
        data: request.data || {}
      });

      // Log incoming communication
      await logCommunication({
        direction: 'inbound',
        from_bot: request.from,
        to_contact: targetBot,
        subject: request.subject,
        message_type: 'c_suite_request',
        status: 'processed',
        response_data: response.data
      });

      return {
        success: true,
        bot: targetBot,
        response: response.data
      };
    } catch (error) {
      console.error(`[MFS-Integration] Error routing to ${targetBot}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  return {
    success: false,
    error: 'Unable to route request - no matching bot found'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  C_SUITE,
  sendReport,
  sendDailySummaryToHenry,
  sendWeeklyReportToDave,
  notifyAnnieNewInquiry,
  notifyAnnieConsultationScheduled,
  sendMarketingInsightsToDan,
  alertHenryChefCapacity,
  alertHenryRecruitmentNeeds,
  alertDaveOverdueInvoices,
  handleCSuiteRequest,
  logCommunication
};
