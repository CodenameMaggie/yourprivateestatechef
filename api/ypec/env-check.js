/**
 * Environment Variables Check - Debug endpoint
 */

module.exports = async (req, res) => {
  try {
    // Show first and last 20 chars to detect issues
    const showPartial = (str) => {
      if (!str) return 'NOT SET';
      const len = str.length;
      if (len < 40) return str;
      return `${str.substring(0, 20)}...${str.substring(len - 20)} (${len} chars)`;
    };

    const envVars = {
      SUPABASE_URL: showPartial(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_KEY: showPartial(process.env.SUPABASE_SERVICE_KEY),
      SUPABASE_ANON_KEY: showPartial(process.env.SUPABASE_ANON_KEY),
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',

      // Check for extra whitespace
      url_has_leading_space: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.startsWith(' ') : false,
      url_has_trailing_space: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.endsWith(' ') : false,
      key_has_leading_space: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.startsWith(' ') : false,
      key_has_trailing_space: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.endsWith(' ') : false
    };

    return res.json({
      success: true,
      environment_variables: envVars,
      message: 'Check if variables are properly set'
    });
  } catch (error) {
    console.error('[EnvCheck] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
