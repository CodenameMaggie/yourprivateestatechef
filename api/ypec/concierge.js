// ============================================================================
// YPEC-CONCIERGE BOT
// Reports to: ANNIE (CSO - Chief Support Officer)
// Purpose: Client-facing communication, inquiry handling, consultation scheduling
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');

const BOT_INFO = {
  name: 'YPEC-Concierge',
  reports_to: 'DAN (CMO)',
  supports: 'ANNIE (Customer Service) & HENRY (CEO - Customer Relationships)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Client inquiries, consultations, household onboarding',
  actions: ['status', 'inquiries', 'schedule', 'acknowledge', 'assign', 'process_inquiries', 'send_reminders', 'run']
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'inquiries':
        return await getInquiries(req, res);

      case 'acknowledge':
        return await acknowledgeInquiry(req, res, data);

      case 'schedule':
        return await scheduleConsultation(req, res, data);

      case 'assign':
        return await assignChef(req, res, data);

      case 'process_inquiries':
        return await processNewInquiries(req, res);

      case 'send_reminders':
        return await sendConsultationReminders(req, res);

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
  const { data: inquiries } = await getSupabase()
    .from(TABLES.LEADS)
    .select('status')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'new');

  const { data: consultations } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('status')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'consultation_scheduled');

  const { data: activeHouseholds } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: {
      new_inquiries: inquiries?.length || 0,
      scheduled_consultations: consultations?.length || 0,
      active_households: activeHouseholds?.length || 0
    },
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET INQUIRIES
// ============================================================================

async function getInquiries(req, res) {
  const { data: inquiries, error } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const grouped = {
    new: inquiries.filter(i => i.status === 'new'),
    reviewing: inquiries.filter(i => i.status === 'reviewing'),
    responded: inquiries.filter(i => i.status === 'responded'),
    scheduled: inquiries.filter(i => i.status === 'consultation_scheduled'),
    converted: inquiries.filter(i => i.status === 'converted')
  };

  return res.json({
    success: true,
    total: inquiries.length,
    grouped,
    inquiries
  });
}

// ============================================================================
// ACKNOWLEDGE INQUIRY (receives email)
// ============================================================================

async function acknowledgeInquiry(req, res, data) {
  const { email, name, phone, city, state, message, service_interest, referral_source } = data;

  console.log(`[${BOT_INFO.name}] New inquiry from: ${name} <${email}>`);

  // Create inquiry/lead record
  const { data: inquiry, error } = await tenantInsert(TABLES.LEADS, {
    lead_type: 'inquiry',
    name,
    email,
    phone,
    city,
    state,
    message,
    service_interest,
    referral_source,
    status: 'new'
  }).select().single();

  if (error) {
    console.error('Error creating inquiry:', error);
    throw error;
  }

  // Log communication
  await tenantInsert(TABLES.COMMUNICATIONS, {
    direction: 'inbound',
    from_contact: email,
    subject: 'Introduction Request',
    message: message,
    channel: 'email',
    status: 'received',
    metadata: { lead_id: inquiry.id }
  });

  // Send acknowledgment email
  await sendAcknowledgmentEmail(name, email);

  // Update inquiry status
  await tenantUpdate(TABLES.LEADS, {
    status: 'responded',
    contacted_at: new Date().toISOString()
  }).eq('id', inquiry.id);

  // Notify ANNIE (CSO) of new inquiry
  await mfs.notifyAnnieNewInquiry(inquiry);

  // Log outbound communication
  await tenantInsert(TABLES.COMMUNICATIONS, {
    direction: 'outbound',
    from_contact: 'YPEC-Concierge',
    to_contact: email,
    subject: "We've received your introduction request",
    channel: 'email',
    status: 'sent',
    metadata: { lead_id: inquiry.id }
  });

  console.log(`[${BOT_INFO.name}] Inquiry acknowledged: ${inquiry.id}`);

  return res.json({
    success: true,
    inquiry_id: inquiry.id,
    message: 'Inquiry acknowledged and email sent'
  });
}

// ============================================================================
// SCHEDULE CONSULTATION
// ============================================================================

async function scheduleConsultation(req, res, data) {
  const { inquiry_id, consultation_date } = data;

  console.log(`[${BOT_INFO.name}] Scheduling consultation - inquiry_id: ${inquiry_id || 'NEW'}`);

  let inquiry;

  // If no inquiry_id, this is a direct booking from the website
  if (!inquiry_id) {
    console.log(`[${BOT_INFO.name}] Creating new inquiry from direct booking`);

    // Create inquiry/lead record first
    const { data: newInquiry, error: inquiryError } = await tenantInsert(TABLES.LEADS, {
      lead_type: 'inquiry',
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state || '',
      message: data.message || data.specialRequests || '',
      service_interest: data.service_interest || data.serviceName,
      referral_source: data.referral_source || 'Website Booking System',
      status: 'consultation_scheduled',
      metadata: {
        household_size: data.householdSize,
        cuisine_preferences: data.cuisinePreferences,
        dietary_requirements: data.dietaryRequirements
      }
    }).select().single();

    if (inquiryError) {
      console.error('Error creating inquiry:', inquiryError);
      throw inquiryError;
    }

    inquiry = newInquiry;
  } else {
    // Get existing inquiry details
    const { data: existingInquiry } = await getSupabase()
      .from(TABLES.LEADS)
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('id', inquiry_id)
      .single();

    if (!existingInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    inquiry = existingInquiry;
  }

  // Create client/household record
  const { data: household, error } = await tenantInsert(TABLES.CLIENTS, {
    client_type: 'household',
    primary_contact_name: inquiry.name,
    primary_contact_email: inquiry.email,
    primary_contact_phone: inquiry.phone,
    primary_address: `${inquiry.city}, ${inquiry.state}`,
    city: inquiry.city,
    state: inquiry.state,
    status: 'consultation_scheduled',
    referral_source: inquiry.referral_source,
    metadata: {
      inquiry_date: inquiry.created_at,
      consultation_date: consultation_date,
      household_size: inquiry.metadata?.household_size
    }
  }).select().single();

  if (error) throw error;

  // Update inquiry/lead
  await tenantUpdate(TABLES.LEADS, {
    status: 'converted',
    converted_to_client_id: household.id
  }).eq('id', inquiry.id);

  // Send consultation invitation email
  await sendConsultationInvitation(inquiry.name, inquiry.email, consultation_date);

  // Log communication
  await tenantInsert(TABLES.COMMUNICATIONS, {
    direction: 'outbound',
    from_contact: 'YPEC-Concierge',
    to_contact: inquiry.email,
    subject: 'Your YPEC Consultation - Next Steps',
    channel: 'email',
    status: 'sent',
    metadata: { client_id: household.id }
  });

  console.log(`[${BOT_INFO.name}] Consultation scheduled for household: ${household.id}`);

  // Notify ANNIE (CSO) of scheduled consultation
  await mfs.notifyAnnieConsultationScheduled({
    id: household.id,
    household_name: inquiry.name,
    household_email: inquiry.email,
    consultation_date: consultation_date,
    consultation_time: data.consultation_time || '10:00 AM',
    service_interest: inquiry.service_interest,
    notes: inquiry.message
  });

  return res.json({
    success: true,
    household_id: household.id,
    consultation_date
  });
}

// ============================================================================
// ASSIGN CHEF TO HOUSEHOLD
// ============================================================================

async function assignChef(req, res, data) {
  const { household_id, chef_id } = data;

  console.log(`[${BOT_INFO.name}] Assigning chef ${chef_id} to household ${household_id}`);

  // Update client/household
  const { error: householdError } = await tenantUpdate(TABLES.CLIENTS, {
    assigned_chef_id: chef_id,
    status: 'active'
  }).eq('id', household_id);

  if (householdError) throw householdError;

  // Update chef household count
  const { data: chef } = await getSupabase()
    .from(TABLES.USERS)
    .select('current_households, max_households')
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .single();

  if (chef) {
    await tenantUpdate(TABLES.USERS, {
      current_households: (chef.current_households || 0) + 1,
      availability_status: ((chef.current_households || 0) + 1 >= (chef.max_households || 3)) ? 'full' : 'available'
    }).eq('id', chef_id);
  }

  // Get household and chef details
  const { data: household } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', household_id)
    .single();

  const { data: chefDetails } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .single();

  // Send chef introduction email
  await sendChefIntroduction(household, chefDetails);

  console.log(`[${BOT_INFO.name}] Chef assigned successfully`);

  return res.json({
    success: true,
    message: 'Chef assigned and introduction sent'
  });
}

// ============================================================================
// PROCESS NEW INQUIRIES (Cron - Daily 7am)
// ============================================================================

async function processNewInquiries(req, res) {
  console.log(`[${BOT_INFO.name}] Processing new inquiries (cron)`);

  const { data: newInquiries } = await getSupabase()
    .from(TABLES.LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('lead_type', 'inquiry')
    .eq('status', 'new')
    .is('contacted_at', null);

  if (!newInquiries || newInquiries.length === 0) {
    return res.json({
      success: true,
      message: 'No new inquiries to process'
    });
  }

  for (const inquiry of newInquiries) {
    await acknowledgeInquiry(null, null, {
      email: inquiry.email,
      name: inquiry.name,
      phone: inquiry.phone,
      city: inquiry.city,
      state: inquiry.state,
      message: inquiry.message,
      service_interest: inquiry.service_interest,
      referral_source: inquiry.referral_source
    });
  }

  return res.json({
    success: true,
    processed: newInquiries.length,
    message: `Processed ${newInquiries.length} new inquiries`
  });
}

// ============================================================================
// SEND CONSULTATION REMINDERS (Cron - Daily 9am)
// ============================================================================

async function sendConsultationReminders(req, res) {
  console.log(`[${BOT_INFO.name}] Sending consultation reminders (cron)`);

  // Get consultations scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: households } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'consultation_scheduled')
    .gte('metadata->consultation_date', tomorrowStr)
    .lt('metadata->consultation_date', `${tomorrowStr}T23:59:59`);

  if (!households || households.length === 0) {
    return res.json({
      success: true,
      message: 'No consultations tomorrow'
    });
  }

  for (const household of households) {
    await sendConsultationReminder(household);
  }

  return res.json({
    success: true,
    reminders_sent: households.length
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  await processNewInquiries(req, null);
  await sendConsultationReminders(req, null);

  return res.json({
    success: true,
    message: 'Daily run completed',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EMAIL FUNCTIONS (Integrate with your email service)
// ============================================================================

async function sendAcknowledgmentEmail(name, email) {
  const firstName = name.split(' ')[0];

  const emailContent = `
Dear ${firstName},

Thank you for your interest in Your Private Estate Chef.

We've received your inquiry and are reviewing it personally. You can expect to hear from us within 48 hours.

In the meantime, if you have any questions, simply reply to this email.

Warm regards,
The YPEC Team

---
Your Private Estate Chef
By introduction only.
www.yourprivateestatechef.com
  `.trim();

  // TODO: Integrate with your email service
  // const sendEmail = require('../../utils/sendEmail');
  // await sendEmail({
  //   to: email,
  //   from: 'private@yourprivatechef.com',
  //   subject: "We've received your introduction request",
  //   text: emailContent
  // });

  console.log(`[${BOT_INFO.name}] Acknowledgment email prepared for ${email}`);
}

async function sendConsultationInvitation(name, email, consultationDate) {
  const firstName = name.split(' ')[0];

  const emailContent = `
Dear ${firstName},

We'd love to learn more about your household and how we might serve your family.

Your consultation is scheduled for: ${new Date(consultationDate).toLocaleDateString()}

This 20-minute conversation will help us understand your preferences, schedule, and match you with the perfect chef.

We look forward to speaking with you.

Warm regards,
The YPEC Team
  `.trim();

  console.log(`[${BOT_INFO.name}] Consultation invitation prepared for ${email}`);
}

async function sendChefIntroduction(household, chef) {
  const emailContent = `
Dear ${household.primary_contact_name.split(' ')[0]},

We're delighted to introduce you to ${chef.first_name} ${chef.last_name}, who will be serving your household.

${chef.first_name} ${chef.last_name} specializes in ${chef.specialties?.join(', ') || 'fine dining'} and has ${chef.years_experience || 0} years of experience in private estate dining.

${chef.first_name} will reach out shortly to schedule your first session and discuss your preferences in detail.

Welcome to Your Private Estate Chef.

Warm regards,
The YPEC Team
  `.trim();

  console.log(`[${BOT_INFO.name}] Chef introduction prepared for ${household.primary_contact_email}`);
}

async function sendConsultationReminder(household) {
  console.log(`[${BOT_INFO.name}] Consultation reminder prepared for ${household.email}`);
}
