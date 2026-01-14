// ============================================================================
// YPEC-OPERATIONS BOT
// Reports to: HENRY (COO - Chief Operating Officer)
// Purpose: Engagement management, event scheduling, logistics coordination
// ============================================================================

const { getSupabase } = require('./database');
const mfs = require('./mfs-integration');


const BOT_INFO = {
  name: 'YPEC-Operations',
  reports_to: 'DAN (CMO)',
  supports: 'HENRY (CEO - Operations) & ANNIE (Customer Service - Events/Bookings)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Engagement management, scheduling, logistics, event coordination',
  actions: ['status', 'engagements', 'schedule', 'upcoming', 'overdue', 'upcoming_events', 'daily_summary', 'run', 'admin_login', 'client_login', 'client_dashboard']
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

      case 'admin_login':
        return await adminLogin(req, res, data);

      case 'client_login':
        return await clientLogin(req, res, data);

      case 'client_dashboard':
        return await clientDashboard(req, res, data);

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
// ADMIN LOGIN
// ============================================================================

async function adminLogin(req, res, data) {
  try {
    const { email, password } = data;

    console.log(`[${BOT_INFO.name}] Admin login attempt: ${email}`);

    // Check against ypec_staff table (admin users)
    const { data: staff, error } = await getSupabase()
      .from('ypec_staff')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !staff) {
      console.warn(`[${BOT_INFO.name}] Admin login failed - staff not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // TODO: Implement proper password hashing with bcrypt
    // For now, using simple comparison (REPLACE THIS IN PRODUCTION)
    if (staff.password_hash !== password) {
      console.warn(`[${BOT_INFO.name}] Admin login failed - invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate session token (simple UUID-like for now)
    const sessionToken = `ypec_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Store session in database
    const { error: sessionError } = await getSupabase()
      .from('ypec_admin_sessions')
      .insert({
        staff_id: staff.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error(`[${BOT_INFO.name}] Session creation failed:`, sessionError);
      throw sessionError;
    }

    console.log(`[${BOT_INFO.name}] Admin login successful: ${staff.full_name}`);

    return res.json({
      success: true,
      session_token: sessionToken,
      user: {
        name: staff.full_name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Admin login error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}

// ============================================================================
// CLIENT PORTAL AUTHENTICATION
// ============================================================================

async function clientLogin(req, res, data) {
  try {
    const { email, password } = data;

    console.log(`[${BOT_INFO.name}] Client login attempt for: ${email}`);

    // Find household with matching email and login enabled
    const { data: household, error } = await getSupabase()
      .from('ypec_households')
      .select('*')
      .eq('email', email)
      .eq('login_enabled', true)
      .eq('status', 'active')
      .single();

    if (error || !household) {
      console.warn(`[${BOT_INFO.name}] Client login failed - household not found or login disabled:`, error?.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // TODO: Implement proper password hashing with bcrypt
    // For now, using simple comparison (REPLACE THIS IN PRODUCTION)
    if (household.password_hash !== password) {
      console.warn(`[${BOT_INFO.name}] Client login failed - invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate session token
    const sessionToken = `ypec_client_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Store session in database
    const { error: sessionError } = await getSupabase()
      .from('ypec_household_sessions')
      .insert({
        household_id: household.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        ip_address: (req.ip || req.connection?.remoteAddress || 'unknown'),
        user_agent: (req.headers?.['user-agent'] || 'unknown'),
        created_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error(`[${BOT_INFO.name}] Session creation failed:`, sessionError);
      throw sessionError;
    }

    // Update last login timestamp
    const { error: updateError } = await getSupabase()
      .from('ypec_households')
      .update({ last_login: new Date().toISOString() })
      .eq('id', household.id);

    if (updateError) {
      console.warn(`[${BOT_INFO.name}] Last login update failed:`, updateError.message);
      // Don't fail the login if we can't update last_login
    }

    console.log(`[${BOT_INFO.name}] Client login successful: ${household.household_name || household.primary_contact_name}`);

    return res.json({
      success: true,
      session_token: sessionToken,
      household_id: household.id,
      household_name: household.household_name || household.primary_contact_name,
      message: 'Login successful'
    });
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Client login error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}

async function clientDashboard(req, res, data) {
  const { household_id } = data;

  console.log(`[${BOT_INFO.name}] Loading dashboard for household: ${household_id}`);

  try {
    // Get upcoming engagements
    const { data: engagements } = await getSupabase()
      .from('ypec_engagements')
      .select(`
        *,
        chef:ypec_chefs(first_name, last_name)
      `)
      .eq('household_id', household_id)
      .gte('service_date', new Date().toISOString().split('T')[0])
      .order('service_date', { ascending: true })
      .limit(5);

    // Get assigned chefs (chefs who have served this household)
    const { data: chefs } = await getSupabase()
      .from('ypec_engagements')
      .select(`
        chef:ypec_chefs(id, first_name, last_name, specialties)
      `)
      .eq('household_id', household_id)
      .not('chef_id', 'is', null);

    // Extract unique chefs
    const uniqueChefs = [];
    const chefIds = new Set();
    if (chefs) {
      chefs.forEach(eng => {
        if (eng.chef && !chefIds.has(eng.chef.id)) {
          chefIds.add(eng.chef.id);
          uniqueChefs.push(eng.chef);
        }
      });
    }

    // Get recent invoices
    const { data: invoices } = await getSupabase()
      .from('ypec_invoices')
      .select('*')
      .eq('household_id', household_id)
      .order('invoice_date', { ascending: false })
      .limit(5);

    // Format engagements with chef names
    const formattedEngagements = engagements ? engagements.map(eng => ({
      ...eng,
      chef_name: eng.chef ? `${eng.chef.first_name} ${eng.chef.last_name}` : null
    })) : [];

    return res.json({
      success: true,
      engagements: formattedEngagements,
      chefs: uniqueChefs,
      invoices: invoices || []
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Error loading dashboard:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
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
