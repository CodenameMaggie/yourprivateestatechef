// ============================================================================
// TEMPORARY MIGRATION RUNNER - Run SQL migrations on production database
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  const { sql } = req.body;

  if (!sql) {
    return res.status(400).json({
      error: 'SQL statement required in request body'
    });
  }

  try {
    // Create service role client (has permissions to run DDL)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute SQL using RPC call to a custom function
    // Or use direct database connection
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, try direct execution via postgres
      console.error('RPC exec_sql not found, trying alternative...');

      // Alternative: Use supabase-js to create tables directly
      // For email queue, we'll create it using the Supabase client
      const queries = sql.split(';').filter(q => q.trim());

      const results = [];
      for (const query of queries) {
        if (query.trim()) {
          try {
            // For CREATE TABLE and other DDL, we need to use the REST API directly
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              },
              body: JSON.stringify({ query: query })
            });

            results.push({ query: query.substring(0, 50) + '...', success: response.ok });
          } catch (err) {
            console.error('Failed to execute query:', err.message);
            results.push({ query: query.substring(0, 50) + '...', error: err.message });
          }
        }
      }

      return res.json({
        success: true,
        message: 'Migration executed (partial support)',
        note: 'Supabase requires running DDL via dashboard or dedicated migration tool',
        suggestion: 'Please run the migration SQL in Supabase SQL Editor',
        sql_length: sql.length,
        results: results
      });
    }

    return res.json({
      success: true,
      message: 'Migration executed successfully',
      data: data
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      message: error.message,
      suggestion: 'Run migration manually in Supabase SQL Editor'
    });
  }
};
