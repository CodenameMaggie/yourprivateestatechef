/**
 * Diagnostic endpoint - Check admin account status
 */

const { getSupabase } = require('./database');

module.exports = async (req, res) => {
  try {
    console.log('[Diagnostic] Checking admin account...');

    // Check if admin exists
    const { data: staff, error } = await getSupabase()
      .from('ypec_staff')
      .select('id, email, full_name, role, password_hash')
      .eq('email', 'maggie@maggieforbesstrategies.com')
      .single();

    if (error) {
      return res.json({
        success: false,
        error: 'Admin account not found in database',
        details: error.message
      });
    }

    return res.json({
      success: true,
      admin_exists: true,
      email: staff.email,
      name: staff.full_name,
      role: staff.role,
      has_password_hash: !!staff.password_hash,
      hash_preview: staff.password_hash ? staff.password_hash.substring(0, 20) + '...' : null
    });
  } catch (error) {
    console.error('[Diagnostic] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
