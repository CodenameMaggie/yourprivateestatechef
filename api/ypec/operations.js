// ============================================================================
// YPEC-OPERATIONS BOT
// Reports to: HENRY (COO - Chief Operating Officer)
// Purpose: Engagement management, event scheduling, logistics coordination
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');
const { hashPassword, verifyPassword, generateSecureToken } = require('./security');
const { validate, loginSchema } = require('./validation');
const { trackReferral, processReferralBonus } = require('./chef-referral');


const BOT_INFO = {
  name: 'YPEC-Operations',
  reports_to: 'Henry (COO)',
  supports: 'Annie (CSO) for customer service & Atlas (CEO) for operations oversight',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Engagement management, scheduling, logistics, event coordination',
  actions: ['status', 'engagements', 'schedule', 'upcoming', 'overdue', 'upcoming_events', 'daily_summary', 'run', 'admin_login', 'client_login', 'client_dashboard', 'chef_login', 'chef_dashboard', 'chef_application', 'chef_update_availability', 'get_chef_applications', 'update_chef_status']
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

      case 'chef_login':
        return await chefLogin(req, res, data);

      case 'chef_dashboard':
        return await chefDashboard(req, res, data);

      case 'chef_application':
        return await chefApplication(req, res, data);

      case 'chef_update_availability':
        return await chefUpdateAvailability(req, res, data);

      case 'get_chef_applications':
        return await getChefApplications(req, res);

      case 'update_chef_status':
        return await updateChefStatus(req, res, data);

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
    .from(TABLES.ENGAGEMENTS)
    .select('status')
    .eq('tenant_id', TENANT_ID);

  const { data: events } = await getSupabase()
    .from(TABLES.EVENTS)
    .select('status, event_date')
    .eq('tenant_id', TENANT_ID)
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
    .from(TABLES.ENGAGEMENTS)
    .select(`
      *,
      household:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email),
      chef:${TABLES.USERS}(first_name, last_name, email)
    `)
    .eq('tenant_id', TENANT_ID)
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

  const { data: event, error } = await tenantInsert(TABLES.EVENTS, {
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
  }).select().single();

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
    .from(TABLES.EVENTS)
    .select(`
      *,
      household:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email, primary_contact_phone),
      chef:${TABLES.USERS}(first_name, last_name, email, phone)
    `)
    .eq('tenant_id', TENANT_ID)
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
    .from(TABLES.EVENTS)
    .select(`
      *,
      household:${TABLES.CLIENTS}(primary_contact_name),
      chef:${TABLES.USERS}(first_name, last_name)
    `)
    .eq('tenant_id', TENANT_ID)
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
    .from(TABLES.EVENTS)
    .select(`
      *,
      household:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email),
      chef:${TABLES.USERS}(first_name, last_name, email)
    `)
    .eq('tenant_id', TENANT_ID)
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
    .from(TABLES.EVENTS)
    .select(`*, household:${TABLES.CLIENTS}(primary_contact_name), chef:${TABLES.USERS}(first_name, last_name)`)
    .eq('tenant_id', TENANT_ID)
    .eq('event_date', today);

  // Active engagements
  const { data: activeEngagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  // Upcoming events (next 7 days)
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const { data: upcomingEvents } = await getSupabase()
    .from(TABLES.EVENTS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
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
    let { email, password, encoded } = data;

    console.log(`[${BOT_INFO.name}] Admin login attempt: ${email}, encoded: ${encoded}`);

    // Decode base64 password if encoded (to bypass Railway JSON parser issues)
    if (encoded) {
      const originalEncoded = password;
      password = Buffer.from(password, 'base64').toString('utf-8');
      console.log(`[${BOT_INFO.name}] Decoded password from base64: ${originalEncoded.substring(0, 10)}... -> ${password.length} chars`);
    }

    // Validate input
    const { error: validationError } = validate({ email, password }, loginSchema);
    if (validationError) {
      console.warn(`[${BOT_INFO.name}] Validation failed: ${validationError.details.map(d => d.message).join(', ')}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: validationError.details.map(d => d.message).join(', ')
      });
    }

    console.log(`[${BOT_INFO.name}] Validation passed, querying database...`);

    // Check against staff table (admin users)
    const { data: staff, error } = await getSupabase()
      .from(TABLES.STAFF)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error) {
      console.error(`[${BOT_INFO.name}] Database error:`, error);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!staff) {
      console.warn(`[${BOT_INFO.name}] Admin login failed - staff not found for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`[${BOT_INFO.name}] Staff found: ${staff.full_name}, verifying password...`);

    // Verify password using bcrypt
    const isValidPassword = await verifyPassword(password, staff.password_hash);
    console.log(`[${BOT_INFO.name}] Password verification result: ${isValidPassword}`);

    if (!isValidPassword) {
      console.warn(`[${BOT_INFO.name}] Admin login failed - invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate secure session token
    const sessionToken = generateSecureToken('ypec_admin');

    // Store session in database
    const { error: sessionError } = await tenantInsert(TABLES.ADMIN_SESSIONS, {
      staff_id: staff.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      created_at: new Date().toISOString()
    });

    if (sessionError) {
      console.error(`[${BOT_INFO.name}] Session creation failed:`, sessionError);
      throw new Error(`Session creation failed: ${sessionError.message || 'Unknown error'}`);
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
    let { email, password, encoded } = data;

    // Decode base64 password if encoded (to bypass Railway JSON parser issues)
    if (encoded) {
      password = Buffer.from(password, 'base64').toString('utf-8');
    }

    // Validate input
    const { error: validationError } = validate({ email, password }, loginSchema);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: validationError.details.map(d => d.message).join(', ')
      });
    }

    console.log(`[${BOT_INFO.name}] Client login attempt for: ${email}`);

    // Find client/household with matching email and login enabled
    const { data: household, error } = await getSupabase()
      .from(TABLES.CLIENTS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('primary_contact_email', email)
      .eq('status', 'active')
      .single();

    if (error || !household) {
      console.warn(`[${BOT_INFO.name}] Client login failed - household not found or login disabled:`, error?.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password using bcrypt
    const isValidPassword = await verifyPassword(password, household.password_hash);
    if (!isValidPassword) {
      console.warn(`[${BOT_INFO.name}] Client login failed - invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate secure session token
    const sessionToken = generateSecureToken('ypec_client');

    // Store session in database
    const { error: sessionError } = await tenantInsert(TABLES.CLIENT_SESSIONS, {
      client_id: household.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      ip_address: (req.ip || req.connection?.remoteAddress || 'unknown'),
      user_agent: (req.headers?.['user-agent'] || 'unknown'),
      created_at: new Date().toISOString()
    });

    if (sessionError) {
      console.error(`[${BOT_INFO.name}] Session creation failed:`, sessionError);
      throw new Error(`Session creation failed: ${sessionError.message || 'Unknown error'}`);
    }

    // Update last login timestamp
    const { error: updateError } = await tenantUpdate(TABLES.CLIENTS, {
      last_login: new Date().toISOString()
    }).eq('id', household.id);

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
      .from(TABLES.ENGAGEMENTS)
      .select(`
        *,
        chef:${TABLES.USERS}(id, first_name, last_name)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('client_id', household_id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5);

    // Get assigned chefs (chefs who have served this household)
    const { data: chefEngs } = await getSupabase()
      .from(TABLES.ENGAGEMENTS)
      .select(`
        chef:${TABLES.USERS}(id, first_name, last_name, specialties)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('client_id', household_id)
      .not('assigned_user_id', 'is', null);

    // Extract unique chefs
    const uniqueChefs = [];
    const chefIds = new Set();
    if (chefEngs) {
      chefEngs.forEach(eng => {
        if (eng.chef && !chefIds.has(eng.chef.id)) {
          chefIds.add(eng.chef.id);
          uniqueChefs.push(eng.chef);
        }
      });
    }

    // Get recent invoices
    const { data: invoices } = await getSupabase()
      .from(TABLES.INVOICES)
      .select('*')
      .eq('tenant_id', TENANT_ID)
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
// CHEF PORTAL AUTHENTICATION
// ============================================================================

async function chefLogin(req, res, data) {
  try {
    let { email, password, encoded } = data;

    // Decode base64 password if encoded (to bypass Railway JSON parser issues)
    if (encoded) {
      password = Buffer.from(password, 'base64').toString('utf-8');
    }

    // Validate input
    const { error: validationError } = validate({ email, password }, loginSchema);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: validationError.details.map(d => d.message).join(', ')
      });
    }

    console.log(`[${BOT_INFO.name}] Chef login attempt for: ${email}`);

    // Find chef with matching email and login enabled
    const { data: chef, error } = await getSupabase()
      .from(TABLES.USERS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('email', email)
      .eq('login_enabled', true)
      .eq('status', 'active')
      .single();

    if (error || !chef) {
      console.warn(`[${BOT_INFO.name}] Chef login failed - chef not found or login disabled:`, error?.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password using bcrypt
    const isValidPassword = await verifyPassword(password, chef.password_hash);
    if (!isValidPassword) {
      console.warn(`[${BOT_INFO.name}] Chef login failed - invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate secure session token
    const sessionToken = generateSecureToken('ypec_chef');

    // Store session in database
    const { error: sessionError } = await tenantInsert(TABLES.CHEF_SESSIONS, {
      chef_id: chef.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      ip_address: (req.ip || req.connection?.remoteAddress || 'unknown'),
      user_agent: (req.headers?.['user-agent'] || 'unknown'),
      created_at: new Date().toISOString()
    });

    if (sessionError) {
      console.error(`[${BOT_INFO.name}] Chef session creation failed:`, sessionError);
      throw sessionError;
    }

    // Update last login timestamp
    const { error: updateError } = await tenantUpdate(TABLES.USERS, {
      last_login: new Date().toISOString()
    }).eq('id', chef.id);

    if (updateError) {
      console.warn(`[${BOT_INFO.name}] Last login update failed:`, updateError.message);
      // Don't fail the login if we can't update last_login
    }

    console.log(`[${BOT_INFO.name}] Chef login successful: ${chef.full_name}`);

    return res.json({
      success: true,
      session_token: sessionToken,
      chef_id: chef.id,
      chef_name: chef.full_name,
      message: 'Login successful'
    });
  } catch (error) {
    console.error(`[${BOT_INFO.name}] Chef login error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}

async function chefDashboard(req, res, data) {
  const { chef_id } = data;

  console.log(`[${BOT_INFO.name}] Loading dashboard for chef: ${chef_id}`);

  try {
    // Get chef info
    const { data: chef } = await getSupabase()
      .from(TABLES.USERS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('id', chef_id)
      .single();

    // Get assigned households
    const { data: householdEngagements } = await getSupabase()
      .from(TABLES.ENGAGEMENTS)
      .select(`
        client:${TABLES.CLIENTS}(id, primary_contact_name, city, state)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('assigned_user_id', chef_id)
      .eq('status', 'active');

    // Extract unique households
    const households = [];
    const householdIds = new Set();
    if (householdEngagements) {
      householdEngagements.forEach(eng => {
        if (eng.client && !householdIds.has(eng.client.id)) {
          householdIds.add(eng.client.id);
          households.push({
            id: eng.client.id,
            name: eng.client.primary_contact_name,
            location: eng.client.city && eng.client.state ? `${eng.client.city}, ${eng.client.state}` : null,
            frequency: 'Weekly' // TODO: Get actual frequency from engagement
          });
        }
      });
    }

    // Get upcoming engagements
    const { data: engagements } = await getSupabase()
      .from(TABLES.ENGAGEMENTS)
      .select(`
        *,
        client:${TABLES.CLIENTS}(primary_contact_name)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('assigned_user_id', chef_id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5);

    // Format engagements
    const formattedEngagements = engagements ? engagements.map(eng => ({
      date: eng.event_date,
      household_name: eng.client?.primary_contact_name || 'Unknown',
      service_type: eng.engagement_type,
      time: eng.event_time || '6:00 PM'
    })) : [];

    // Get earnings (from completed engagements)
    const { data: completedEngagements } = await getSupabase()
      .from(TABLES.ENGAGEMENTS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('assigned_user_id', chef_id)
      .eq('status', 'completed')
      .order('event_date', { ascending: false })
      .limit(10);

    const earnings = completedEngagements ? completedEngagements.map(eng => ({
      service_name: eng.service_name || 'Private Chef Service',
      date: eng.event_date,
      amount: eng.total_cost || 0
    })) : [];

    // Calculate stats
    const monthlyEarnings = completedEngagements
      ? completedEngagements
          .filter(eng => {
            const engDate = new Date(eng.event_date);
            const now = new Date();
            return engDate.getMonth() === now.getMonth() && engDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, eng) => sum + (parseFloat(eng.total_cost) || 0), 0)
      : 0;

    const weeklyServices = engagements
      ? engagements.filter(eng => {
          const engDate = new Date(eng.event_date);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return engDate <= weekFromNow;
        }).length
      : 0;

    return res.json({
      success: true,
      data: {
        stats: {
          households: households.length,
          weeklyServices: weeklyServices,
          monthlyEarnings: monthlyEarnings.toFixed(2),
          rating: chef?.rating || 5.0
        },
        households: households,
        engagements: formattedEngagements,
        earnings: earnings
      }
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Error loading chef dashboard:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
}

async function chefApplication(req, res, data) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      yearsExperience,
      specialties,
      culinaryEducation,
      previousPositions,
      bio,
      backgroundConsent,
      termsConsent,
      files
    } = data;

    console.log(`[${BOT_INFO.name}] Processing chef application for: ${email}`);

    // Check if chef already exists
    const { data: existing } = await getSupabase()
      .from(TABLES.USERS)
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An application with this email already exists'
      });
    }

    // Create chef record
    const { data: newChef, error: insertError } = await tenantInsert(TABLES.USERS, {
      user_type: 'chef',
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      location: location,
      years_experience: parseInt(yearsExperience),
      specialties: specialties,
      culinary_education: culinaryEducation,
      bio: bio,
      previous_positions: previousPositions,
      status: 'pending', // Application needs to be reviewed
      login_enabled: false, // Enable after approval
      created_at: new Date().toISOString()
    }).select().single();

    if (insertError) {
      console.error(`[${BOT_INFO.name}] Chef application insert error:`, insertError);
      throw insertError;
    }

    // Track referral if referral code provided
    if (data.referralCode) {
      await trackReferral(data.referralCode, newChef.id);
    }

    // TODO: Store uploaded files in cloud storage (S3, etc.)
    // TODO: Send notification to admin about new application
    // TODO: Send confirmation email to chef

    console.log(`[${BOT_INFO.name}] Chef application created: ${newChef.id}`);

    return res.json({
      success: true,
      message: 'Application submitted successfully',
      chef_id: newChef.id
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Chef application error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Application submission failed',
      error: error.message
    });
  }
}

async function chefUpdateAvailability(req, res, data) {
  try {
    const { chef_id, available } = data;

    console.log(`[${BOT_INFO.name}] Updating availability for chef ${chef_id}: ${available}`);

    const { error } = await tenantUpdate(TABLES.USERS, {
      availability_status: available ? 'available' : 'unavailable',
      updated_at: new Date().toISOString()
    }).eq('id', chef_id);

    if (error) {
      console.error(`[${BOT_INFO.name}] Availability update error:`, error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Availability updated successfully'
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Availability update error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
}

// ============================================================================
// CHEF APPLICATIONS MANAGEMENT
// ============================================================================

async function getChefApplications(req, res) {
  try {
    console.log(`[${BOT_INFO.name}] Fetching all chef applications`);

    const { data: applications, error } = await getSupabase()
      .from(TABLES.USERS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('user_type', 'chef')
      .order('created_at', { ascending: false});

    if (error) {
      console.error(`[${BOT_INFO.name}] Error fetching applications:`, error);
      throw error;
    }

    return res.json({
      success: true,
      applications: applications || [],
      total: applications?.length || 0
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Get applications error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
}

async function updateChefStatus(req, res, data) {
  try {
    const { chef_id, status, notes } = data;

    console.log(`[${BOT_INFO.name}] Updating chef ${chef_id} status to: ${status}`);

    // Validate status
    const validStatuses = ['pending', 'screening', 'onboarding', 'active', 'rejected', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update chef record
    const updates = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Set login_enabled based on status
    if (status === 'active') {
      updates.login_enabled = true;
      updates.onboarding_date = new Date().toISOString();
    } else if (status === 'rejected' || status === 'inactive') {
      updates.login_enabled = false;
    }

    // Add notes if provided
    if (notes) {
      updates.admin_notes = notes;
    }

    const { error } = await tenantUpdate(TABLES.USERS, updates)
      .eq('id', chef_id);

    if (error) {
      console.error(`[${BOT_INFO.name}] Status update error:`, error);
      throw error;
    }

    // Send notification to chef based on status
    if (status === 'active') {
      // TODO: Send welcome email and login credentials
      console.log(`[${BOT_INFO.name}] Chef ${chef_id} activated - welcome email needed`);
    } else if (status === 'rejected') {
      // TODO: Send rejection email
      console.log(`[${BOT_INFO.name}] Chef ${chef_id} rejected - notification email needed`);
    } else if (status === 'screening') {
      // TODO: Send screening instructions
      console.log(`[${BOT_INFO.name}] Chef ${chef_id} moved to screening`);
    }

    // Process referral bonus if applicable
    await processReferralBonus(chef_id, status);

    // Alert HENRY if chef was activated
    if (status === 'active') {
      await mfs.sendReport('HENRY', {
        bot_name: 'YPEC-Operations',
        type: 'chef_activated',
        priority: 'normal',
        subject: 'New Chef Activated',
        data: {
          chef_id: chef_id,
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.json({
      success: true,
      message: `Chef status updated to: ${status}`,
      chef_id: chef_id,
      new_status: status
    });

  } catch (error) {
    console.error(`[${BOT_INFO.name}] Update chef status error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chef status',
      error: error.message
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
