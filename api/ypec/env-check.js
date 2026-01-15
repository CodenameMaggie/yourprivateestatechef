/**
 * Environment Variables Check - Debug endpoint
 */

module.exports = async (req, res) => {
  try {
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET (length: ' + process.env.SUPABASE_URL.length + ')' : 'NOT SET',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      SUPABASE_URL_value: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'N/A'
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
