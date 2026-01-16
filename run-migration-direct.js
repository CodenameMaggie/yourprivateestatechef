// Direct Postgres migration runner
require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

async function runMigration() {
  try {
    console.log('Reading migration SQL...');
    const sql = fs.readFileSync('./migrations/create-email-queue-system.sql', 'utf8');

    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Executing migration...');
    console.log('SQL length:', sql.length, 'characters');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Try using Supabase's REST API to execute raw SQL
    // Note: This may not work for DDL, but worth a try
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');

      try {
        // Attempt 1: Use Supabase RPC (requires custom function)
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          console.error('RPC method not available:', error.message);

          // Attempt 2: Direct HTTP to Supabase's PostgreSQL REST endpoint
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP request failed:', errorText);
          } else {
            console.log('✓ Success via HTTP');
          }
        } else {
          console.log('✓ Success via RPC');
        }
      } catch (err) {
        console.error('Error executing statement:', err.message);
      }
    }

    console.log('\n===========================================');
    console.log('Migration execution completed');
    console.log('===========================================');
    console.log('\nNOTE: If errors occurred above, you need to run the migration');
    console.log('manually in Supabase SQL Editor at:');
    console.log('https://supabase.com/dashboard > SQL Editor > New Query');
    console.log('\nMigration file: ./migrations/create-email-queue-system.sql');

  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

runMigration();
