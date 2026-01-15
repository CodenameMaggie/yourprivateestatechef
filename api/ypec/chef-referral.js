// ============================================================================
// YPEC CHEF REFERRAL PROGRAM
// Purpose: Incentivize existing chefs to refer qualified candidates
// ============================================================================

const { getSupabase } = require('./database');
const crypto = require('crypto');

const REFERRAL_BONUSES = {
  application_submitted: 0, // No bonus for just submitting
  screening: 50, // $50 when referred chef reaches screening
  onboarding: 150, // $150 when referred chef reaches onboarding
  active_30_days: 500, // $500 when referred chef stays active for 30 days
  active_90_days: 1000 // $1000 when referred chef stays active for 90 days
};

// ============================================================================
// GENERATE REFERRAL CODE
// ============================================================================

async function generateReferralCode(chefId) {
  try {
    // Generate unique 8-character referral code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Check if code already exists
    const { data: existing } = await getSupabase()
      .from('ypec_chef_referrals')
      .select('id')
      .eq('referral_code', code)
      .single();

    if (existing) {
      // Recursive call if code exists (unlikely)
      return await generateReferralCode(chefId);
    }

    // Create referral tracking record
    const { data: referral, error } = await getSupabase()
      .from('ypec_chef_referrals')
      .insert({
        chef_id: chefId,
        referral_code: code,
        referral_url: `https://yourprivateestatechef.com/chef-application.html?ref=${code}`,
        total_referrals: 0,
        total_earnings: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      referral_code: code,
      referral_url: referral.referral_url
    };

  } catch (error) {
    console.error('[ChefReferral] Generate code error:', error);
    throw error;
  }
}

// ============================================================================
// GET CHEF REFERRAL INFO
// ============================================================================

async function getChefReferralInfo(req, res) {
  try {
    const { chef_id } = req.body.data || req.query;

    if (!chef_id) {
      return res.status(400).json({
        success: false,
        error: 'chef_id required'
      });
    }

    // Get or create referral tracking
    let { data: referral } = await getSupabase()
      .from('ypec_chef_referrals')
      .select('*')
      .eq('chef_id', chef_id)
      .single();

    if (!referral) {
      // Generate new referral code for chef
      const result = await generateReferralCode(chef_id);
      const { data: newReferral } = await getSupabase()
        .from('ypec_chef_referrals')
        .select('*')
        .eq('chef_id', chef_id)
        .single();

      referral = newReferral;
    }

    // Get referred chefs and their status
    const { data: referredChefs } = await getSupabase()
      .from('ypec_chefs')
      .select('id, first_name, last_name, status, created_at, onboarding_date')
      .eq('referred_by', chef_id)
      .order('created_at', { ascending: false });

    // Calculate pending earnings
    let pendingEarnings = 0;
    const referralBreakdown = [];

    referredChefs?.forEach(chef => {
      const earned = calculateReferralBonus(chef);
      pendingEarnings += earned.total;
      referralBreakdown.push({
        chef_name: `${chef.first_name} ${chef.last_name}`,
        status: chef.status,
        earned: earned.total,
        breakdown: earned.breakdown
      });
    });

    return res.json({
      success: true,
      referral_code: referral.referral_code,
      referral_url: referral.referral_url,
      total_referrals: referredChefs?.length || 0,
      total_earnings: referral.total_earnings || 0,
      pending_earnings: pendingEarnings,
      referred_chefs: referralBreakdown,
      bonus_structure: REFERRAL_BONUSES
    });

  } catch (error) {
    console.error('[ChefReferral] Get info error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// TRACK REFERRAL (Called when someone applies with referral code)
// ============================================================================

async function trackReferral(referralCode, newChefId) {
  try {
    if (!referralCode) return;

    console.log(`[ChefReferral] Tracking referral: ${referralCode} -> ${newChefId}`);

    // Find referral record
    const { data: referral } = await getSupabase()
      .from('ypec_chef_referrals')
      .select('chef_id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!referral) {
      console.log(`[ChefReferral] Invalid referral code: ${referralCode}`);
      return;
    }

    // Update new chef with referrer
    await getSupabase()
      .from('ypec_chefs')
      .update({
        referred_by: referral.chef_id,
        referral_code_used: referralCode.toUpperCase()
      })
      .eq('id', newChefId);

    // Increment referral count
    await getSupabase()
      .from('ypec_chef_referrals')
      .update({
        total_referrals: getSupabase().raw('total_referrals + 1')
      })
      .eq('chef_id', referral.chef_id);

    console.log(`[ChefReferral] Referral tracked successfully`);

  } catch (error) {
    console.error('[ChefReferral] Track referral error:', error);
  }
}

// ============================================================================
// PROCESS REFERRAL BONUS (Called when referred chef status changes)
// ============================================================================

async function processReferralBonus(referredChefId, newStatus) {
  try {
    console.log(`[ChefReferral] Processing bonus for chef ${referredChefId} -> ${newStatus}`);

    // Get referred chef info
    const { data: chef } = await getSupabase()
      .from('ypec_chefs')
      .select('id, referred_by, first_name, last_name, created_at, onboarding_date')
      .eq('id', referredChefId)
      .single();

    if (!chef || !chef.referred_by) {
      return; // Not a referral
    }

    // Calculate bonus for this milestone
    const earned = calculateReferralBonus(chef);
    const milestoneBonus = getMilestoneBonus(newStatus, chef);

    if (milestoneBonus === 0) {
      return; // No bonus for this milestone
    }

    // Check if bonus already paid for this milestone
    const { data: existingBonus } = await getSupabase()
      .from('ypec_referral_bonuses')
      .select('id')
      .eq('referred_chef_id', referredChefId)
      .eq('milestone', newStatus)
      .single();

    if (existingBonus) {
      console.log(`[ChefReferral] Bonus already paid for milestone: ${newStatus}`);
      return;
    }

    // Record bonus
    await getSupabase()
      .from('ypec_referral_bonuses')
      .insert({
        referrer_chef_id: chef.referred_by,
        referred_chef_id: referredChefId,
        milestone: newStatus,
        bonus_amount: milestoneBonus,
        status: 'earned',
        earned_at: new Date().toISOString()
      });

    // Update total earnings
    await getSupabase()
      .from('ypec_chef_referrals')
      .update({
        total_earnings: getSupabase().raw(`total_earnings + ${milestoneBonus}`)
      })
      .eq('chef_id', chef.referred_by);

    // Notify referrer
    const { data: referrer } = await getSupabase()
      .from('ypec_chefs')
      .select('first_name, last_name, email')
      .eq('id', chef.referred_by)
      .single();

    console.log(`[ChefReferral] Bonus earned: $${milestoneBonus} for ${referrer.first_name} ${referrer.last_name}`);

    // TODO: Send notification email to referrer about bonus earned

  } catch (error) {
    console.error('[ChefReferral] Process bonus error:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateReferralBonus(chef) {
  const breakdown = [];
  let total = 0;

  // Screening bonus
  if (['screening', 'onboarding', 'active'].includes(chef.status)) {
    breakdown.push({ milestone: 'screening', amount: REFERRAL_BONUSES.screening });
    total += REFERRAL_BONUSES.screening;
  }

  // Onboarding bonus
  if (['onboarding', 'active'].includes(chef.status)) {
    breakdown.push({ milestone: 'onboarding', amount: REFERRAL_BONUSES.onboarding });
    total += REFERRAL_BONUSES.onboarding;
  }

  // Active 30 days bonus
  if (chef.status === 'active' && chef.onboarding_date) {
    const daysSinceOnboarding = Math.floor(
      (new Date() - new Date(chef.onboarding_date)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOnboarding >= 30) {
      breakdown.push({ milestone: 'active_30_days', amount: REFERRAL_BONUSES.active_30_days });
      total += REFERRAL_BONUSES.active_30_days;
    }

    if (daysSinceOnboarding >= 90) {
      breakdown.push({ milestone: 'active_90_days', amount: REFERRAL_BONUSES.active_90_days });
      total += REFERRAL_BONUSES.active_90_days;
    }
  }

  return { breakdown, total };
}

function getMilestoneBonus(status, chef) {
  switch (status) {
    case 'screening':
      return REFERRAL_BONUSES.screening;
    case 'onboarding':
      return REFERRAL_BONUSES.onboarding;
    case 'active':
      // Check if 30 or 90 days (this would be called by a cron job)
      if (chef.onboarding_date) {
        const daysSinceOnboarding = Math.floor(
          (new Date() - new Date(chef.onboarding_date)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceOnboarding === 30) return REFERRAL_BONUSES.active_30_days;
        if (daysSinceOnboarding === 90) return REFERRAL_BONUSES.active_90_days;
      }
      return 0;
    default:
      return 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateReferralCode,
  getChefReferralInfo,
  trackReferral,
  processReferralBonus,
  REFERRAL_BONUSES
};
