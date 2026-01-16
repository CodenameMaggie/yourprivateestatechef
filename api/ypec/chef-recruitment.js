// ============================================================================
// YPEC MULTI-CHANNEL CHEF RECRUITMENT BOT
// Reports to: Dan (CMO) & Henry (COO)
// Purpose: Automated chef recruitment across LinkedIn, Indeed, job boards
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'YPEC-ChefRecruitment',
  reports_to: 'Dan (CMO) and Henry (COO)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Multi-channel chef recruitment: LinkedIn, Indeed, ZipRecruiter, Culinary Jobs',
  actions: ['status', 'create_campaign', 'post_job', 'track_lead', 'campaigns', 'leads', 'analytics', 'run']
};

// Recruitment channels configuration
const RECRUITMENT_CHANNELS = {
  linkedin: {
    name: 'LinkedIn',
    type: 'social_professional',
    cost_per_post: '$50-$150',
    reach: 'High (professional network)',
    best_for: 'Experienced chefs, career transitions',
    api_available: true,
    notes: 'Use LinkedIn Recruiter or Job Slots'
  },
  indeed: {
    name: 'Indeed',
    type: 'job_board',
    cost_per_post: '$5-$15/day (sponsored)',
    reach: 'Very High (largest job board)',
    best_for: 'All experience levels, broad reach',
    api_available: true,
    notes: 'Free posting + optional sponsorship'
  },
  ziprecruiter: {
    name: 'ZipRecruiter',
    type: 'job_board',
    cost_per_post: '$249-$449/month',
    reach: 'High (multi-board distribution)',
    best_for: 'Quick hires, broad distribution',
    api_available: true,
    notes: 'Distributes to 100+ job boards'
  },
  culinary_agents: {
    name: 'Culinary Agents',
    type: 'industry_specific',
    cost_per_post: 'Free-$99/post',
    reach: 'Medium (culinary industry focused)',
    best_for: 'Culinary professionals only',
    api_available: false,
    notes: 'Industry-specific, quality candidates'
  },
  craigslist: {
    name: 'Craigslist',
    type: 'classifieds',
    cost_per_post: 'Free-$25',
    reach: 'Local (city-specific)',
    best_for: 'Local hires, cost-effective',
    api_available: false,
    notes: 'Post in gigs > domestic gigs section'
  },
  poached_jobs: {
    name: 'Poached Jobs',
    type: 'industry_specific',
    cost_per_post: 'Free',
    reach: 'Medium (culinary/hospitality)',
    best_for: 'Restaurant → private chef transitions',
    api_available: false,
    notes: 'Free job board for culinary professionals'
  }
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'create_campaign':
        return await createRecruitmentCampaign(req, res, data);

      case 'post_job':
        return await postJobListing(req, res, data);

      case 'track_lead':
        return await trackChefLead(req, res, data);

      case 'campaigns':
        return await getCampaigns(req, res);

      case 'leads':
        return await getLeads(req, res, data);

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
  // Get active recruitment campaigns
  const { data: campaigns } = await getSupabase()
    .from('ypec_recruitment_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  // Get chef leads
  const { data: leads } = await getSupabase()
    .from(TABLES.CHEF_LEADS)
    .select('status')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    active_campaigns: campaigns?.length || 0,
    total_leads: leads?.length || 0,
    new_leads: leads?.filter(l => l.status === 'new').length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    interviewing: leads?.filter(l => l.status === 'interviewing').length || 0,
    hired: leads?.filter(l => l.status === 'hired').length || 0
  };

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    channels: RECRUITMENT_CHANNELS,
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// CREATE RECRUITMENT CAMPAIGN
// ============================================================================

async function createRecruitmentCampaign(req, res, data) {
  const { location, target_chefs, channels, budget } = data;

  if (!location) {
    return res.status(400).json({ error: 'location required' });
  }

  console.log(`[${BOT_INFO.name}] Creating recruitment campaign for ${location}`);

  const campaign = {
    name: `Chef Recruitment - ${location}`,
    location,
    target_chefs: target_chefs || 5,
    channels: channels || ['indeed', 'linkedin', 'craigslist'],
    budget: budget || calculateBudget(channels || ['indeed', 'linkedin', 'craigslist']),
    status: 'active',
    created_at: new Date().toISOString(),
    job_postings: [],
    leads_generated: 0
  };

  // Create campaign in database
  const { data: created, error } = await tenantInsert('ypec_recruitment_campaigns', campaign).select().single();

  if (error) throw error;

  // Generate job posting templates for each channel
  const job_templates = campaign.channels.map(channel => ({
    channel,
    template: generateJobPosting(location, channel),
    cost: RECRUITMENT_CHANNELS[channel]?.cost_per_post || 'Unknown',
    next_action: `Post to ${RECRUITMENT_CHANNELS[channel]?.name || channel}`
  }));

  console.log(`[${BOT_INFO.name}] Campaign created: ${created.id}`);

  return res.json({
    success: true,
    campaign: created,
    job_templates,
    next_steps: [
      '1. Review job posting templates',
      '2. Post jobs to selected channels',
      '3. Monitor lead generation',
      `4. Recruit ${campaign.target_chefs} chefs for ${location}`
    ],
    estimated_timeline: '2-4 weeks to reach target',
    estimated_cost: campaign.budget
  });
}

// ============================================================================
// POST JOB LISTING
// ============================================================================

async function postJobListing(req, res, data) {
  const { campaign_id, channel, job_details } = data;

  if (!campaign_id || !channel) {
    return res.status(400).json({ error: 'campaign_id and channel required' });
  }

  console.log(`[${BOT_INFO.name}] Posting job to ${channel} for campaign ${campaign_id}`);

  // Get campaign
  const { data: campaign } = await getSupabase()
    .from('ypec_recruitment_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', campaign_id)
    .single();

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Create job posting record
  const posting = {
    campaign_id,
    channel,
    location: campaign.location,
    job_title: job_details?.title || `Private Chef - ${campaign.location}`,
    job_description: job_details?.description || generateJobPosting(campaign.location, channel).description,
    salary_range: job_details?.salary || '$60,000 - $150,000/year',
    posted_date: new Date().toISOString(),
    status: 'active',
    views: 0,
    applications: 0,
    external_job_id: job_details?.external_job_id || null,
    posting_url: job_details?.posting_url || null
  };

  const { data: created, error } = await tenantInsert('ypec_job_postings', posting).select().single();

  if (error) throw error;

  // Return posting instructions based on channel
  const instructions = getPostingInstructions(channel, campaign.location, posting);

  console.log(`[${BOT_INFO.name}] Job posted to ${channel}: ${created.id}`);

  return res.json({
    success: true,
    posting: created,
    instructions,
    tracking: {
      message: 'Log applications as they come in using track_lead action',
      track_url: '/api/ypec/chef-recruitment',
      track_action: 'track_lead'
    }
  });
}

// ============================================================================
// TRACK CHEF LEAD
// ============================================================================

async function trackChefLead(req, res, data) {
  const { campaign_id, source_channel, chef_name, chef_email, chef_phone, chef_location, resume_url, notes } = data;

  if (!chef_email) {
    return res.status(400).json({ error: 'chef_email required' });
  }

  console.log(`[${BOT_INFO.name}] New chef lead: ${chef_name} from ${source_channel}`);

  // Check if lead already exists
  const { data: existing } = await getSupabase()
    .from(TABLES.CHEF_LEADS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('email', chef_email)
    .single();

  if (existing) {
    return res.json({
      success: true,
      message: 'Lead already exists',
      lead_id: existing.id,
      action: 'Update existing lead record'
    });
  }

  // Create new lead
  const lead = {
    campaign_id,
    source: source_channel || 'direct',
    name: chef_name,
    email: chef_email,
    phone: chef_phone,
    location: chef_location,
    resume_url,
    notes,
    status: 'new',
    created_at: new Date().toISOString(),
    last_contacted: null
  };

  const { data: created, error } = await tenantInsert(TABLES.CHEF_LEADS, lead).select().single();

  if (error) throw error;

  // Update campaign lead count
  if (campaign_id) {
    const { data: campaign } = await getSupabase()
      .from('ypec_recruitment_campaigns')
      .select('leads_generated')
      .eq('tenant_id', TENANT_ID)
      .eq('id', campaign_id)
      .single();

    if (campaign) {
      await getSupabase()
        .from('ypec_recruitment_campaigns')
        .update({ leads_generated: campaign.leads_generated + 1 })
        .eq('tenant_id', TENANT_ID)
        .eq('id', campaign_id);
    }
  }

  console.log(`[${BOT_INFO.name}] Chef lead created: ${created.id}`);

  return res.json({
    success: true,
    lead: created,
    next_steps: [
      '1. Review resume and qualifications',
      '2. Contact chef for initial screening',
      '3. Request background check if qualified',
      '4. Schedule interview',
      '5. Make placement decision'
    ]
  });
}

// ============================================================================
// GET CAMPAIGNS
// ============================================================================

async function getCampaigns(req, res) {
  const { data: campaigns, error } = await getSupabase()
    .from('ypec_recruitment_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const categorized = {
    active: campaigns?.filter(c => c.status === 'active') || [],
    completed: campaigns?.filter(c => c.status === 'completed') || [],
    paused: campaigns?.filter(c => c.status === 'paused') || []
  };

  return res.json({
    success: true,
    total: campaigns?.length || 0,
    categorized,
    campaigns
  });
}

// ============================================================================
// GET LEADS
// ============================================================================

async function getLeads(req, res, data) {
  const { campaign_id, status, location } = data || {};

  let query = getSupabase()
    .from(TABLES.CHEF_LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  if (campaign_id) {
    query = query.eq('campaign_id', campaign_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data: leads, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  const byStatus = {};
  leads?.forEach(lead => {
    const s = lead.status || 'new';
    byStatus[s] = (byStatus[s] || 0) + 1;
  });

  return res.json({
    success: true,
    total: leads?.length || 0,
    by_status: byStatus,
    leads
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: campaigns } = await getSupabase()
    .from('ypec_recruitment_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const { data: leads } = await getSupabase()
    .from(TABLES.CHEF_LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const byChannel = {};
  leads?.forEach(lead => {
    const channel = lead.source || 'unknown';
    byChannel[channel] = (byChannel[channel] || 0) + 1;
  });

  const topLocations = {};
  campaigns?.forEach(c => {
    topLocations[c.location] = (topLocations[c.location] || 0) + c.leads_generated;
  });

  const conversionRate = leads && leads.length > 0
    ? ((leads.filter(l => l.status === 'hired').length / leads.length) * 100).toFixed(1)
    : '0';

  return res.json({
    success: true,
    analytics: {
      total_campaigns: campaigns?.length || 0,
      active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
      total_leads: leads?.length || 0,
      leads_by_channel: byChannel,
      leads_by_location: topLocations,
      conversion_rate: conversionRate + '%',
      total_hired: leads?.filter(l => l.status === 'hired').length || 0
    }
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Check active campaigns
  const { data: campaigns } = await getSupabase()
    .from('ypec_recruitment_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active');

  // Check for campaigns that have reached target
  const completed = [];
  for (const campaign of campaigns || []) {
    if (campaign.leads_generated >= campaign.target_chefs) {
      await getSupabase()
        .from('ypec_recruitment_campaigns')
        .update({ status: 'completed', completed_date: new Date().toISOString() })
        .eq('tenant_id', TENANT_ID)
        .eq('id', campaign.id);

      completed.push(campaign);
    }
  }

  console.log(`[${BOT_INFO.name}] Daily run complete: ${completed.length} campaigns completed`);

  return res.json({
    success: true,
    active_campaigns: (campaigns?.length || 0) - completed.length,
    completed_today: completed.length,
    message: completed.length > 0
      ? `✅ ${completed.length} campaigns reached their target!`
      : 'All campaigns progressing normally',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateBudget(channels) {
  const costs = {
    linkedin: 100,
    indeed: 50,
    ziprecruiter: 349,
    culinary_agents: 50,
    craigslist: 15,
    poached_jobs: 0
  };

  const total = channels.reduce((sum, channel) => sum + (costs[channel] || 0), 0);
  return `$${total} (estimated)`;
}

function generateJobPosting(location, channel) {
  const basePosting = {
    title: `Private Estate Chef - ${location}`,
    company: 'Your Private Estate Chef',
    location,
    salary: '$60,000 - $150,000/year',
    description: `Your Private Estate Chef is seeking talented culinary professionals for private household placements in ${location}.

ABOUT THE ROLE:
Work directly with high-net-worth families in beautiful private estates. Enjoy stable, long-term positions with competitive compensation and excellent benefits.

WHAT WE OFFER:
• Competitive salary ($60K-$150K based on experience)
• Long-term, stable placements
• Work-life balance (typically 40-50 hours/week)
• Professional development opportunities
• Benefits package (health, dental, vision)
• Paid time off
• Relocation assistance (if applicable)

REQUIREMENTS:
• Culinary degree or equivalent professional experience
• 3+ years professional cooking experience
• Criminal background check (required for all placements)
• Flexible and creative menu planning skills
• Experience with dietary restrictions (allergies, health conditions, special diets)
• Excellent communication and interpersonal skills
• Clean driving record (preferred)

IDEAL CANDIDATE:
• Passionate about culinary excellence
• Professional and discreet
• Adaptable to family preferences and schedules
• Organized and detail-oriented
• Team player with positive attitude

ABOUT US:
Your Private Estate Chef connects elite culinary talent with discerning private households across North America. We specialize in long-term placements that benefit both chefs and families.

TO APPLY:
Visit: https://yourprivateestatechef.com/chef-careers
Email: chef-relations@yourprivateestatechef.com
Subject: Private Chef Application - ${location}

Please include:
- Resume/CV
- Cover letter
- References (3 professional references)
- Portfolio of dishes (photos welcome)

We review applications on a rolling basis and respond within 3-5 business days.`
  };

  // Channel-specific customizations
  if (channel === 'craigslist') {
    basePosting.description = basePosting.description.substring(0, 600) + '\n\nEmail: chef-relations@yourprivateestatechef.com to apply';
  }

  if (channel === 'linkedin') {
    basePosting.description += '\n\n#PrivateChef #CulinaryJobs #ChefLife #CulinaryCareer';
  }

  return basePosting;
}

function getPostingInstructions(channel, location, posting) {
  const instructions = {
    indeed: {
      platform: 'Indeed',
      url: 'https://employers.indeed.com',
      steps: [
        '1. Log in to Indeed Employer account',
        '2. Click "Post a Job"',
        `3. Job Title: "Private Estate Chef - ${location}"`,
        '4. Copy job description from template',
        '5. Select job type: Full-time',
        '6. Select salary: $60,000 - $150,000',
        '7. Select category: Hospitality & Culinary',
        '8. Add optional sponsor budget ($5-$15/day)',
        '9. Post job',
        '10. Copy job URL and save in YPEC system'
      ],
      cost: '$5-$15/day (optional sponsorship)',
      free_option: true
    },
    linkedin: {
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/talent/post-a-job',
      steps: [
        '1. Log in to LinkedIn Recruiter or Job Slots',
        '2. Click "Post a job"',
        `3. Job Title: "Private Estate Chef - ${location}"`,
        '4. Copy job description from template',
        '5. Select job type: Full-time',
        '6. Select industry: Food & Beverage',
        '7. Add skills: Culinary Arts, Menu Planning, etc.',
        '8. Set application method: Email or LinkedIn Easy Apply',
        '9. Post job',
        '10. Share job posting in relevant LinkedIn groups'
      ],
      cost: '$50-$150 per post',
      free_option: false
    },
    craigslist: {
      platform: 'Craigslist',
      url: `https://${location.toLowerCase().replace(/\s+/g, '')}.craigslist.org`,
      steps: [
        `1. Go to Craigslist for ${location}`,
        '2. Click "post to classifieds"',
        '3. Select "gigs" → "domestic gigs"',
        `4. Title: "Private Estate Chef Wanted - ${location}"`,
        '5. Paste job description (keep under 600 characters)',
        '6. Add email for responses: chef-relations@yourprivateestatechef.com',
        '7. Add compensation: $60K-$150K/year',
        '8. Post ad',
        '9. Renew every 7 days'
      ],
      cost: 'Free (or $25 in some cities)',
      free_option: true
    }
  };

  return instructions[channel] || {
    platform: channel,
    message: `Post job manually to ${channel}`,
    template: posting
  };
}

// Export for testing
module.exports.generateJobPosting = generateJobPosting;
module.exports.calculateBudget = calculateBudget;
module.exports.BOT_INFO = BOT_INFO;
module.exports.RECRUITMENT_CHANNELS = RECRUITMENT_CHANNELS;
