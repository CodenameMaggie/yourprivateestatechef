// ============================================================================
// YPEC-CONCIERGE BOT
// Reports to: ANNIE (CSO - Chief Support Officer)
// Purpose: Client-facing communication, inquiry handling, consultation scheduling
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const mfs = require('./mfs-integration');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOT_INFO = {
  name: 'YPEC-Concierge',
  reports_to: 'ANNIE (CSO)',
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
  const { data: inquiries } = await supabase
    .from('ypec_inquiries')
    .select('status')
    .eq('status', 'new');

  const { data: consultations } = await supabase
    .from('ypec_households')
    .select('status')
    .eq('status', 'consultation_scheduled');

  const { data: activeHouseholds } = await supabase
    .from('ypec_households')
    .select('id')
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
  const { data: inquiries, error } = await supabase
    .from('ypec_inquiries')
    .select('*')
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

  // Create inquiry record
  const { data: inquiry, error } = await supabase
    .from('ypec_inquiries')
    .insert({
      name,
      email,
      phone,
      city,
      state,
      message,
      service_interest,
      referral_source,
      status: 'new'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating inquiry:', error);
    throw error;
  }

  // Log communication
  await supabase.from('ypec_communications').insert({
    inquiry_id: inquiry.id,
    comm_type: 'email',
    direction: 'inbound',
    subject: 'Introduction Request',
    message: message,
    sent_by: email,
    sent_at: new Date().toISOString()
  });

  // Send acknowledgment email
  await sendAcknowledgmentEmail(name, email);

  // Update inquiry status
  await supabase
    .from('ypec_inquiries')
    .update({
      status: 'responded',
      responded_at: new Date().toISOString()
    })
    .eq('id', inquiry.id);

  // Notify ANNIE (CSO) of new inquiry
  await mfs.notifyAnnieNewInquiry(inquiry);

  // Log outbound communication
  await supabase.from('ypec_communications').insert({
    inquiry_id: inquiry.id,
    comm_type: 'email',
    direction: 'outbound',
    subject: "We've received your introduction request",
    sent_by: 'YPEC-Concierge',
    sent_to: email,
    sent_at: new Date().toISOString(),
    email_status: 'sent'
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

  console.log(`[${BOT_INFO.name}] Scheduling consultation for inquiry: ${inquiry_id}`);

  // Get inquiry details
  const { data: inquiry } = await supabase
    .from('ypec_inquiries')
    .select('*')
    .eq('id', inquiry_id)
    .single();

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  // Create household record
  const { data: household, error } = await supabase
    .from('ypec_households')
    .insert({
      primary_contact_name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      primary_address: `${inquiry.city}, ${inquiry.state}`,
      status: 'consultation_scheduled',
      inquiry_date: inquiry.created_at,
      consultation_date: consultation_date,
      household_size: inquiry.household_size,
      referral_source: inquiry.referral_source
    })
    .select()
    .single();

  if (error) throw error;

  // Update inquiry
  await supabase
    .from('ypec_inquiries')
    .update({
      status: 'consultation_scheduled',
      converted_to_household_id: household.id
    })
    .eq('id', inquiry_id);

  // Send consultation invitation email
  await sendConsultationInvitation(inquiry.name, inquiry.email, consultation_date);

  // Log communication
  await supabase.from('ypec_communications').insert({
    household_id: household.id,
    comm_type: 'email',
    direction: 'outbound',
    subject: 'Your YPEC Consultation - Next Steps',
    sent_by: 'YPEC-Concierge',
    sent_to: inquiry.email,
    sent_at: new Date().toISOString(),
    email_status: 'sent'
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

  // Update household
  const { error: householdError } = await supabase
    .from('ypec_households')
    .update({
      chef_id: chef_id,
      status: 'active',
      activation_date: new Date().toISOString()
    })
    .eq('id', household_id);

  if (householdError) throw householdError;

  // Update chef household count
  await supabase.rpc('increment', {
    table_name: 'ypec_chefs',
    row_id: chef_id,
    column_name: 'current_households',
    x: 1
  });

  // Get household and chef details
  const { data: household } = await supabase
    .from('ypec_households')
    .select('*')
    .eq('id', household_id)
    .single();

  const { data: chef } = await supabase
    .from('ypec_chefs')
    .select('*')
    .eq('id', chef_id)
    .single();

  // Send chef introduction email
  await sendChefIntroduction(household, chef);

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

  const { data: newInquiries } = await supabase
    .from('ypec_inquiries')
    .select('*')
    .eq('status', 'new')
    .is('responded_at', null);

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

  const { data: households } = await supabase
    .from('ypec_households')
    .select('*')
    .eq('status', 'consultation_scheduled')
    .gte('consultation_date', tomorrowStr)
    .lt('consultation_date', `${tomorrowStr}T23:59:59`);

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

We're delighted to introduce you to ${chef.full_name}, who will be serving your household.

${chef.full_name} specializes in ${chef.specialties?.join(', ')} and has ${chef.experience_years} years of experience in private estate dining.

${chef.full_name} will reach out shortly to schedule your first session and discuss your preferences in detail.

Welcome to Your Private Estate Chef.

Warm regards,
The YPEC Team
  `.trim();

  console.log(`[${BOT_INFO.name}] Chef introduction prepared for ${household.email}`);
}

async function sendConsultationReminder(household) {
  console.log(`[${BOT_INFO.name}] Consultation reminder prepared for ${household.email}`);
}
