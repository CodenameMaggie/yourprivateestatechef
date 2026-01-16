// ============================================================================
// CENTRALIZED EMAIL SENDER - DEDUPLICATION & UNIFIED SENDING
// ALL marketing emails go through this ONE system
// Prevents duplicate sends, tracks everything
// ============================================================================

const { getSupabase, tenantInsert, TENANT_ID, TABLES } = require('./database');

const BOT_INFO = {
  name: 'YPEC-EmailSender',
  reports_to: 'Dan (CMO)',
  purpose: 'CENTRALIZED email sending - ALL campaigns use this ONE system',
  critical_feature: 'DEDUPLICATION - Prevents duplicate emails',
  actions: ['status', 'queue_email', 'send_queued', 'check_duplicate', 'analytics']
};

// Forbes Command Email Server Configuration
const FORBES_COMMAND_EMAIL_CONFIG = {
  server: 'forbes-command',
  host: '5.78.139.9',
  location: '/root/mfs/',
  // Email sending flow: Any system → /api/email-api.js → Guardian check → Postfix (port 25)
  api_endpoint: 'http://5.78.139.9/api/email-api.js',
  smtp_service: 'Postfix (port 25)',
  security: 'Guardian check enabled'
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'queue_email':
        return await queueEmail(req, res, data);

      case 'send_queued':
        return await sendQueuedEmails(req, res, data);

      case 'check_duplicate':
        return await checkDuplicate(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

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
  const { data: queued } = await getSupabase()
    .from('ypec_email_queue')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    queued: queued?.filter(e => e.status === 'queued').length || 0,
    sending: queued?.filter(e => e.status === 'sending').length || 0,
    sent: queued?.filter(e => e.status === 'sent').length || 0,
    failed: queued?.filter(e => e.status === 'failed').length || 0
  };

  // Get sent emails from log
  const { data: sentLog } = await getSupabase()
    .from('ypec_email_log')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const byCampaign = {};
  sentLog?.forEach(email => {
    const campaign = email.campaign_type || 'unknown';
    byCampaign[campaign] = (byCampaign[campaign] || 0) + 1;
  });

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    email_queue: stats,
    total_emails_sent: sentLog?.length || 0,
    emails_by_campaign: byCampaign,
    forbes_command_config: FORBES_COMMAND_EMAIL_CONFIG
  });
}

// ============================================================================
// QUEUE EMAIL (with deduplication)
// ============================================================================

async function queueEmail(req, res, data) {
  const {
    recipient_email,
    recipient_name,
    subject,
    body_html,
    body_text,
    campaign_type,
    campaign_id,
    source_bot,
    scheduled_send_time,
    priority
  } = data;

  if (!recipient_email || !subject || !body_html || !campaign_type || !source_bot) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['recipient_email', 'subject', 'body_html', 'campaign_type', 'source_bot']
    });
  }

  // Generate deduplication key
  const dedup_key = `${recipient_email}:${campaign_type}:${campaign_id || 'null'}`;

  console.log(`[${BOT_INFO.name}] Queueing email to ${recipient_email} (campaign: ${campaign_type})`);
  console.log(`[${BOT_INFO.name}] Dedup key: ${dedup_key}`);

  // Check if already exists
  const { data: existing } = await getSupabase()
    .from('ypec_email_queue')
    .select('id, status')
    .eq('dedup_key', dedup_key)
    .single();

  if (existing) {
    console.log(`[${BOT_INFO.name}] ❌ DUPLICATE PREVENTED: Email already ${existing.status}`);
    return res.json({
      success: false,
      duplicate: true,
      message: `Email already ${existing.status}. Duplicate prevented.`,
      existing_email_id: existing.id,
      dedup_key
    });
  }

  // Queue the email
  const email = {
    recipient_email,
    recipient_name,
    subject,
    body_html,
    body_text: body_text || null,
    campaign_type,
    campaign_id: campaign_id || null,
    source_bot,
    dedup_key,
    status: 'queued',
    priority: priority || 5,
    scheduled_send_time: scheduled_send_time || new Date().toISOString(),
    retry_count: 0,
    max_retries: 3
  };

  const { data: created, error } = await getSupabase()
    .from('ypec_email_queue')
    .insert({ ...email, tenant_id: TENANT_ID })
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] ✅ Email queued: ${created.id}`);

  return res.json({
    success: true,
    queued: true,
    email_id: created.id,
    dedup_key,
    scheduled_send_time: created.scheduled_send_time,
    message: 'Email queued successfully. No duplicates detected.'
  });
}

// ============================================================================
// SEND QUEUED EMAILS
// ============================================================================

async function sendQueuedEmails(req, res, data) {
  const { limit } = data || {};

  console.log(`[${BOT_INFO.name}] Processing email queue...`);

  // Get emails ready to send
  const { data: emails } = await getSupabase()
    .from('ypec_email_queue')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'queued')
    .lte('scheduled_send_time', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_send_time', { ascending: true })
    .limit(limit || 10);

  if (!emails || emails.length === 0) {
    return res.json({
      success: true,
      message: 'No emails in queue ready to send',
      emails_sent: 0
    });
  }

  console.log(`[${BOT_INFO.name}] Found ${emails.length} emails to send`);

  const results = {
    sent: [],
    failed: []
  };

  for (const email of emails) {
    try {
      // Mark as sending
      await getSupabase()
        .from('ypec_email_queue')
        .update({ status: 'sending' })
        .eq('id', email.id);

      // Send via Forbes Command email server
      // TODO: Replace with actual forbes-command API call
      const sent = await sendViaForbesCommand(email);

      if (sent) {
        // Mark as sent
        await getSupabase()
          .from('ypec_email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id);

        // Log to email_log
        await getSupabase()
          .from('ypec_email_log')
          .insert({
            tenant_id: TENANT_ID,
            recipient_email: email.recipient_email,
            subject: email.subject,
            campaign_type: email.campaign_type,
            source_bot: email.source_bot,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        results.sent.push(email.id);
        console.log(`[${BOT_INFO.name}] ✅ Sent: ${email.recipient_email}`);
      }
    } catch (error) {
      console.error(`[${BOT_INFO.name}] ❌ Failed to send ${email.recipient_email}:`, error.message);

      // Increment retry count
      const newRetryCount = email.retry_count + 1;
      const status = newRetryCount >= email.max_retries ? 'failed' : 'queued';

      await getSupabase()
        .from('ypec_email_queue')
        .update({
          status,
          retry_count: newRetryCount,
          error_message: error.message,
          failed_at: status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', email.id);

      results.failed.push({
        email_id: email.id,
        recipient: email.recipient_email,
        error: error.message
      });
    }
  }

  return res.json({
    success: true,
    emails_processed: emails.length,
    emails_sent: results.sent.length,
    emails_failed: results.failed.length,
    sent_ids: results.sent,
    failed: results.failed
  });
}

// ============================================================================
// SEND VIA FORBES COMMAND
// ============================================================================

async function sendViaForbesCommand(email) {
  console.log(`[${BOT_INFO.name}] Sending via Forbes Command: ${email.recipient_email}`);
  console.log(`[${BOT_INFO.name}] Subject: ${email.subject}`);
  console.log(`[${BOT_INFO.name}] Flow: YPEC → email-api.js → Guardian → Postfix`);

  try {
    // Call forbes-command email API
    const response = await fetch(FORBES_COMMAND_EMAIL_CONFIG.api_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email.recipient_email,
        from: 'noreply@yourprivateestatechef.com', // Or from Forbes Command
        subject: email.subject,
        html: email.body_html,
        text: email.body_text || email.body_html.replace(/<[^>]*>/g, ''), // Strip HTML as fallback
        campaign: email.campaign_type,
        source: 'YPEC-Marketing'
      })
    });

    if (!response.ok) {
      throw new Error(`Forbes Command API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[${BOT_INFO.name}] ✅ Forbes Command response:`, result);

    return true;
  } catch (error) {
    console.error(`[${BOT_INFO.name}] ❌ Forbes Command send failed:`, error.message);
    throw error;
  }
}

// ============================================================================
// CHECK DUPLICATE
// ============================================================================

async function checkDuplicate(req, res, data) {
  const { recipient_email, campaign_type, campaign_id } = data;

  if (!recipient_email || !campaign_type) {
    return res.status(400).json({
      error: 'recipient_email and campaign_type required'
    });
  }

  const dedup_key = `${recipient_email}:${campaign_type}:${campaign_id || 'null'}`;

  const { data: existing } = await getSupabase()
    .from('ypec_email_queue')
    .select('*')
    .eq('dedup_key', dedup_key)
    .single();

  return res.json({
    duplicate: !!existing,
    dedup_key,
    existing_email: existing || null,
    message: existing
      ? `Duplicate found: Email already ${existing.status}`
      : 'No duplicate found - safe to send'
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: sentEmails } = await getSupabase()
    .from('ypec_email_log')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const byCampaign = {};
  const byBot = {};

  sentEmails?.forEach(email => {
    const campaign = email.campaign_type || 'unknown';
    const bot = email.source_bot || 'unknown';

    byCampaign[campaign] = (byCampaign[campaign] || 0) + 1;
    byBot[bot] = (byBot[bot] || 0) + 1;
  });

  return res.json({
    success: true,
    total_emails_sent: sentEmails?.length || 0,
    by_campaign: byCampaign,
    by_bot: byBot,
    engagement: {
      opened: sentEmails?.filter(e => e.opened_at).length || 0,
      clicked: sentEmails?.filter(e => e.clicked_at).length || 0,
      replied: sentEmails?.filter(e => e.replied_at).length || 0
    }
  });
}

module.exports.BOT_INFO = BOT_INFO;
