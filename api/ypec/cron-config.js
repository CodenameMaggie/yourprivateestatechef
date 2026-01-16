// ============================================================================
// YPEC CRON JOB CONFIGURATION
// Add these to Forbes Command's cron scheduler
// ============================================================================

const cron = require('node-cron');
const axios = require('axios');

const YPEC_BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function to call bot endpoints
async function callBot(endpoint, action, company) {
  try {
    console.log(`[CRON] Calling ${endpoint} - action: ${action}`);

    const response = await axios.post(`${YPEC_BASE_URL}${endpoint}`, {
      action: action,
      data: {}
    });

    console.log(`[CRON] ${endpoint} completed:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[CRON] Error calling ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// ============================================================================
// YPEC CRON JOBS
// ============================================================================

module.exports = {
  // Daily 6:00 AM - Lead scraper daily run
  leadScraperRun: cron.schedule('0 6 * * *', () => {
    console.log('[YPEC] Lead scraper daily run (6am daily)');
    callBot('/api/ypec/lead-scraper', 'run', 'YPEC');
  }),

  // Daily 7:00 AM - Process new inquiries, send acknowledgments
  processInquiries: cron.schedule('0 7 * * *', () => {
    console.log('[YPEC] Processing new inquiries (7am daily)');
    callBot('/api/ypec/concierge', 'process_inquiries', 'YPEC');
  }),

  // Daily 8:00 AM - Chef availability sync
  syncChefAvailability: cron.schedule('0 8 * * *', () => {
    console.log('[YPEC] Syncing chef availability (8am daily)');
    callBot('/api/ypec/chef-relations', 'sync_availability', 'YPEC');
  }),

  // Daily 9:00 AM - Send consultation reminders (tomorrow's consultations)
  consultationReminders: cron.schedule('0 9 * * *', () => {
    console.log('[YPEC] Sending consultation reminders (9am daily)');
    callBot('/api/ypec/concierge', 'send_reminders', 'YPEC');
  }),

  // Daily 10:00 AM - Check upcoming events (next 7 days)
  upcomingEvents: cron.schedule('0 10 * * *', () => {
    console.log('[YPEC] Reviewing upcoming events (10am daily)');
    callBot('/api/ypec/operations', 'upcoming_events', 'YPEC');
  }),

  // Daily 6:00 PM - Daily YPEC summary to HENRY
  dailySummary: cron.schedule('0 18 * * *', () => {
    console.log('[YPEC] Daily summary to HENRY (6pm daily)');
    callBot('/api/ypec/operations', 'daily_summary', 'YPEC');
  }),

  // Monday 9:00 AM - Weekly chef recruitment outreach
  chefRecruitment: cron.schedule('0 9 * * 1', () => {
    console.log('[YPEC] Chef recruitment outreach (Monday 9am)');
    callBot('/api/ypec/chef-relations', 'recruit', 'YPEC');
  }),

  // Friday 4:00 PM - Weekly revenue report to DAVE
  weeklyRevenueReport: cron.schedule('0 16 * * 5', () => {
    console.log('[YPEC] Weekly revenue report to DAVE (Friday 4pm)');
    callBot('/api/ypec/revenue', 'weekly_report', 'YPEC');
  }),

  // 1st of Month 8:00 AM - Generate monthly invoices
  monthlyInvoices: cron.schedule('0 8 1 * *', () => {
    console.log('[YPEC] Monthly invoice generation (1st of month 8am)');
    callBot('/api/ypec/revenue', 'generate_invoices', 'YPEC');
  }),

  // Daily 11:00 PM - Marketing daily run (waitlist check, referral follow-ups)
  marketingDailyRun: cron.schedule('0 23 * * *', () => {
    console.log('[YPEC] Marketing daily run (11pm daily)');
    callBot('/api/ypec/marketing', 'run', 'YPEC');
  }),

  // Daily Midnight - Revenue daily run (check overdue invoices)
  revenueDailyRun: cron.schedule('0 0 * * *', () => {
    console.log('[YPEC] Revenue daily run (midnight daily)');
    callBot('/api/ypec/revenue', 'run', 'YPEC');
  }),

  // ============================================================================
  // MARKETING AUTOMATION - CENTRALIZED EMAIL SYSTEM
  // ============================================================================

  // Daily 9:00 AM - Send queued emails via Forbes Command
  dailyEmailSender: cron.schedule('0 9 * * *', () => {
    console.log('[YPEC] Daily email sender - Processing queue (9am daily)');
    callBot('/api/ypec/email-sender', 'send_queued', 'YPEC');
  }),

  // Monday 10:00 AM - Culinary school outreach
  culinarySchoolOutreach: cron.schedule('0 10 * * 1', () => {
    console.log('[YPEC] Culinary school outreach (Monday 10am)');
    callBot('/api/ypec/culinary-outreach', 'run', 'YPEC');
  }),

  // Tuesday 10:00 AM - B2B partnership outreach
  partnershipOutreach: cron.schedule('0 10 * * 2', () => {
    console.log('[YPEC] B2B partnership outreach (Tuesday 10am)');
    callBot('/api/ypec/partnership-outreach', 'run', 'YPEC');
  }),

  // Daily 2:00 PM - Client lead follow-ups
  clientLeadFollowups: cron.schedule('0 14 * * *', () => {
    console.log('[YPEC] Client lead follow-ups (2pm daily)');
    callBot('/api/ypec/client-leads', 'run', 'YPEC');
  }),

  // ============================================================================
  // EXECUTIVE REPORTS - ATLAS & JORDAN
  // ============================================================================

  // Monday 8:00 AM - Weekly CEO report to ATLAS
  weeklyCEOReport: cron.schedule('0 8 * * 1', () => {
    console.log('[YPEC] Weekly CEO report to ATLAS (Monday 8am)');
    callBot('/api/ypec/atlas', 'weekly_ceo_report', 'YPEC');
  }),

  // 1st of Month 9:00 AM - Monthly legal report to ATLAS (via JORDAN)
  monthlyLegalReport: cron.schedule('0 9 1 * *', () => {
    console.log('[YPEC] Monthly legal report (1st of month 9am)');
    callBot('/api/ypec/jordan', 'monthly_legal_report', 'YPEC');
  }),

  // Quarterly (1st of Jan/Apr/Jul/Oct) 10:00 AM - Compliance audit
  quarterlyComplianceReview: cron.schedule('0 10 1 1,4,7,10 *', () => {
    console.log('[YPEC] Quarterly compliance review');
    callBot('/api/ypec/jordan', 'quarterly_compliance_review', 'YPEC');
  }),

  // ============================================================================
  // DAVE - AUTONOMOUS CFO (100% ACCOUNTABLE FOR $100M REVENUE)
  // ============================================================================

  // Daily 7:00 AM - DAVE's autonomous revenue operations
  daveAutonomousRun: cron.schedule('0 7 * * *', () => {
    console.log('[DAVE CFO] Running autonomous revenue operations (7am daily)');
    callBot('/api/ypec/dave', 'autonomous_run', 'YPEC');
  }),

  // Monday 9:00 AM - DAVE's weekly CFO report to Atlas
  daveWeeklyCFOReport: cron.schedule('0 9 * * 1', () => {
    console.log('[DAVE CFO] Weekly CFO report to Atlas (Monday 9am)');
    callBot('/api/ypec/dave', 'weekly_cfo_report', 'YPEC');
  }),

  // ============================================================================
  // ATLAS - AUTONOMOUS CEO (THE BRAIN)
  // ============================================================================

  // Daily 6:00 AM - ATLAS's autonomous strategic review
  atlasAutonomousRun: cron.schedule('0 6 * * *', () => {
    console.log('[ATLAS CEO] Running autonomous strategic review (6am daily)');
    callBot('/api/ypec/atlas', 'autonomous_run', 'YPEC');
  }),

  // Monday 8:00 AM - ATLAS's weekly strategic review & executive performance
  atlasWeeklyReview: cron.schedule('0 8 * * 1', () => {
    console.log('[ATLAS CEO] Weekly strategic review & executive performance (Monday 8am)');
    callBot('/api/ypec/atlas', 'weekly_strategic_review', 'YPEC');
  }),

  // ============================================================================
  // DAN - AUTONOMOUS CMO (100% ACCOUNTABLE FOR GROWTH)
  // ============================================================================

  // Daily 8:00 AM - DAN's autonomous growth operations
  danAutonomousRun: cron.schedule('0 8 * * *', () => {
    console.log('[DAN CMO] Running autonomous growth operations (8am daily)');
    callBot('/api/ypec/dan', 'autonomous_run', 'YPEC');
  }),

  // Friday 4:00 PM - DAN's weekly CMO report to Atlas
  danWeeklyCMOReport: cron.schedule('0 16 * * 5', () => {
    console.log('[DAN CMO] Weekly CMO report to Atlas (Friday 4pm)');
    callBot('/api/ypec/dan', 'weekly_cmo_report', 'YPEC');
  }),

  // ============================================================================
  // HENRY - AUTONOMOUS COO (100% ACCOUNTABLE FOR CAPACITY)
  // ============================================================================

  // Daily 9:00 AM - HENRY's autonomous capacity operations
  henryAutonomousRun: cron.schedule('0 9 * * *', () => {
    console.log('[HENRY COO] Running autonomous capacity operations (9am daily)');
    callBot('/api/ypec/henry', 'autonomous_run', 'YPEC');
  }),

  // Thursday 4:00 PM - HENRY's weekly COO report to Atlas
  henryWeeklyCOOReport: cron.schedule('0 16 * * 4', () => {
    console.log('[HENRY COO] Weekly COO report to Atlas (Thursday 4pm)');
    callBot('/api/ypec/henry', 'weekly_coo_report', 'YPEC');
  }),

  // ============================================================================
  // ANNIE - AUTONOMOUS CSO (100% ACCOUNTABLE FOR CONVERSION)
  // ============================================================================

  // Daily 10:00 AM - ANNIE's autonomous conversion operations
  annieAutonomousRun: cron.schedule('0 10 * * *', () => {
    console.log('[ANNIE CSO] Running autonomous conversion operations (10am daily)');
    callBot('/api/ypec/annie', 'autonomous_run', 'YPEC');
  }),

  // Friday 3:00 PM - ANNIE's weekly CSO report to Atlas
  annieWeeklyCSOReport: cron.schedule('0 15 * * 5', () => {
    console.log('[ANNIE CSO] Weekly CSO report to Atlas (Friday 3pm)');
    callBot('/api/ypec/annie', 'weekly_cso_report', 'YPEC');
  }),

  // ============================================================================
  // RECRUITMENT AGGREGATOR - MULTI-CHANNEL CHEF SOURCING
  // ============================================================================

  // Daily 6:00 AM - Aggregate chef leads from all channels
  recruitmentAggregator: cron.schedule('0 6 * * *', () => {
    console.log('[RECRUITMENT] Multi-channel chef sourcing (6am daily)');
    callBot('/api/ypec/recruitment-aggregator', 'autonomous_run', 'YPEC');
  })
};

// ============================================================================
// ALTERNATIVE: SINGLE CONFIGURATION EXPORT
// Use this if Forbes Command expects a different format
// ============================================================================

/*
module.exports = [
  {
    name: 'YPEC Lead Scraper',
    schedule: '0 6 * * *',
    endpoint: '/api/ypec/lead-scraper',
    action: 'run',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Process Inquiries',
    schedule: '0 7 * * *',
    endpoint: '/api/ypec/concierge',
    action: 'process_inquiries',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Sync Chef Availability',
    schedule: '0 8 * * *',
    endpoint: '/api/ypec/chef-relations',
    action: 'sync_availability',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Consultation Reminders',
    schedule: '0 9 * * *',
    endpoint: '/api/ypec/concierge',
    action: 'send_reminders',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Upcoming Events Check',
    schedule: '0 10 * * *',
    endpoint: '/api/ypec/operations',
    action: 'upcoming_events',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Daily Summary to HENRY',
    schedule: '0 18 * * *',
    endpoint: '/api/ypec/operations',
    action: 'daily_summary',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Chef Recruitment',
    schedule: '0 9 * * 1',
    endpoint: '/api/ypec/chef-relations',
    action: 'recruit',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Weekly Revenue Report',
    schedule: '0 16 * * 5',
    endpoint: '/api/ypec/revenue',
    action: 'weekly_report',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Monthly Invoices',
    schedule: '0 8 1 * *',
    endpoint: '/api/ypec/revenue',
    action: 'generate_invoices',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Marketing Daily Run',
    schedule: '0 23 * * *',
    endpoint: '/api/ypec/marketing',
    action: 'run',
    company: 'YPEC',
    enabled: true
  },
  {
    name: 'YPEC Revenue Daily Run',
    schedule: '0 0 * * *',
    endpoint: '/api/ypec/revenue',
    action: 'run',
    company: 'YPEC',
    enabled: true
  }
];
*/

// ============================================================================
// CRON SCHEDULE REFERENCE
// ============================================================================
/*
Format: minute hour day month weekday

*     *     *     *     *
│     │     │     │     │
│     │     │     │     └─ Day of Week (0-6, 0=Sunday)
│     │     │     └─────── Month (1-12)
│     │     └───────────── Day of Month (1-31)
│     └─────────────────── Hour (0-23)
└───────────────────────── Minute (0-59)

Examples:
  0 7 * * *        - Every day at 7:00 AM
  0 8 * * 1        - Every Monday at 8:00 AM
  0 16 * * 5       - Every Friday at 4:00 PM
  0 0 1 * *        - First day of every month at midnight
  star/15 * * * *  - Every 15 minutes (replace 'star' with *)
  0 star/2 * * *   - Every 2 hours (replace 'star' with *)
*/
