// ============================================================================
// YPEC B2B PARTNERSHIP OUTREACH BOT
// Reports to: DAN (CMO) & Atlas (CEO)
// Purpose: Strategic partnerships with luxury brands, real estate, Airbnb, wealth management
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const fs = require('fs');
const path = require('path');

const BOT_INFO = {
  name: 'YPEC-PartnershipOutreach',
  reports_to: 'Dan (CMO)',
  supports: 'Atlas (CEO) for strategic partnerships & Henry (COO) for operations',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'B2B partnerships with Airbnb, Sothebys, luxury concierge, wealth management',
  actions: ['status', 'partners', 'campaigns', 'create_campaign', 'track_response', 'analytics', 'pipeline', 'run']
};

// Load partnership targets database
let PARTNERSHIP_TARGETS = [];
let PARTNERSHIP_METADATA = {};
try {
  const partnersPath = path.join(__dirname, '../../data/partnership-targets.json');
  const partnersData = JSON.parse(fs.readFileSync(partnersPath, 'utf8'));

  // Flatten all partnership categories into single array
  Object.keys(partnersData.partnerships).forEach(category => {
    partnersData.partnerships[category].forEach(partner => {
      PARTNERSHIP_TARGETS.push({
        ...partner,
        category
      });
    });
  });

  PARTNERSHIP_METADATA = partnersData.metadata;
} catch (error) {
  console.error('[PartnershipOutreach] Error loading partners database:', error);
}

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'partners':
        return await getPartners(req, res, data);

      case 'campaigns':
        return await getCampaigns(req, res);

      case 'create_campaign':
        return await createCampaign(req, res, data);

      case 'track_response':
        return await trackResponse(req, res, data);

      case 'analytics':
        return await getAnalytics(req, res);

      case 'pipeline':
        return await getPartnershipPipeline(req, res);

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
  const { data: campaigns } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('status, tier, partnership_type')
    .eq('tenant_id', TENANT_ID);

  const stats = {
    total_targets: PARTNERSHIP_TARGETS.length,
    campaigns_sent: campaigns?.filter(c => c.status === 'sent').length || 0,
    responses_received: campaigns?.filter(c => c.status === 'responded').length || 0,
    partnerships_active: campaigns?.filter(c => c.status === 'active').length || 0,
    contracts_signed: campaigns?.filter(c => c.status === 'contract_signed').length || 0,
    not_contacted: PARTNERSHIP_TARGETS.length - (campaigns?.length || 0)
  };

  // Calculate estimated market value
  const activePartnerships = campaigns?.filter(c => c.status === 'active' || c.status === 'contract_signed') || [];
  const estimatedAnnualValue = activePartnerships.reduce((sum, p) => {
    return sum + (p.estimated_annual_value || 0);
  }, 0);

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: stats,
    estimated_annual_partnership_value: estimatedAnnualValue,
    total_addressable_market: PARTNERSHIP_METADATA.total_market_value || '$2.16B - $5.4B',
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// GET PARTNERS
// ============================================================================

async function getPartners(req, res, data) {
  const { filter } = data || {};

  let partners = [...PARTNERSHIP_TARGETS];

  // Apply filters
  if (filter?.category) {
    partners = partners.filter(p => p.category === filter.category);
  }
  if (filter?.tier) {
    partners = partners.filter(p => p.tier === filter.tier);
  }
  if (filter?.type) {
    partners = partners.filter(p => p.type === filter.type);
  }

  // Get outreach status for each partner
  const partnerIds = partners.map(p => p.id);
  const { data: outreach } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .in('partner_id', partnerIds);

  // Merge outreach status with partner data
  const partnersWithStatus = partners.map(partner => {
    const outreachRecord = outreach?.find(o => o.partner_id === partner.id);
    return {
      ...partner,
      outreach_status: outreachRecord?.status || 'not_contacted',
      last_contact_date: outreachRecord?.last_contact_date,
      next_followup_date: outreachRecord?.next_followup_date,
      partnership_stage: outreachRecord?.partnership_stage,
      notes: outreachRecord?.notes
    };
  });

  // Sort by priority (tier)
  const tierOrder = { 'ultra_luxury': 1, 'luxury': 2, 'premium': 3 };
  partnersWithStatus.sort((a, b) => {
    return (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99);
  });

  return res.json({
    success: true,
    total: partnersWithStatus.length,
    partners: partnersWithStatus,
    filters_applied: filter || {},
    categories: ['luxury_real_estate', 'luxury_hospitality', 'wealth_management', 'private_clubs', 'luxury_concierge', 'luxury_brands']
  });
}

// ============================================================================
// GET CAMPAIGNS
// ============================================================================

async function getCampaigns(req, res) {
  const { data: campaigns, error } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Enrich with partner data
  const enriched = campaigns?.map(campaign => {
    const partner = PARTNERSHIP_TARGETS.find(p => p.id === campaign.partner_id);
    return {
      ...campaign,
      partner: partner || { company: 'Unknown Partner', id: campaign.partner_id }
    };
  }) || [];

  const grouped = {
    draft: enriched.filter(c => c.status === 'draft'),
    sent: enriched.filter(c => c.status === 'sent'),
    responded: enriched.filter(c => c.status === 'responded'),
    meeting_scheduled: enriched.filter(c => c.status === 'meeting_scheduled'),
    proposal_sent: enriched.filter(c => c.status === 'proposal_sent'),
    negotiating: enriched.filter(c => c.status === 'negotiating'),
    contract_signed: enriched.filter(c => c.status === 'contract_signed'),
    active: enriched.filter(c => c.status === 'active'),
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
  const { partner_ids, campaign_type, template, tier_filter } = data;

  console.log(`[${BOT_INFO.name}] Creating campaign for ${partner_ids?.length || 0} partners`);

  let targetPartners = [];

  if (partner_ids && partner_ids.length > 0) {
    targetPartners = PARTNERSHIP_TARGETS.filter(p => partner_ids.includes(p.id));
  } else if (tier_filter) {
    // Auto-select all partners in tier (e.g., all "ultra_luxury")
    targetPartners = PARTNERSHIP_TARGETS.filter(p => p.tier === tier_filter);
  } else {
    return res.status(400).json({ error: 'partner_ids or tier_filter required' });
  }

  const campaigns = [];
  const errors = [];

  for (const partner of targetPartners) {
    // Check if already contacted
    const { data: existing } = await getSupabase()
      .from(TABLES.PARTNERSHIP_OUTREACH)
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('partner_id', partner.id)
      .single();

    if (existing) {
      errors.push({ partner_id: partner.id, error: 'Already contacted' });
      continue;
    }

    // Prepare email content
    const emailContent = generatePartnershipEmail(partner, campaign_type || 'initial');

    // Create campaign record
    const { data: campaign, error } = await tenantInsert(TABLES.PARTNERSHIP_OUTREACH, {
      partner_id: partner.id,
      partner_name: partner.company,
      partner_type: partner.type,
      tier: partner.tier,
      category: partner.category,
      contact_email: partner.target_contact,
      campaign_type: campaign_type || 'initial',
      template_used: template || 'strategic_partnership',
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      status: 'draft',
      partnership_stage: 'outreach',
      partnership_type: partner.partnership_type || 'referral',
      created_at: new Date().toISOString(),
      metadata: {
        tier: partner.tier,
        value_prop: partner.value_prop,
        avg_client_value: partner.avg_home_price || partner.avg_booking_value || 'N/A',
        target_markets: partner.target_markets,
        total_addressable: partner.total_members || partner.annual_sales || partner.total_clients
      }
    }).select().single();

    if (error) {
      errors.push({ partner_id: partner.id, error: error.message });
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
  const { partner_id, status, partnership_stage, notes, estimated_annual_value, contract_details } = data;

  if (!partner_id || !status) {
    return res.status(400).json({ error: 'partner_id and status required' });
  }

  const updates = {
    status,
    partnership_stage: partnership_stage || null,
    notes: notes || null,
    last_contact_date: new Date().toISOString()
  };

  if (status === 'responded') {
    updates.response_received_date = new Date().toISOString();
    updates.partnership_stage = 'discovery';
    updates.next_followup_date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
  }

  if (status === 'meeting_scheduled') {
    updates.partnership_stage = 'qualification';
  }

  if (status === 'proposal_sent') {
    updates.partnership_stage = 'proposal';
    updates.proposal_sent_date = new Date().toISOString();
  }

  if (status === 'negotiating') {
    updates.partnership_stage = 'negotiation';
  }

  if (status === 'contract_signed') {
    updates.partnership_stage = 'onboarding';
    updates.contract_signed_date = new Date().toISOString();
    updates.contract_details = contract_details || {};
    updates.estimated_annual_value = estimated_annual_value || 0;
  }

  if (status === 'active') {
    updates.partnership_stage = 'active';
    updates.partnership_started_date = new Date().toISOString();
  }

  if (status === 'declined') {
    updates.partnership_stage = 'closed_lost';
    updates.declined_date = new Date().toISOString();
  }

  const { data: updated, error } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .eq('partner_id', partner_id)
    .select()
    .single();

  if (error) throw error;

  console.log(`[${BOT_INFO.name}] Updated partnership status for ${partner_id}: ${status}`);

  return res.json({
    success: true,
    partner_id,
    new_status: status,
    partnership_stage: updates.partnership_stage,
    updated
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(req, res) {
  const { data: campaigns } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const sent = campaigns?.filter(c => c.status !== 'not_contacted' && c.status !== 'draft') || [];
  const responded = campaigns?.filter(c =>
    ['responded', 'meeting_scheduled', 'proposal_sent', 'negotiating', 'contract_signed', 'active'].includes(c.status)
  ) || [];
  const active = campaigns?.filter(c => c.status === 'active' || c.status === 'contract_signed') || [];

  const responseRate = sent.length > 0 ? ((responded.length / sent.length) * 100).toFixed(1) : '0';
  const conversionRate = sent.length > 0 ? ((active.length / sent.length) * 100).toFixed(1) : '0';

  // Calculate revenue
  const totalEstimatedRevenue = active.reduce((sum, p) => sum + (p.estimated_annual_value || 0), 0);
  const avgDealSize = active.length > 0 ? (totalEstimatedRevenue / active.length) : 0;

  // By tier analysis
  const byTier = {};
  active.forEach(p => {
    const tier = p.tier || 'unknown';
    if (!byTier[tier]) byTier[tier] = { count: 0, revenue: 0 };
    byTier[tier].count++;
    byTier[tier].revenue += (p.estimated_annual_value || 0);
  });

  // By category analysis
  const byCategory = {};
  active.forEach(p => {
    const category = p.category || 'unknown';
    if (!byCategory[category]) byCategory[category] = { count: 0, revenue: 0 };
    byCategory[category].count++;
    byCategory[category].revenue += (p.estimated_annual_value || 0);
  });

  return res.json({
    success: true,
    analytics: {
      total_targets: PARTNERSHIP_TARGETS.length,
      total_contacted: sent.length,
      total_responded: responded.length,
      total_active_partnerships: active.length,
      response_rate: responseRate + '%',
      conversion_rate: conversionRate + '%',
      total_estimated_annual_revenue: totalEstimatedRevenue,
      avg_partnership_value: avgDealSize,
      partnerships_by_tier: byTier,
      partnerships_by_category: byCategory,
      targets_remaining: PARTNERSHIP_TARGETS.length - sent.length,
      next_tier_1_targets: PARTNERSHIP_TARGETS
        .filter(p => p.tier === 'ultra_luxury' && !sent.find(c => c.partner_id === p.id))
        .slice(0, 5)
        .map(p => ({ id: p.id, company: p.company, value_prop: p.value_prop }))
    }
  });
}

// ============================================================================
// PARTNERSHIP PIPELINE
// ============================================================================

async function getPartnershipPipeline(req, res) {
  const { data: campaigns } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID);

  const pipeline = {
    outreach: campaigns?.filter(c => c.partnership_stage === 'outreach') || [],
    discovery: campaigns?.filter(c => c.partnership_stage === 'discovery') || [],
    qualification: campaigns?.filter(c => c.partnership_stage === 'qualification') || [],
    proposal: campaigns?.filter(c => c.partnership_stage === 'proposal') || [],
    negotiation: campaigns?.filter(c => c.partnership_stage === 'negotiation') || [],
    onboarding: campaigns?.filter(c => c.partnership_stage === 'onboarding') || [],
    active: campaigns?.filter(c => c.partnership_stage === 'active') || [],
    closed_lost: campaigns?.filter(c => c.partnership_stage === 'closed_lost') || []
  };

  // Calculate weighted pipeline value
  const stageWeights = {
    outreach: 0.05,
    discovery: 0.10,
    qualification: 0.25,
    proposal: 0.50,
    negotiation: 0.75,
    onboarding: 0.90,
    active: 1.00
  };

  let weightedValue = 0;
  Object.keys(stageWeights).forEach(stage => {
    const stageValue = pipeline[stage].reduce((sum, p) => sum + (p.estimated_annual_value || 100000), 0);
    weightedValue += stageValue * stageWeights[stage];
  });

  return res.json({
    success: true,
    pipeline,
    weighted_pipeline_value: weightedValue,
    total_opportunities: campaigns?.length || 0
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  // Check for follow-ups needed
  const today = new Date().toISOString().split('T')[0];
  const { data: followups } = await getSupabase()
    .from(TABLES.PARTNERSHIP_OUTREACH)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .in('status', ['responded', 'meeting_scheduled', 'proposal_sent'])
    .lte('next_followup_date', today);

  const actions = {
    followups_needed: followups?.length || 0,
    tier_1_prospects: PARTNERSHIP_TARGETS.filter(p =>
      p.tier === 'ultra_luxury' &&
      !followups?.find(c => c.partner_id === p.id)
    ).length
  };

  console.log(`[${BOT_INFO.name}] Daily run: ${actions.followups_needed} followups needed`);

  return res.json({
    success: true,
    actions_identified: actions,
    message: 'Email sending not yet activated - prepared but not sent',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EMAIL TEMPLATE GENERATOR
// ============================================================================

function generatePartnershipEmail(partner, campaign_type) {
  const templates = {
    initial_luxury_real_estate: {
      subject: `Strategic Partnership: ${partner.company} x Your Private Estate Chef`,
      body: `Dear ${partner.company} ${partner.target_contact || 'Partnership'} Team,

I'm reaching out on behalf of Your Private Estate Chef (YPEC), a boutique service connecting high-net-worth households with professionally trained private chefs.

WHY THIS MATTERS TO YOUR CLIENTS:

When your clients purchase a $${partner.avg_home_price || '5M+'} home, they're not just buying property—they're upgrading their entire lifestyle. Yet finding a trustworthy, skilled private chef remains one of the most challenging aspects of their transition.

WHAT WE OFFER:

• Vetted, professionally trained chefs (CIA, Le Cordon Bleu, ICE graduates)
• Flexible arrangements: Full-time ($80K-$150K), weekly service, or event-based
• Seamless onboarding within 2-4 weeks of home purchase
• Ongoing support and chef replacement if needed

PARTNERSHIP OPPORTUNITY:

${partner.value_prop || 'Exclusive referral partnership for your luxury home buyers'}

WHAT'S IN IT FOR YOU:

• ${partner.commission_rate || '5%'} referral commission on successful placements
• Differentiate your service with exclusive lifestyle concierge
• Deepen client relationships beyond the transaction
• No cost to you or your clients for the introduction

With ${partner.annual_sales || 'your volume'} in annual sales, this represents meaningful additional revenue while enhancing the client experience you're known for.

I'd love to schedule a brief 15-minute call to explore how we can support your clients' transitions into their new homes.

Are you available for a call next week?

Best regards,
Dan Williams, CMO
Your Private Estate Chef
dan@yourprivateestatechef.com
(Direct Line Available Upon Request)

P.S. We work with several top luxury real estate firms and can provide client testimonials and case studies.`
    },
    initial_airbnb_luxe: {
      subject: `White-Label Private Chef Service for Airbnb Luxe Hosts`,
      body: `Dear Airbnb Luxe ${partner.target_contact || 'Host Services'} Team,

Your Luxe hosts face a consistent challenge: delivering exceptional culinary experiences at the $${partner.avg_booking_value || '5,000'}/night price point their guests expect.

THE OPPORTUNITY:

Your Private Estate Chef provides white-label private chef services specifically designed for ultra-luxury vacation properties.

WHAT WE OFFER LUXE HOSTS:

• On-demand private chefs for guest bookings
• Fully vetted, professionally trained culinary talent
• Flexible arrangements: Single dinners to week-long bookings
• 48-hour booking turnaround for most markets
• Seamless integration with your concierge services

HOST BENEFITS:

• Increase booking rates with premium chef service add-on
• Command higher nightly rates ($500-$1,500 premium)
• 5-star reviews mentioning culinary experience
• Differentiation in competitive luxury markets

PARTNERSHIP MODEL:

${partner.value_prop || 'Preferred vendor status for Luxe host network'}

We handle all chef vetting, placement, and quality control. Your hosts simply offer it as a premium add-on.

With ${partner.total_properties || '2,000'} Luxe properties, even 10% adoption represents significant additional revenue for both our organizations.

Can we schedule a call to discuss integration options?

Best,
Dan Williams, CMO
Your Private Estate Chef
dan@yourprivateestatechef.com`
    },
    initial_wealth_management: {
      subject: `Exclusive Lifestyle Benefit for ${partner.company} Private Clients`,
      body: `Dear ${partner.company} ${partner.target_contact || 'Private Client Services'},

High-net-worth families consistently ask their advisors: "Who can you recommend for [insert lifestyle service]?"

Private chef placement is one of the most requested—and hardest to solve—lifestyle needs for $${partner.min_client_wealth || '10M'}+ households.

THE SOLUTION:

Your Private Estate Chef provides white-label private chef placement exclusively for wealth management firms like ${partner.company}.

WHAT WE OFFER YOUR CLIENTS:

• Professionally trained chefs from top culinary schools
• Comprehensive vetting (background checks, reference verification)
• Flexible arrangements: Full-time, part-time, or event-based
• Ongoing support and chef replacement guarantee
• Discreet, professional service befitting your client relationships

WHY THIS MATTERS:

• Deepen client relationships beyond portfolio management
• Differentiate your service in a competitive market
• No cost to your firm or clients for introductions
• White-label presentation as "${partner.company} Lifestyle Services"

For your ~${partner.total_clients || '40,000'} clients, this represents a meaningful value-add that strengthens retention and referrals.

Would you be open to a brief conversation about how we can support your clients' lifestyle needs?

Respectfully,
Dan Williams, CMO
Your Private Estate Chef
dan@yourprivateestatechef.com

P.S. We work with several leading wealth management firms and can provide references.`
    },
    followup: {
      subject: `Following up: Partnership with ${partner.company}`,
      body: `Dear ${partner.company} Team,

I wanted to follow up on my previous email regarding a potential partnership between Your Private Estate Chef and ${partner.company}.

QUICK RECAP:

${partner.value_prop || 'Strategic partnership to serve your high-net-worth clients'}

• No cost to you or your clients
• ${partner.commission_rate || 'Revenue sharing'} on successful placements
• Enhance client experience and differentiate your service

I understand you're busy, but I believe this could be mutually beneficial. Would you have 15 minutes for a brief call?

Please let me know if this interests you.

Best regards,
Dan Williams, CMO
Your Private Estate Chef`
    }
  };

  // Select appropriate template based on partner category
  let templateKey = 'initial_luxury_real_estate'; // default

  if (partner.category === 'luxury_real_estate') {
    templateKey = 'initial_luxury_real_estate';
  } else if (partner.id.includes('airbnb')) {
    templateKey = 'initial_airbnb_luxe';
  } else if (partner.category === 'wealth_management') {
    templateKey = 'initial_wealth_management';
  }

  if (campaign_type === 'followup') {
    templateKey = 'followup';
  }

  return templates[templateKey] || templates.initial_luxury_real_estate;
}

// Export for testing
module.exports.generatePartnershipEmail = generatePartnershipEmail;
module.exports.BOT_INFO = BOT_INFO;
module.exports.PARTNERSHIP_TARGETS = PARTNERSHIP_TARGETS;
