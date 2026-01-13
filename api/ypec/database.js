/**
 * YPEC Database Connection
 * Lazy-loads Supabase client to avoid startup crashes when env vars aren't set
 */

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      console.warn('[Database] SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
      return null;
    }

    supabase = createClient(url, key);
    console.log('[Database] Supabase client initialized');
  }

  return supabase;
}

module.exports = { getSupabase };
