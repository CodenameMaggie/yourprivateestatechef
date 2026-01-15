// ============================================================================
// CHEF REFERRAL API ENDPOINT
// Route: /api/ypec-chef-referral
// ============================================================================

const { getChefReferralInfo } = require('./ypec/chef-referral');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      return await getChefReferralInfo(req, res);
    } catch (error) {
      console.error('[ChefReferralAPI] Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
