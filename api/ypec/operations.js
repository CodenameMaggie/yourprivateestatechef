// ============================================================================
// YPEC-OPERATIONS BOT
// Reports to: HENRY (COO - Chief Operating Officer)
// Purpose: Engagement management, event scheduling, logistics coordination
// ============================================================================

const { getSupabase } = require('./database');
const mfs = require('./mfs-integration');


const BOT_INFO = {
  name: 'YPEC-Operations',
  reports_to: 'HENRY (COO)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Engagement management, scheduling, logistics, event coordination',
  actions: ['status', 'engagements', 'schedule', 'upcoming', 'overdue', 'upcoming_events', 'daily_summary', 'run']
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'engagements':
        return await getEngagements(req, res);

      case 'schedule':
        return await scheduleEvent(req, res, data);

      case 'upcoming':
        return await getUpcomingEvents(req, res);

      case 'overdue':
        return await getOverdueEvents(req, res);

      case 'upcoming_events':
        return await upcomingEventsCheck(req, res);

      case 'daily_summary':
        return await sendDailySummary(req, res);

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
  const { data: engagements } = await getSupabase()
    .from('ypec_engagements')
    .select('status');

  const { data: events } = await getSupabase()
    .from('ypec_events')
    .select('status, event_date')
    .gte('event_date', new Date().toISOString().split('T')[0]);

  const grouped = {
    active_engagements: engagements?.filter(e => e.status === 'active').length || 0,
    pending_engagements: engagements?.filter(e => e.status === 'pending').length || 0,
    paused_engagements: engagements?.filter(e => e.status === 'paused').length || 0,
    upcoming_events: events?.filter(e => e.status === 'scheduled' || e.status === 'confirmed').length || 0
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: {
      total_engagements: engagements?.length || 0,
      total_upcoming_events: events?.length || 0,
      ...grouped
    },
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET ENGAGEMENTS
// ============================================================================

async function getEngagements(req, res) {
  const { data: engagements, error } = await getSupabase()
    .from('ypec_engagements')
    .select(`
      *,
      household:ypec_households(primary_contact_name, email),
      chef:ypec_chefs(full_name, email)
    `)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return res.json({
    success: true,
    total: engagements?.length || 0,
    engagements
  });
}

// ============================================================================
// SCHEDULE EVENT
// ============================================================================

async function scheduleEvent(req, res, data) {
  const {
    engagement_id,
    household_id,
    chef_id,
    event_date,
    start_time,
    end_time,
    event_type,
    guest_count,
    special_requests,
    menu_id
  } = data;

  console.log(`[${BOT_INFO.name}] Scheduling event for ${event_date}`);

  const { data: event, error } = await getSupabase()
    .from('ypec_events')
    .insert({
      engagement_id,
      household_id,
      chef_id,
      event_date,
      start_time,
      end_time,
      event_type,
      guest_count,
      special_requests,
      menu_id,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) throw error;

  // Send confirmation emails to household and chef
  await sendEventConfirmation(event);

  console.log(`[${BOT_INFO.name}] Event scheduled: ${event.id}`);

  return res.json({
    success: true,
    event_id: event.id,
    event_date: event.event_date,
    message: 'Event scheduled successfully'
  });
}

// ============================================================================
// GET UPCOMING EVENTS
// ============================================================================

async function getUpcomingEvents(req, res) {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const { data: events, error } = await getSupabase()
    .from('ypec_events')
    .select(`
      *,
      household:ypec_households(primary_contact_name, email, phone),
      chef:ypec_chefs(full_name, email, phone)
    `)
    .gte('event_date', today)
    .lte('event_date', nextWeekStr)
    .in('status', ['scheduled', 'confirmed'])
    .order('event_date');

  if (error) throw error;

  // Group by date
  const grouped = {};
  events?.forEach(event => {
    const date = event.event_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(event);
  });

  return res.json({
    success: true,
    total: events?.length || 0,
    by_date: grouped,
    events
  });
}

// ============================================================================
// GET OVERDUE EVENTS
// ============================================================================

async function getOverdueEvents(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const { data: events, error } = await getSupabase()
    .from('ypec_events')
    .select(`
      *,
      household:ypec_households(primary_contact_name),
      chef:ypec_chefs(full_name)
    `)
    .lt('event_date', today)
    .eq('status', 'scheduled')
    .order('event_date');

  if (error) throw error;

  return res.json({
    success: true,
    overdue_count: events?.length || 0,
    events
  });
}

// ============================================================================
// UPCOMING EVENTS CHECK (Cron - Daily 10am)
// ============================================================================

async function upcomingEventsCheck(req, res) {
  console.log(`[${BOT_INFO.name}] Checking upcoming events (cron)`);

  const today = new Date().toISOString().split('T')[0];
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().split('T')[0];

  const { data: events } = await getSupabase()
    .from('ypec_events')
    .select(`
      *,
      household:ypec_households(primary_contact_name, email),
      chef:ypec_chefs(full_name, email)
    `)
    .gte('event_date', today)
    .lte('event_date', next7DaysStr)
    .in('status', ['scheduled', 'confirmed']);

  // Send reminders for events within 3 days
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  const threeDaysStr = threeDays.toISOString().split('T')[0];

  const upcomingSoon = events?.filter(e => e.event_date <= threeDaysStr) || [];

  for (const event of upcomingSoon) {
    await sendEventReminder(event);
  }

  console.log(`[${BOT_INFO.name}] Sent ${upcomingSoon.length} event reminders`);

  return res.json({
    success: true,
    total_upcoming: events?.length || 0,
    reminders_sent: upcomingSoon.length,
    events_by_status: {
      this_week: events?.length || 0,
      needs_confirmation: events?.filter(e => e.status === 'scheduled').length || 0,
      confirmed: events?.filter(e => e.status === 'confirmed').length || 0
    }
  });
}

// ============================================================================
// DAILY SUMMARY (Cron - Daily 6pm to HENRY)
// ============================================================================

async function sendDailySummary(req, res) {
  console.log(`[${BOT_INFO.name}] Generating daily summary for HENRY (cron)`);

  const today = new Date().toISOString().split('T')[0];

  // Today's events
  const { data: todayEvents } = await getSupabase()
    .from('ypec_events')
    .select('*, household:ypec_households(primary_contact_name), chef:ypec_chefs(full_name)')
    .eq('event_date', today);

  // Active engagements
  const { data: activeEngagements } = await getSupabase()
    .from('ypec_engagements')
    .select('id')
    .eq('status', 'active');

  // Upcoming events (next 7 days)
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const { data: upcomingEvents } = await getSupabase()
    .from('ypec_events')
    .select('id')
    .gte('event_date', today)
    .lte('event_date', next7Days.toISOString().split('T')[0])
    .in('status', ['scheduled', 'confirmed']);

  const summary = {
    date: today,
    events_today: todayEvents?.length || 0,
    active_engagements: activeEngagements?.length || 0,
    upcoming_week: upcomingEvents?.length || 0,
    today_events_detail: todayEvents
  };

  // Send to HENRY (COO)
  await mfs.sendDailySummaryToHenry(summary);
  console.log(`[${BOT_INFO.name}] Daily summary sent to HENRY:`, summary);

  return res.json({
    success: true,
    summary
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  await upcomingEventsCheck(req, null);

  return res.json({
    success: true,
    message: 'Daily run completed',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EMAIL/NOTIFICATION FUNCTIONS
// ============================================================================

async function sendEventConfirmation(event) {
  console.log(`[${BOT_INFO.name}] Event confirmation prepared for event ${event.id}`);
  // TODO: Send confirmation to household and chef
}

async function sendEventReminder(event) {
  console.log(`[${BOT_INFO.name}] Event reminder prepared for ${event.event_date}`);
  // TODO: Send reminder to household and chef
}
