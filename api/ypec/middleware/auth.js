// ============================================================================
// AUTHENTICATION MIDDLEWARE
// Purpose: Protect routes and verify session tokens
// ============================================================================

const { getSupabase } = require('../database');

/**
 * Middleware to require admin authentication
 */
async function requireAdminAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No session token provided'
      });
    }

    // Verify session in database
    const { data: session, error } = await getSupabase()
      .from('ypec_admin_sessions')
      .select(`
        *,
        staff:ypec_staff(*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired session'
      });
    }

    // Attach user and session to request
    req.user = session.staff;
    req.session = session;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Admin auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Middleware to require client authentication
 */
async function requireClientAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.body?.data?.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No session token provided'
      });
    }

    // Verify session in database
    const { data: session, error } = await getSupabase()
      .from('ypec_household_sessions')
      .select(`
        *,
        household:ypec_households(*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired session'
      });
    }

    // Attach household and session to request
    req.household = session.household;
    req.session = session;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Client auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Middleware to require chef authentication
 */
async function requireChefAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.body?.data?.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No session token provided'
      });
    }

    // Verify session in database
    const { data: session, error } = await getSupabase()
      .from('ypec_chef_sessions')
      .select(`
        *,
        chef:ypec_chefs(*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired session'
      });
    }

    // Attach chef and session to request
    req.chef = session.chef;
    req.session = session;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Chef auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Middleware to verify action requires authentication
 * Checks the action type and applies appropriate auth
 */
async function verifyActionAuth(req, res, next) {
  const { action } = req.body;

  // Public actions (no auth required)
  const publicActions = [
    'status',
    'admin_login',
    'client_login',
    'chef_login',
    'chef_application'
  ];

  if (publicActions.includes(action)) {
    return next();
  }

  // Client actions
  const clientActions = ['client_dashboard'];
  if (clientActions.includes(action)) {
    return requireClientAuth(req, res, next);
  }

  // Chef actions
  const chefActions = ['chef_dashboard', 'chef_update_availability'];
  if (chefActions.includes(action)) {
    return requireChefAuth(req, res, next);
  }

  // All other actions require admin auth
  return requireAdminAuth(req, res, next);
}

module.exports = {
  requireAdminAuth,
  requireClientAuth,
  requireChefAuth,
  verifyActionAuth
};
