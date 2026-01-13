// ============================================================================
// YPEC CALENDLY WEBHOOK - FOODIE FRIDAYS PODCAST
// Purpose: Handle Calendly bookings for Foodie Fridays podcast
// Only books on Fridays - automated scheduling
// ============================================================================

const { getSupabase } = require('./database');
const mfs = require('./mfs-integration');

const CALENDLY_CONFIG = {
  token: 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY4MzM0NDc3LCJqdGkiOiIwYjg4ZDc2Zi1lZDMyLTQ0YTQtYjNjYi0wYjM2ZTY3ZDM3NWIiLCJ1c2VyX3V1aWQiOiJkNDk1YjhhOS01ZTMwLTQzMmItOTE0ZC1hMGNlYjM4MWQyOGIifQ.e1DIkA5lwvmQQvrRGQXc2Vjl7EHghFTiiR-Uz04avChPsyRUXYV2K9V_a-s2Irdbx_VFJavJGHx4TfoQ0AgCyQ',
  api_url: 'https://api.calendly.com',
  allowed_day: 'Friday', // Only Foodie Fridays
  event_name: 'Foodie Fridays Podcast'
};

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

module.exports = async (req, res) => {
  const { event, payload } = req.body;

  console.log('[Calendly] Webhook received:', event);

  try {
    switch (event) {
      case 'invitee.created':
        return await handleInviteeCreated(req, res, payload);

      case 'invitee.canceled':
        return await handleInviteeCanceled(req, res, payload);

      case 'test':
        return res.json({
          success: true,
          message: 'Calendly webhook test successful',
          config: {
            allowed_day: CALENDLY_CONFIG.allowed_day,
            event_name: CALENDLY_CONFIG.event_name
          }
        });

      default:
        console.log('[Calendly] Unhandled event type:', event);
        return res.json({ success: true, message: 'Event received but not processed' });
    }
  } catch (error) {
    console.error('[Calendly] Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// HANDLE NEW BOOKING (invitee.created)
// ============================================================================

async function handleInviteeCreated(req, res, payload) {
  console.log('[Calendly] New booking received');

  const invitee = payload.invitee;
  const event = payload.event;

  // Extract booking details
  const scheduledDate = new Date(event.start_time);
  const dayOfWeek = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });

  // VALIDATE: Only Fridays allowed
  if (dayOfWeek !== 'Friday') {
    console.warn('[Calendly] ⚠️  Booking attempted on', dayOfWeek, '- REJECTED (Foodie Fridays only)');

    // Send email to guest explaining restriction
    await sendDayRestrictionEmail(invitee.email, invitee.name, dayOfWeek);

    return res.json({
      success: false,
      message: 'Bookings only allowed on Fridays',
      rejected_day: dayOfWeek
    });
  }

  console.log('[Calendly] ✅ Friday booking confirmed:', scheduledDate.toLocaleDateString());

  // Extract guest info
  const guestName = invitee.name;
  const guestEmail = invitee.email;
  const guestPhone = invitee.text_reminder_number || null;

  // Get custom questions/answers
  let expertise = null;
  let topic = null;
  let background = null;

  if (invitee.questions_and_answers) {
    invitee.questions_and_answers.forEach(qa => {
      const question = qa.question.toLowerCase();
      if (question.includes('expertise') || question.includes('specialty')) {
        expertise = qa.answer;
      }
      if (question.includes('topic') || question.includes('discuss')) {
        topic = qa.answer;
      }
      if (question.includes('background') || question.includes('bio')) {
        background = qa.answer;
      }
    });
  }

  // Store in database
  const { data: booking, error } = await getSupabase()
    .from('ypec_podcast_bookings')
    .insert({
      calendly_event_uri: event.uri,
      calendly_invitee_uri: invitee.uri,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      scheduled_date: scheduledDate.toISOString(),
      scheduled_time: event.start_time,
      end_time: event.end_time,
      day_of_week: dayOfWeek,
      expertise: expertise,
      topic: topic,
      background: background,
      status: 'confirmed',
      booking_created_at: invitee.created_at,
      timezone: invitee.timezone,
      notes: `Calendly booking for ${CALENDLY_CONFIG.event_name}`
    })
    .select()
    .single();

  if (error) {
    console.error('[Calendly] Database error:', error);
    throw error;
  }

  console.log('[Calendly] Booking stored:', booking.id);

  // Send confirmation email to guest
  await sendPodcastConfirmation(booking);

  // Notify ANNIE and team
  await notifyTeam(booking);

  // Sync to MFS central database
  await syncToMFS(booking);

  return res.json({
    success: true,
    booking_id: booking.id,
    guest_name: guestName,
    scheduled_date: scheduledDate.toISOString(),
    message: 'Foodie Friday booking confirmed'
  });
}

// ============================================================================
// HANDLE CANCELLATION (invitee.canceled)
// ============================================================================

async function handleInviteeCanceled(req, res, payload) {
  console.log('[Calendly] Booking canceled');

  const invitee = payload.invitee;

  // Update booking status
  const { data, error } = await getSupabase()
    .from('ypec_podcast_bookings')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancellation_reason: invitee.cancellation?.reason || 'Guest canceled'
    })
    .eq('calendly_invitee_uri', invitee.uri)
    .select()
    .single();

  if (error) {
    console.error('[Calendly] Cancellation update error:', error);
  }

  if (data) {
    console.log('[Calendly] Booking canceled:', data.id);

    // Notify team of cancellation
    await notifyTeamCancellation(data);
  }

  return res.json({
    success: true,
    message: 'Cancellation processed'
  });
}

// ============================================================================
// EMAIL: SEND PODCAST CONFIRMATION
// ============================================================================

async function sendPodcastConfirmation(booking) {
  const emailContent = `
Dear ${booking.guest_name},

🎙️ Welcome to Foodie Fridays!

Your podcast recording is confirmed:

📅 DATE: ${new Date(booking.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ TIME: ${new Date(booking.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${booking.timezone}
⏱️ DURATION: 45-60 minutes

WHAT TO EXPECT:
✓ Relaxed conversation about your culinary expertise
✓ Behind-the-scenes stories and cooking tips
✓ Discussion about ${booking.topic || 'your specialty'}
✓ Live recording via Zoom (link will be sent 24 hours before)

PREPARATION:
- Have your favorite cooking stories ready
- Quiet space with good lighting
- Headphones recommended for best audio
- Be yourself and have fun!

We'll send you the Zoom link and any prep materials 24 hours before recording.

Questions? Reply to this email or text us at ${booking.guest_phone ? 'your number on file' : '(contact number)'}.

Looking forward to Friday!

Warmly,
The Foodie Fridays Team
Your Private Estate Chef

---
yourprivateestatechef.com
  `.trim();

  // Store communication record
  await getSupabase()
    .from('ypec_communications')
    .insert({
      type: 'email',
      direction: 'outbound',
      recipient: booking.guest_email,
      subject: '🎙️ Foodie Friday Confirmed - See You Soon!',
      body: emailContent,
      status: 'sent',
      related_booking_id: booking.id
    });

  console.log('[Calendly] Confirmation email prepared for', booking.guest_email);
}

// ============================================================================
// EMAIL: DAY RESTRICTION NOTICE
// ============================================================================

async function sendDayRestrictionEmail(email, name, attemptedDay) {
  const emailContent = `
Dear ${name},

Thank you for your interest in Foodie Fridays!

We noticed you tried to book on a ${attemptedDay}. Our podcast recordings only take place on FRIDAYS (hence the name 😊).

Please visit our Calendly link again and select a Friday that works for you:
https://calendly.com/maggie-maggieforbesstrategies/podcast-your-private-estate-chef

Available Fridays typically include:
- Morning slots: 9:00 AM - 12:00 PM
- Afternoon slots: 1:00 PM - 4:00 PM

All times are Central Time (CT).

We'd love to have you on the show! Just choose any Friday that fits your schedule.

Questions? Reply to this email.

Warmly,
The Foodie Fridays Team
Your Private Estate Chef
  `.trim();

  await getSupabase()
    .from('ypec_communications')
    .insert({
      type: 'email',
      direction: 'outbound',
      recipient: email,
      subject: 'Foodie Fridays - Please Book on a Friday',
      body: emailContent,
      status: 'sent',
      notes: `Day restriction notice - attempted booking on ${attemptedDay}`
    });

  console.log('[Calendly] Day restriction email sent to', email);
}

// ============================================================================
// NOTIFY TEAM
// ============================================================================

async function notifyTeam(booking) {
  // Notify ANNIE (Customer Service)
  await mfs.notifyAnnie({
    type: 'podcast_booking',
    priority: 'normal',
    booking_id: booking.id,
    guest_name: booking.guest_name,
    scheduled_date: booking.scheduled_date,
    topic: booking.topic,
    message: `New Foodie Friday podcast guest: ${booking.guest_name} on ${new Date(booking.scheduled_date).toLocaleDateString()}`
  });

  // Notify DAN (Marketing)
  await mfs.notifyDan({
    type: 'podcast_booking',
    booking_id: booking.id,
    guest_name: booking.guest_name,
    scheduled_date: booking.scheduled_date,
    lead_source: 'Calendly - Foodie Fridays',
    message: `Podcast guest booked: ${booking.guest_name} - Potential lead for YPEC services`
  });

  console.log('[Calendly] Team notified of new booking');
}

async function notifyTeamCancellation(booking) {
  await mfs.notifyAnnie({
    type: 'podcast_cancellation',
    priority: 'low',
    booking_id: booking.id,
    guest_name: booking.guest_name,
    message: `Foodie Friday canceled: ${booking.guest_name} for ${new Date(booking.scheduled_date).toLocaleDateString()}`
  });

  console.log('[Calendly] Team notified of cancellation');
}

// ============================================================================
// SYNC TO MFS CENTRAL DATABASE
// ============================================================================

async function syncToMFS(booking) {
  const mfsDb = require('./mfs-database');

  // Store as lead in MFS central
  await mfsDb.storeMFSLead({
    source: 'YPEC_osm',
    email: booking.guest_email,
    name: booking.guest_name,
    phone: booking.guest_phone,
    income_level: 'high_net_worth', // Podcast guests are typically influencers/professionals
    interest_level: 'engaged',
    notes: `Foodie Friday podcast guest - ${booking.topic || 'culinary professional'}. Scheduled: ${new Date(booking.scheduled_date).toLocaleDateString()}`,
    status: 'engaged'
  });

  console.log('[Calendly] Booking synced to MFS central database');
}
