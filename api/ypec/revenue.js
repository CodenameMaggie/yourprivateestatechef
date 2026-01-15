// ============================================================================
// YPEC-REVENUE BOT
// Reports to: DAVE (CFO - Chief Financial Officer)
// Purpose: Revenue tracking, invoicing, payments, financial reporting
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');


const BOT_INFO = {
  name: 'YPEC-Revenue',
  reports_to: 'Dave (CFO)',
  supports: 'Atlas (CEO) for financial oversight & Henry (COO) for operational finance',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Revenue tracking, invoicing, payments, financial reporting',
  actions: ['status', 'revenue', 'invoices', 'payments', 'forecast', 'report', 'generate_invoices', 'weekly_report', 'run']
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'revenue':
        return await getRevenue(req, res, data);

      case 'invoices':
        return await getInvoices(req, res);

      case 'payments':
        return await getPayments(req, res);

      case 'forecast':
        return await forecastRevenue(req, res);

      case 'report':
        return await generateReport(req, res, data);

      case 'generate_invoices':
        return await generateMonthlyInvoices(req, res);

      case 'weekly_report':
        return await sendWeeklyReport(req, res);

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
  // This month's revenue
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('total, status, invoice_date')
    .eq('tenant_id', TENANT_ID)
    .gte('invoice_date', `${thisMonth}-01`);

  const totalRevenue = invoices
    ?.filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;

  const pending = invoices
    ?.filter(i => i.status === 'sent')
    .reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;

  const overdue = invoices
    ?.filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: {
      this_month_revenue: totalRevenue.toFixed(2),
      pending_invoices: pending.toFixed(2),
      overdue_invoices: overdue.toFixed(2),
      total_invoices: invoices?.length || 0
    },
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET REVENUE
// ============================================================================

async function getRevenue(req, res, data) {
  const { period } = data || {};

  let startDate;
  if (period === 'month') {
    startDate = new Date();
    startDate.setDate(1);
  } else if (period === 'quarter') {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (period === 'year') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    startDate = new Date('2020-01-01'); // All time
  }

  const { data: invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .gte('invoice_date', startDate.toISOString().split('T')[0])
    .order('invoice_date', { ascending: false });

  const revenue = {
    paid: 0,
    pending: 0,
    overdue: 0
  };

  invoices?.forEach(inv => {
    const amount = parseFloat(inv.total || 0);
    if (inv.status === 'paid') revenue.paid += amount;
    else if (inv.status === 'sent') revenue.pending += amount;
    else if (inv.status === 'overdue') revenue.overdue += amount;
  });

  return res.json({
    success: true,
    period: period || 'all-time',
    revenue: {
      paid: revenue.paid.toFixed(2),
      pending: revenue.pending.toFixed(2),
      overdue: revenue.overdue.toFixed(2),
      total: (revenue.paid + revenue.pending + revenue.overdue).toFixed(2)
    },
    invoice_count: invoices?.length || 0
  });
}

// ============================================================================
// GET INVOICES
// ============================================================================

async function getInvoices(req, res) {
  const { data: invoices, error } = await getSupabase()
    .from(TABLES.INVOICES)
    .select(`
      *,
      client:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('invoice_date', { ascending: false })
    .limit(100);

  if (error) throw error;

  const grouped = {
    draft: invoices?.filter(i => i.status === 'draft') || [],
    sent: invoices?.filter(i => i.status === 'sent') || [],
    paid: invoices?.filter(i => i.status === 'paid') || [],
    overdue: invoices?.filter(i => i.status === 'overdue') || []
  };

  return res.json({
    success: true,
    total: invoices?.length || 0,
    grouped,
    invoices
  });
}

// ============================================================================
// GET PAYMENTS (Chef Payments)
// ============================================================================

async function getPayments(req, res) {
  const { data: payments, error } = await getSupabase()
    .from(TABLES.CHEF_PAYMENTS)
    .select(`
      *,
      chef:${TABLES.USERS}(first_name, last_name, email)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('payment_date', { ascending: false })
    .limit(100);

  if (error) throw error;

  return res.json({
    success: true,
    total: payments?.length || 0,
    payments
  });
}

// ============================================================================
// FORECAST REVENUE
// ============================================================================

async function forecastRevenue(req, res) {
  console.log(`[${BOT_INFO.name}] Forecasting revenue`);

  // Get all active engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  let monthlyRecurring = 0;

  engagements?.forEach(eng => {
    const rate = parseFloat(eng.rate || 0);

    if (eng.rate_type === 'per_week') {
      monthlyRecurring += rate * 4.33; // Avg weeks per month
    } else if (eng.rate_type === 'per_month') {
      monthlyRecurring += rate;
    }
  });

  // Get upcoming events
  const today = new Date().toISOString().split('T')[0];
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  const { data: upcomingEvents } = await getSupabase()
    .from(TABLES.EVENTS)
    .select(`*, engagement:${TABLES.ENGAGEMENTS}(total_cost, payment_status)`)
    .eq('tenant_id', TENANT_ID)
    .gte('event_date', today)
    .lte('event_date', next30Days.toISOString().split('T')[0])
    .in('status', ['scheduled', 'confirmed']);

  let eventRevenue = 0;
  upcomingEvents?.forEach(event => {
    if (event.engagement?.rate_type === 'per_event') {
      eventRevenue += parseFloat(event.engagement.rate || 0);
    }
  });

  const forecast = {
    monthly_recurring: monthlyRecurring.toFixed(2),
    next_30_days_events: eventRevenue.toFixed(2),
    total_forecast: (monthlyRecurring + eventRevenue).toFixed(2),
    active_engagements: engagements?.length || 0,
    upcoming_events: upcomingEvents?.length || 0
  };

  console.log(`[${BOT_INFO.name}] Forecast:`, forecast);

  return res.json({
    success: true,
    forecast
  });
}

// ============================================================================
// GENERATE REPORT
// ============================================================================

async function generateReport(req, res, data) {
  const { period } = data || { period: 'month' };

  const revenueData = await getRevenue({ body: { data: { period } } }, null, { period });
  const forecastData = await forecastRevenue({ body: {} }, null);

  const report = {
    generated_at: new Date().toISOString(),
    period,
    revenue: revenueData?.revenue,
    forecast: forecastData?.forecast
  };

  console.log(`[${BOT_INFO.name}] Report generated:`, report);

  return res.json({
    success: true,
    report
  });
}

// ============================================================================
// GENERATE MONTHLY INVOICES (Cron - 1st of Month 8am)
// ============================================================================

async function generateMonthlyInvoices(req, res) {
  console.log(`[${BOT_INFO.name}] Generating monthly invoices (cron)`);

  const thisMonth = new Date().toISOString().slice(0, 7);

  // Get active weekly/monthly engagements
  const { data: engagements } = await getSupabase()
    .from(TABLES.ENGAGEMENTS)
    .select(`
      *,
      client:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  let created = 0;

  for (const eng of engagements || []) {
    // Check if invoice already exists for this month
    const { data: existing } = await getSupabase()
      .from(TABLES.INVOICES)
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('engagement_id', eng.id)
      .gte('invoice_date', `${thisMonth}-01`)
      .lte('invoice_date', `${thisMonth}-31`);

    if (existing && existing.length > 0) {
      console.log(`[${BOT_INFO.name}] Invoice already exists for engagement ${eng.id}`);
      continue;
    }

    // Calculate amount
    let subtotal = parseFloat(eng.rate || 0);
    if (eng.rate_type === 'per_week') {
      subtotal *= 4.33; // Avg weeks per month
    }

    const tax = 0; // TODO: Calculate tax if applicable
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = `YPEC-${thisMonth}-${String(created + 1).padStart(4, '0')}`;

    // Create invoice
    const { error } = await tenantInsert(TABLES.INVOICES, {
      client_id: eng.client_id,
      engagement_id: eng.id,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days
      subtotal,
      tax,
      total,
      status: 'draft',
      metadata: {
        line_items: [{
          description: `${eng.engagement_type || 'service'} - ${thisMonth}`,
          quantity: 1,
          rate: subtotal,
          amount: subtotal
        }]
      }
    });

    if (error) {
      console.error(`[${BOT_INFO.name}] Error creating invoice:`, error);
    } else {
      created++;
      console.log(`[${BOT_INFO.name}] Created invoice: ${invoiceNumber}`);
    }
  }

  return res.json({
    success: true,
    invoices_created: created,
    month: thisMonth
  });
}

// ============================================================================
// WEEKLY REPORT (Cron - Friday 4pm)
// ============================================================================

async function sendWeeklyReport(req, res) {
  console.log(`[${BOT_INFO.name}] Generating weekly revenue report for DAVE (cron)`);

  // Get revenue data
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const weekStart = startOfWeek.toISOString().split('T')[0];

  const { data: invoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .gte('invoice_date', weekStart);

  const revenue = {
    paid: 0,
    pending: 0,
    overdue: 0
  };

  invoices?.forEach(inv => {
    const amount = parseFloat(inv.total || 0);
    if (inv.status === 'paid') revenue.paid += amount;
    else if (inv.status === 'sent') revenue.pending += amount;
    else if (inv.status === 'overdue') revenue.overdue += amount;
  });

  // Get forecast
  const forecastResponse = await forecastRevenue({ body: {} }, null);

  // Send to DAVE (CFO)
  await mfs.sendWeeklyReportToDave({
    week_start: weekStart,
    revenue,
    forecast: forecastResponse?.forecast,
    week_over_week_change: 0 // TODO: Calculate actual week-over-week
  });

  return res.json({
    success: true,
    message: 'Weekly report sent to DAVE',
    revenue,
    forecast: forecastResponse?.forecast
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Check for overdue invoices
  const today = new Date().toISOString().split('T')[0];

  const { data: overdueInvoices } = await getSupabase()
    .from(TABLES.INVOICES)
    .select(`
      *,
      client:${TABLES.CLIENTS}(primary_contact_name, primary_contact_email)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'sent')
    .lt('due_date', today);

  if (overdueInvoices && overdueInvoices.length > 0) {
    // Mark as overdue
    for (const invoice of overdueInvoices) {
      await tenantUpdate(TABLES.INVOICES, { status: 'overdue' })
        .eq('id', invoice.id);
    }

    console.log(`[${BOT_INFO.name}] Marked ${overdueInvoices.length} invoices as overdue`);

    // Alert DAVE (CFO) about overdue invoices
    await mfs.alertDaveOverdueInvoices(overdueInvoices);
  }

  return res.json({
    success: true,
    message: 'Daily run completed',
    overdue_invoices_updated: overdueInvoices?.length || 0,
    timestamp: new Date().toISOString()
  });
}
