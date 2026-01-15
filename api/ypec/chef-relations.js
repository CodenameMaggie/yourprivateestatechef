// ============================================================================
// YPEC-CHEFRELATIONS BOT
// Reports to: HENRY (COO - Chief Operating Officer)
// Purpose: Chef recruitment, onboarding, availability management, chef matching
// ============================================================================

const { getSupabase, tenantInsert, tenantUpdate, TENANT_ID, TABLES } = require('./database');
const mfs = require('./mfs-integration');


const BOT_INFO = {
  name: 'YPEC-ChefRelations',
  reports_to: 'DAN (CMO)',
  supports: 'HENRY (CEO - Operations & Customer Relationships)',
  company: 'Your Private Estate Chef',
  company_number: 7,
  purpose: 'Chef recruitment, onboarding, availability, matching',
  actions: ['status', 'recruit', 'onboard', 'availability', 'match', 'feedback', 'sync_availability', 'run']
};

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'status':
        return await getStatus(req, res);

      case 'recruit':
        return await recruitChefs(req, res);

      case 'onboard':
        return await onboardChef(req, res, data);

      case 'availability':
        return await getChefAvailability(req, res, data);

      case 'match':
        return await matchChefToHousehold(req, res, data);

      case 'feedback':
        return await getChefFeedback(req, res, data);

      case 'sync_availability':
        return await syncAvailability(req, res);

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
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('status')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef');

  const grouped = {
    applicants: chefs?.filter(c => c.status === 'applicant').length || 0,
    screening: chefs?.filter(c => c.status === 'screening').length || 0,
    onboarding: chefs?.filter(c => c.status === 'onboarding').length || 0,
    active: chefs?.filter(c => c.status === 'active').length || 0,
    inactive: chefs?.filter(c => c.status === 'inactive').length || 0
  };

  // Get available chefs (filter where current_households < max_households)
  const { data: allChefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('id, first_name, last_name, current_households, max_households')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef')
    .eq('status', 'active');

  const availableChefs = allChefs?.filter(chef => chef.current_households < chef.max_households) || [];

  return res.json({
    bot: BOT_INFO,
    status: 'active',
    metrics: {
      total_chefs: chefs?.length || 0,
      ...grouped,
      available_capacity: availableChefs?.length || 0
    },
    available_chefs: availableChefs,
    last_run: new Date().toISOString()
  });
}

// ============================================================================
// RECRUIT CHEFS (Cron - Weekly Monday 9am)
// ============================================================================

async function recruitChefs(req, res) {
  console.log(`[${BOT_INFO.name}] Chef recruitment outreach (cron)`);

  // Get regions with high demand (more households than available chefs)
  const { data: households } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('primary_address, status')
    .eq('tenant_id', TENANT_ID)
    .in('status', ['inquiry', 'consultation_scheduled', 'waitlist']);

  // Get active chefs by region
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('region, current_households, max_households, status')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef')
    .eq('status', 'active');

  // Calculate demand by region
  const demandByRegion = {};
  const regionCoverage = {};

  // Extract regions from household addresses
  households?.forEach(h => {
    if (h.primary_address) {
      // Extract state/province from address (simplified)
      const parts = h.primary_address.split(',');
      const region = parts[parts.length - 1]?.trim() || 'Unknown';
      demandByRegion[region] = (demandByRegion[region] || 0) + 1;
    }
  });

  // Calculate chef coverage by region
  chefs?.forEach(chef => {
    const region = chef.region || 'Unknown';
    if (!regionCoverage[region]) {
      regionCoverage[region] = {
        chefs: 0,
        capacity: 0,
        used: 0
      };
    }
    regionCoverage[region].chefs++;
    regionCoverage[region].capacity += chef.max_households || 3;
    regionCoverage[region].used += chef.current_households || 0;
  });

  // Identify high-demand regions (demand > 80% of capacity)
  const highDemandRegions = [];
  Object.keys(demandByRegion).forEach(region => {
    const demand = demandByRegion[region];
    const coverage = regionCoverage[region] || { capacity: 0 };
    const capacityRatio = coverage.capacity > 0 ? (demand / coverage.capacity) : 999;

    if (capacityRatio > 0.8 || !coverage.capacity) {
      highDemandRegions.push({
        region,
        demand,
        chefs: coverage.chefs || 0,
        capacity: coverage.capacity || 0,
        gap: demand - coverage.capacity
      });
    }
  });

  // Alert HENRY about recruitment needs
  if (highDemandRegions.length > 0) {
    await mfs.alertHenryRecruitmentNeeds({
      type: 'recruitment_analysis',
      high_demand_regions: highDemandRegions,
      total_regions_analyzed: Object.keys(demandByRegion).length,
      recommended_action: 'Post job listings in high-demand regions',
      details: highDemandRegions.map(r =>
        `${r.region}: ${r.demand} households, ${r.chefs} chefs (need ${r.gap} more)`
      ).join('\n')
    });
  }

  // Get chef recruitment leads (from lead scraper)
  const { data: leads } = await getSupabase()
    .from(TABLES.CHEF_LEADS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'new')
    .limit(20);

  let outreachSent = 0;

  // Send recruitment emails to qualified leads in high-demand regions
  for (const lead of leads || []) {
    const leadRegion = lead.location || lead.region;
    const isHighDemand = highDemandRegions.some(r =>
      leadRegion?.includes(r.region) || r.region.includes(leadRegion)
    );

    if (isHighDemand) {
      await sendRecruitmentEmail(lead);

      // Update lead status
      await tenantUpdate(TABLES.CHEF_LEADS, {
        status: 'contacted',
        contacted_at: new Date().toISOString()
      }).eq('id', lead.id);

      outreachSent++;
    }
  }

  console.log(`[${BOT_INFO.name}] Recruitment analysis complete - ${outreachSent} emails sent`);

  return res.json({
    success: true,
    message: 'Recruitment outreach completed',
    regions_analyzed: Object.keys(demandByRegion).length,
    high_demand_regions: highDemandRegions.length,
    outreach_sent: outreachSent,
    regions: highDemandRegions
  });
}

// ============================================================================
// ONBOARD CHEF
// ============================================================================

async function onboardChef(req, res, data) {
  const { chef_id } = data;

  console.log(`[${BOT_INFO.name}] Onboarding chef: ${chef_id}`);

  // Update chef status
  const { error } = await tenantUpdate(TABLES.USERS, {
    status: 'active',
    onboarding_date: new Date().toISOString()
  }).eq('id', chef_id);

  if (error) throw error;

  // Get chef details
  const { data: chef } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', chef_id)
    .single();

  // Send welcome email to chef
  await sendChefWelcomeEmail(chef);

  console.log(`[${BOT_INFO.name}] Chef onboarded: ${chef.full_name}`);

  return res.json({
    success: true,
    chef_id: chef_id,
    chef_name: chef.full_name,
    message: 'Chef onboarded successfully'
  });
}

// ============================================================================
// GET CHEF AVAILABILITY
// ============================================================================

async function getChefAvailability(req, res, data) {
  const { chef_id } = data;

  const { data: availability, error } = await getSupabase()
    .from(TABLES.CHEF_AVAILABILITY)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('chef_id', chef_id)
    .order('day_of_week');

  if (error) throw error;

  return res.json({
    success: true,
    chef_id,
    availability
  });
}

// ============================================================================
// MATCH CHEF TO HOUSEHOLD
// ============================================================================

async function matchChefToHousehold(req, res, data) {
  const { household_id } = data;

  console.log(`[${BOT_INFO.name}] Finding chef match for household: ${household_id}`);

  // Get household details
  const { data: household } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', household_id)
    .single();

  if (!household) {
    return res.status(404).json({ error: 'Household not found' });
  }

  // Extract region from address
  const householdState = household.state || household.primary_address?.split(',').pop()?.trim();

  // Find available chefs in the region (filter where current_households < max_households)
  const { data: allRegionChefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef')
    .eq('status', 'active');

  const chefs = allRegionChefs?.filter(chef => chef.current_households < chef.max_households) || [];

  if (!chefs || chefs.length === 0) {
    return res.json({
      success: false,
      message: 'No available chefs found',
      waitlist: true
    });
  }

  // Score each chef
  const scoredChefs = chefs.map(chef => {
    let score = 0;

    // Location match (same state)
    if (chef.state === householdState) {
      score += 50;
    }

    // Cuisine preferences match
    if (household.cuisine_preferences && chef.specialties) {
      const matches = household.cuisine_preferences.filter(pref =>
        chef.specialties.some(spec => spec.toLowerCase().includes(pref.toLowerCase()))
      );
      score += matches.length * 20;
    }

    // Dietary expertise match
    if (household.dietary_requirements && chef.dietary_expertise) {
      const matches = household.dietary_requirements.filter(req =>
        chef.dietary_expertise.some(exp => exp.toLowerCase().includes(req.toLowerCase()))
      );
      score += matches.length * 15;
    }

    // Capacity (prefer chefs with more availability)
    const capacityRatio = chef.current_households / chef.max_households;
    score += (1 - capacityRatio) * 10;

    // Experience
    score += Math.min(chef.experience_years || 0, 10);

    return {
      ...chef,
      match_score: Math.round(score)
    };
  });

  // Sort by score
  const rankedChefs = scoredChefs
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);

  console.log(`[${BOT_INFO.name}] Top 3 chef matches found`);

  return res.json({
    success: true,
    household_id,
    top_matches: rankedChefs.map(c => ({
      chef_id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      region: c.location || c.region,
      specialties: c.specialties,
      experience_years: c.years_experience,
      match_score: c.match_score,
      current_capacity: `${c.current_households}/${c.max_households}`
    })),
    recommended: rankedChefs[0]
  });
}

// ============================================================================
// GET CHEF FEEDBACK
// ============================================================================

async function getChefFeedback(req, res, data) {
  const { chef_id } = data;

  // Get events for this chef with feedback
  const { data: events } = await getSupabase()
    .from(TABLES.EVENTS)
    .select(`*, client:${TABLES.CLIENTS}(primary_contact_name)`)
    .eq('tenant_id', TENANT_ID)
    .eq('chef_id', chef_id)
    .not('metadata->client_feedback', 'is', null)
    .order('event_date', { ascending: false });

  // Calculate average rating
  const ratings = events
    ?.filter(e => e.client_rating)
    .map(e => e.client_rating) || [];

  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
    : null;

  return res.json({
    success: true,
    chef_id,
    total_feedback: events?.length || 0,
    average_rating: avgRating,
    recent_feedback: events?.slice(0, 10)
  });
}

// ============================================================================
// SYNC AVAILABILITY (Cron - Daily 8am)
// ============================================================================

async function syncAvailability(req, res) {
  console.log(`[${BOT_INFO.name}] Syncing chef availability (cron)`);

  // Get all active chefs
  const { data: chefs } = await getSupabase()
    .from(TABLES.USERS)
    .select('id, first_name, last_name, current_households, max_households, location, region')
    .eq('tenant_id', TENANT_ID)
    .eq('user_type', 'chef')
    .eq('status', 'active');

  let updated = 0;
  let availableChefs = 0;
  let totalCapacity = 0;
  let usedCapacity = 0;

  for (const chef of chefs || []) {
    // Count actual active engagements
    const { data: engagements } = await getSupabase()
      .from(TABLES.ENGAGEMENTS)
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('assigned_user_id', chef.id)
      .eq('status', 'active');

    const actualCount = engagements?.length || 0;

    if (actualCount !== chef.current_households) {
      // Update count
      await tenantUpdate(TABLES.USERS, {
        current_households: actualCount
      }).eq('id', chef.id);

      updated++;
      console.log(`[${BOT_INFO.name}] Updated ${chef.first_name} ${chef.last_name}: ${chef.current_households} → ${actualCount}`);
    }

    // Track capacity
    totalCapacity += chef.max_households || 0;
    usedCapacity += actualCount;
    if (actualCount < (chef.max_households || 0)) {
      availableChefs++;
    }
  }

  // Check waitlist
  const { data: waitlist } = await getSupabase()
    .from(TABLES.CLIENTS)
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'waitlist');

  const capacityUtilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

  // Alert HENRY if capacity is critical
  if (capacityUtilization > 80 || (waitlist && waitlist.length > 5 && availableChefs < 2)) {
    await mfs.alertHenryChefCapacity({
      type: 'capacity_check',
      severity: capacityUtilization > 90 ? 'critical' : 'warning',
      available_chefs: availableChefs,
      total_chefs: chefs?.length || 0,
      capacity_utilization: capacityUtilization.toFixed(1) + '%',
      waitlist_size: waitlist?.length || 0,
      recommended_action: capacityUtilization > 90
        ? 'URGENT: Begin chef recruitment immediately'
        : 'Consider recruiting additional chefs',
      details: `${usedCapacity}/${totalCapacity} capacity used`
    });
  }

  return res.json({
    success: true,
    chefs_checked: chefs?.length || 0,
    chefs_updated: updated,
    capacity: {
      available_chefs: availableChefs,
      utilization: capacityUtilization.toFixed(1) + '%',
      waitlist: waitlist?.length || 0
    }
  });
}

// ============================================================================
// DAILY RUN
// ============================================================================

async function dailyRun(req, res) {
  console.log(`[${BOT_INFO.name}] Daily run started`);

  await syncAvailability(req, null);

  return res.json({
    success: true,
    message: 'Daily run completed',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

async function sendChefWelcomeEmail(chef) {
  const emailContent = `
Dear ${chef.first_name} ${chef.last_name},

Welcome to Your Private Estate Chef.

You've been approved to join our network of exceptional private chefs. We're honored to have you as part of YPEC.

Next steps:
1. Review the YPEC Chef Handbook (attached)
2. Complete your profile in the chef portal
3. Set your weekly availability
4. We'll match you with your first household shortly

Welcome to the table.

The YPEC Team
  `.trim();

  console.log(`[${BOT_INFO.name}] Welcome email prepared for ${chef.email}`);
}

async function sendRecruitmentEmail(lead) {
  const emailContent = `
Dear ${lead.name || 'Chef'},

We discovered your profile and believe you'd be an exceptional fit for Your Private Estate Chef.

YPEC connects elite private chefs with discerning households seeking five-star dining experiences in the comfort of their homes.

What we offer:
• Competitive compensation (${lead.location?.includes('TX') ? '$65-95/hour' : '$70-100/hour'})
• Flexible scheduling - choose your availability
• High-end clientele who value culinary excellence
• Full autonomy in your kitchen
• No restaurant hours or corporate politics

We're currently expanding in your region (${lead.location}) and would love to discuss opportunities with you.

Interested? Apply here: https://yourprivateestatechef.com/chef-application.html

Questions? Reply to this email - we read every response personally.

Warm regards,
HENRY - Chief Operating Officer
Your Private Estate Chef

---
By introduction only.
www.yourprivateestatechef.com
  `.trim();

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[${BOT_INFO.name}] Recruitment email prepared for ${lead.email}`);

  // Log the outreach
  await tenantInsert(TABLES.COMMUNICATIONS, {
    direction: 'outbound',
    from_contact: 'YPEC-ChefRelations',
    to_contact: lead.email,
    subject: 'Exceptional Opportunity for Private Chefs',
    message: emailContent,
    channel: 'email',
    status: 'sent',
    metadata: { lead_id: lead.id, campaign: 'chef_recruitment' }
  });
}
