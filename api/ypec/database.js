/**
 * YPEC Database Connection
 * Lazy-loads Supabase client to avoid startup crashes when env vars aren't set
 */

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_KEY?.trim();

    if (!url || !key) {
      console.warn('[Database] SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
      return null;
    }

    console.log('[Database] Initializing Supabase client...');
    console.log('[Database] URL:', url);
    console.log('[Database] Key length:', key.length);

    try {
      supabase = createClient(url, key);
      console.log('[Database] Supabase client initialized successfully');
    } catch (error) {
      console.error('[Database] Failed to initialize Supabase:', error);
      throw error;
    }
  }

  return supabase;
}

module.exports = { getSupabase };
