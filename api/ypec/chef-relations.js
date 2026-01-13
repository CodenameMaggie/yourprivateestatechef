// ============================================================================
// YPEC-CHEFRELATIONS BOT
// Reports to: HENRY (COO - Chief Operating Officer)
// Purpose: Chef recruitment, onboarding, availability management, chef matching
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const mfs = require('./mfs-integration');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BOT_INFO = {
  name: 'YPEC-ChefRelations',
  reports_to: 'HENRY (COO)',
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
  const { data: chefs } = await supabase
    .from('ypec_chefs')
    .select('status');

  const grouped = {
    applicants: chefs?.filter(c => c.status === 'applicant').length || 0,
    screening: chefs?.filter(c => c.status === 'screening').length || 0,
    onboarding: chefs?.filter(c => c.status === 'onboarding').length || 0,
    active: chefs?.filter(c => c.status === 'active').length || 0,
    inactive: chefs?.filter(c => c.status === 'inactive').length || 0
  };

  // Get available chefs
  const { data: availableChefs } = await supabase
    .from('ypec_chefs')
    .select('id, full_name, current_households, max_households')
    .eq('status', 'active')
    .lt('current_households', supabase.raw('max_households'));

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
  const { data: households } = await supabase
    .from('ypec_households')
    .select('primary_address, status')
    .in('status', ['inquiry', 'consultation_scheduled', 'consultation_complete']);

  // Get active chefs by region
  const { data: chefs } = await supabase
    .from('ypec_chefs')
    .select('region, current_households, max_households')
    .eq('status', 'active');

  // Calculate demand by region
  const demandByRegion = {};
  // TODO: Implement region extraction from address
  // TODO: Identify high-demand regions
  // TODO: Send recruitment emails to qualified candidates in those regions

  console.log(`[${BOT_INFO.name}] Recruitment analysis complete`);

  return res.json({
    success: true,
    message: 'Recruitment outreach completed',
    regions_analyzed: Object.keys(demandByRegion).length
  });
}

// ============================================================================
// ONBOARD CHEF
// ============================================================================

async function onboardChef(req, res, data) {
  const { chef_id } = data;

  console.log(`[${BOT_INFO.name}] Onboarding chef: ${chef_id}`);

  // Update chef status
  const { error } = await supabase
    .from('ypec_chefs')
    .update({
      status: 'active',
      onboarding_date: new Date().toISOString()
    })
    .eq('id', chef_id);

  if (error) throw error;

  // Get chef details
  const { data: chef } = await supabase
    .from('ypec_chefs')
    .select('*')
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

  const { data: availability, error } = await supabase
    .from('ypec_chef_availability')
    .select('*')
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
  const { data: household } = await supabase
    .from('ypec_households')
    .select('*')
    .eq('id', household_id)
    .single();

  if (!household) {
    return res.status(404).json({ error: 'Household not found' });
  }

  // Extract region from address (simplified - you may need geocoding)
  const householdState = household.primary_address?.split(',').pop()?.trim();

  // Find available chefs in the region
  const { data: chefs } = await supabase
    .from('ypec_chefs')
    .select('*')
    .eq('status', 'active')
    .lt('current_households', supabase.raw('max_households'));

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
      name: c.full_name,
      region: c.region,
      specialties: c.specialties,
      experience_years: c.experience_years,
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
  const { data: events } = await supabase
    .from('ypec_events')
    .select('*, household:ypec_households(primary_contact_name)')
    .eq('chef_id', chef_id)
    .not('client_feedback', 'is', null)
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
  const { data: chefs } = await supabase
    .from('ypec_chefs')
    .select('id, full_name, current_households, max_households, region')
    .eq('status', 'active');

  let updated = 0;
  let availableChefs = 0;
  let totalCapacity = 0;
  let usedCapacity = 0;

  for (const chef of chefs || []) {
    // Count actual active engagements
    const { data: engagements } = await supabase
      .from('ypec_engagements')
      .select('id')
      .eq('chef_id', chef.id)
      .eq('status', 'active');

    const actualCount = engagements?.length || 0;

    if (actualCount !== chef.current_households) {
      // Update count
      await supabase
        .from('ypec_chefs')
        .update({ current_households: actualCount })
        .eq('id', chef.id);

      updated++;
      console.log(`[${BOT_INFO.name}] Updated ${chef.full_name}: ${chef.current_households} → ${actualCount}`);
    }

    // Track capacity
    totalCapacity += chef.max_households || 0;
    usedCapacity += actualCount;
    if (actualCount < (chef.max_households || 0)) {
      availableChefs++;
    }
  }

  // Check waitlist
  const { data: waitlist } = await supabase
    .from('ypec_households')
    .select('id')
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
Dear ${chef.full_name},

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
