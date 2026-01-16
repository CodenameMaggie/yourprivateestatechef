// ============================================================================
// YPEC CULINARY SCHOOL OUTREACH BOT
// Reports to: DAN (CMO) & Henry (COO)
// Purpose: Automated chef recruitment through culinary schools
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'YPEC-CulinaryOutreach',
  reports_to: 'Dan (CMO)',
  supports: 'Henry (COO) for talent pipeline',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Automated chef recruitment via culinary school partnerships',
  actions: ['status', 'schools', 'campaigns', 'create_campaign', 'track_response', 'analytics', 'run']
};

// Load culinary schools database
let CULINARY_SCHOOLS = [];
try {
  const schoolsPath = path.join(__dirname, '../../data/culinary-schools.json');
  const schoolsData = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
  CULINARY_SCHOOLS = schoolsData.schools;
} catch (error) {
  console.error('[CulinaryOutreach] Error loading schools database:', error);
}

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'schools':
        return await getSchools(req, res, data);

      case 'campaigns':
        return await getCampaigns(req, res);

      case 'create_campaign':
        return await createCampaign(req, res, data);

      case 'track_response':
        return await trackResponse(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

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
  // Get outreach campaigns
  const { data: campaigns } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('status')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    total_schools: CULINARY_SCHOOLS.length,
    campaigns_sent: campaigns?.filter(c => c.status === 'sent').length || 0,
    responses_received: campaigns?.filter(c => c.status === 'responded').length || 0,
    partnerships_active: campaigns?.filter(c => c.status === 'partnership').length || 0,
    not_contacted: CULINARY_SCHOOLS.length - (campaigns?.length || 0),
    estimated_annual_reach: campaigns
      ?.filter(c => c.status === 'partnership')
      .reduce((sum, c) => {
        const school = CULINARY_SCHOOLS.find(s => s.id === c.school_id);
        return sum + (school?.annual_graduates || 0);
      }, 0) || 0
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    total_potential_reach: 21450, // Total annual graduates from all schools
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET SCHOOLS
// ============================================================================

async function getSchools(req, res, data) {
  const { filter } = data || {};

  let schools = [...CULINARY_SCHOOLS];

  // Apply filters
  if (filter?.type) {
    schools = schools.filter(s => s.type === filter.type);
  }
  if (filter?.ranking_top) {
    schools = schools.filter(s => s.ranking <= filter.ranking_top);
  }
  if (filter?.location_contains) {
    schools = schools.filter(s =>
      s.location.toLowerCase().includes(filter.location_contains.toLowerCase())
    );
  }

  // Get outreach status for each school
  const schoolIds = schools.map(s => s.id);
  const { data: outreach } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .in('school_id', schoolIds);

  // Merge outreach status with school data
  const schoolsWithStatus = schools.map(school => {
    const outreachRecord = outreach?.find(o => o.school_id === school.id);
    return {
      ...school,
      outreach_status: outreachRecord?.status || 'not_contacted',
      last_contact_date: outreachRecord?.last_contact_date,
      next_followup_date: outreachRecord?.next_followup_date,
      notes: outreachRecord?.notes
    };
  });

  return res.json({
    success: true,
    total: schoolsWithStatus.length,
    schools: schoolsWithStatus,
    filters_applied: filter || {}
  });
}

// ============================================================================
// GET CAMPAIGNS
// ============================================================================

async function getCampaigns(req, res) {
  const { data: campaigns, error } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Enrich with school data
  const enriched = campaigns?.map(campaign => {
    const school = CULINARY_SCHOOLS.find(s => s.id === campaign.school_id);
    return {
      ...campaign,
      school: school || { name: 'Unknown School', id: campaign.school_id }
    };
  }) || [];

  const grouped = {
    not_contacted: enriched.filter(c => c.status === 'not_contacted'),
    sent: enriched.filter(c => c.status === 'sent'),
    responded: enriched.filter(c => c.status === 'responded'),
    partnership: enriched.filter(c => c.status === 'partnership'),
    declined: enriched.filter(c => c.status === 'declined')
  };

  return res.json({
    success: true,
    total: enriched.length,
    grouped,
    campaigns: enriched
  });
}

// ============================================================================
// CREATE CAMPAIGN
// ============================================================================

async function createCampaign(req, res, data) {
  const { school_ids, campaign_type, template, schedule_date } = data;

  console.log(`[${BOT_INFO.name}] Creating campaign for ${school_ids?.length || 0} schools`);

  if (!school_ids || school_ids.length === 0) {
    return res.status(400).json({ error: 'school_ids required' });
  }

  const campaigns = [];
  const errors = [];

  for (const school_id of school_ids) {
    const school = CULINARY_SCHOOLS.find(s => s.id === school_id);

    if (!school) {
      errors.push({ school_id, error: 'School not found' });
      continue;
    }

    // Check if already contacted
    const { data: existing } = await getSupabase()
      .from(TABLES.CULINARY_OUTREACH)
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('school_id', school_id)
      .single();

    if (existing) {
      errors.push({ school_id, error: 'Already contacted' });
      continue;
    }

    // Prepare email content
    const emailContent = generateOutreachEmail(school, campaign_type || 'initial');

    // Create campaign record
    const { data: campaign, error } = await tenantInsert(TABLES.CULINARY_OUTREACH, {
      school_id: school.id,
      school_name: school.name,
      contact_email: school.career_services_email,
      campaign_type: campaign_type || 'initial',
      template_used: template || 'partnership_invitation',
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      status: schedule_date ? 'scheduled' : 'draft',
      scheduled_send_date: schedule_date || null,
      created_at: new Date().toISOString(),
      metadata: {
        school_ranking: school.ranking,
        school_type: school.type,
        annual_graduates: school.annual_graduates,
        programs: school.programs
      }
    }).select().single();

    if (error) {
      errors.push({ school_id, error: error.message });
    } else {
      campaigns.push(campaign);
    }
  }

  console.log(`[${BOT_INFO.name}] Created ${campaigns.length} campaigns, ${errors.length} errors`);

  return res.json({
    success: true,
    campaigns_created: campaigns.length,
    campaigns,
    errors: errors.length > 0 ? errors : undefined
  });
}

// ============================================================================
// TRACK RESPONSE
// ============================================================================

async function trackResponse(req, res, data) {
  const { school_id, status, notes, partnership_details } = data;

  if (!school_id || !status) {
    return res.status(400).json({ error: 'school_id and status required' });
  }

  const updates = {
    status,
    notes: notes || null,
    last_contact_date: new Date().toISOString()
  };

  if (status === 'responded') {
    updates.response_received_date = new Date().toISOString();
    updates.next_followup_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  }

  if (status === 'partnership') {
    updates.partnership_started_date = new Date().toISOString();
    updates.partnership_details = partnership_details || {};
  }

  if (status === 'declined') {
    updates.declined_date = new Date().toISOString();
  }

  const { data: updated, error } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('school_id', school_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Updated outreach status for ${school_id}: ${status}`);

  return res.json({
    success: true,
    school_id,
    new_status: status,
    updated
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: campaigns } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const sent = campaigns?.filter(c => c.status !== 'not_contacted' && c.status !== 'draft') || [];
  const responded = campaigns?.filter(c => c.status === 'responded' || c.status === 'partnership') || [];
  const partnerships = campaigns?.filter(c => c.status === 'partnership') || [];

  const responseRate = sent.length > 0 ? ((responded.length / sent.length) * 100).toFixed(1) : '0';
  const partnershipRate = sent.length > 0 ? ((partnerships.length / sent.length) * 100).toFixed(1) : '0';

  // Calculate potential reach
  const partnershipReach = partnerships.reduce((sum, p) => {
    const school = CULINARY_SCHOOLS.find(s => s.id === p.school_id);
    return sum + (school?.annual_graduates || 0);
  }, 0);

  // Top performing school types
  const byType = {};
  partnerships.forEach(p => {
    const school = CULINARY_SCHOOLS.find(s => s.id === p.school_id);
    const type = school?.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  return res.json({
    success: true,
    analytics: {
      total_schools_in_database: CULINARY_SCHOOLS.length,
      total_contacted: sent.length,
      total_responded: responded.length,
      total_partnerships: partnerships.length,
      response_rate: responseRate + '%',
      partnership_conversion_rate: partnershipRate + '%',
      estimated_annual_chef_reach: partnershipReach,
      partnerships_by_school_type: byType,
      schools_remaining: CULINARY_SCHOOLS.length - sent.length,
      next_targets: CULINARY_SCHOOLS
        .filter(s => !sent.find(c => c.school_id === s.id))
        .slice(0, 10)
        .map(s => ({ id: s.id, name: s.name, ranking: s.ranking, annual_graduates: s.annual_graduates }))
    }
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Check for scheduled campaigns
  const today = new Date().toISOString().split('T')[0];
  const { data: scheduled } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'scheduled')
    .lte('scheduled_send_date', today);

  // Check for follow-ups needed
  const { data: followups } = await getSupabase()
    .from(TABLES.CULINARY_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'responded')
    .lte('next_followup_date', today);

  const actions = {
    scheduled_to_send: scheduled?.length || 0,
    followups_needed: followups?.length || 0
  };

  // NOTE: Actual email sending will be activated in Phase 4
  console.log(`[${BOT_INFO.name}] Daily run: ${actions.scheduled_to_send} scheduled, ${actions.followups_needed} followups`);

  return res.json({
    success: true,
    actions_identified: actions,
    message: 'Email sending not yet activated - campaigns prepared but not sent',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EMAIL TEMPLATE GENERATOR
// ============================================================================

function generateOutreachEmail(school, campaign_type) {
  const templates = {
    initial: {
      subject: `Partnership Opportunity: Your Private Estate Chef & ${school.name}`,
      body: `Dear ${school.name} Career Services Team,

I hope this message finds you well.

I'm reaching out from Your Private Estate Chef (YPEC), a boutique placement service specializing in connecting professionally trained chefs with high-net-worth households seeking private culinary services.

We work exclusively with graduates from top-tier culinary programs, and ${school.name} has long been on our radar as a premier institution producing exceptional talent.

WHAT WE OFFER YOUR GRADUATES:
• Exclusive placement opportunities with established families
• Competitive compensation ($60K - $150K+ annually)
• Long-term, stable positions with benefits
• Career advancement in private service
• Professional development support

PARTNERSHIP OPPORTUNITIES:
• Career fair participation
• Guest speaker sessions on private chef careers
• Alumni networking events
• Direct job postings to your career portal

We typically place 20-30 chefs annually and are expanding our recruitment efforts. We'd love to discuss how we can support your graduates' career success.

Would you be available for a brief call next week to explore this partnership?

Looking forward to connecting.

Warm regards,
The YPEC Recruitment Team

---
Your Private Estate Chef
chef-relations@yourprivateestatechef.com
https://yourprivateestatechef.com/chef-careers

P.S. We're also happy to provide reference letters from current placements and client testimonials.`
    },
    followup: {
      subject: `Following up: YPEC Partnership with ${school.name}`,
      body: `Dear ${school.name} Team,

I wanted to follow up on my previous email regarding a potential partnership between Your Private Estate Chef and ${school.name}.

We understand you're busy, especially during recruitment season, but we wanted to ensure this opportunity didn't get lost in your inbox.

QUICK SUMMARY:
• We place culinary graduates in high-end private households
• Compensation: $60K - $150K+ annually
• Long-term, career-building positions
• No cost to your school or graduates

If this interests you, I'd love to schedule a brief 15-minute call to discuss how we can support your graduates.

Please let me know if you'd like to connect.

Best regards,
The YPEC Team`
    },
    partnership_invitation: {
      subject: `Invitation: Join YPEC's Culinary School Partner Network`,
      body: `Dear ${school.name} Career Services,

Your Private Estate Chef is building an exclusive network of culinary school partners, and we'd be honored to include ${school.name}.

As a partner school, your graduates would receive:

EXCLUSIVE BENEFITS:
• Priority access to private chef positions
• Annual scholarship for continuing education ($5,000)
• Career mentorship from established private chefs
• Alumni success stories featured on our website

WHAT WE ASK:
• Allow us to attend your career fairs (1-2x per year)
• Post our job opportunities to your career portal
• Connect us with interested graduating seniors

This partnership costs nothing and helps your graduates access a growing, lucrative sector of the culinary industry.

Interested? Let's schedule a call this week.

Warmly,
Dan Williams, CMO
Your Private Estate Chef
dan@yourprivateestatechef.com`
    }
  };

  return templates[campaign_type] || templates.initial;
}

// Export for testing
module.exports.generateOutreachEmail = generateOutreachEmail;
module.exports.BOT_INFO = BOT_INFO;
module.exports.CULINARY_SCHOOLS = CULINARY_SCHOOLS;
