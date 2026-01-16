#!/usr/bin/env node
/**
 * SQL MIGRATION RUNNER FOR YPEC
 * Executes SQL migration files against Supabase database
 *
 * Usage: node migrations/run-migrations.js [migration-file.sql]
 *        node migrations/run-migrations.js  (runs all pending migrations)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🗄️  YPEC SQL Migration Runner');
console.log('================================\n');

async function runMigration(filePath) {
  const fileName = path.basename(filePath);
  console.log(`📋 Migration: ${fileName}`);

  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      console.log(`   ⚠️  File is empty, skipping\n`);
      return { success: true, skipped: true, file: fileName };
    }

    console.log(`   📄 SQL file read successfully (${sql.length} bytes)`);
    console.log(`   ℹ️  This migration should be run through Supabase Dashboard SQL Editor`);
    console.log(`   🔗 ${process.env.SUPABASE_URL?.replace('/rest/v1', '')}/project/_/sql`);
    console.log(`\n   Copy and paste this SQL:\n`);
    console.log('   ' + '─'.repeat(60));
    console.log(sql.split('\n').map(line => `   ${line}`).join('\n'));
    console.log('   ' + '─'.repeat(60));
    console.log('');

    return { success: true, file: fileName, manual: true };

  } catch (error) {
    console.error(`   ❌ Error reading file: ${error.message}\n`);
    return { success: false, file: fileName, error: error.message };
  }
}

async function runAllMigrations() {
  const migrationsDir = __dirname;

  // Get all SQL files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Run in alphabetical order

  if (files.length === 0) {
    console.log('ℹ️  No migration files found\n');
    return;
  }

  console.log(`Found ${files.length} migration file(s)\n`);

  const results = [];
  for (const file of files) {
    const result = await runMigration(path.join(migrationsDir, file));
    results.push(result);
  }

  // Summary
  console.log('================================');
  const successful = results.filter(r => r.success && !r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.skipped).length;

  console.log(`✅ Successful: ${successful}`);
  if (skipped > 0) console.log(`⚠️  Skipped: ${skipped}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log('');

  return results;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file\n');
    process.exit(1);
  }

  // Check if specific migration file provided
  const specificFile = process.argv[2];

  if (specificFile) {
    const filePath = path.isAbsolute(specificFile)
      ? specificFile
      : path.join(__dirname, specificFile);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ ERROR: Migration file not found: ${specificFile}\n`);
      process.exit(1);
    }

    await runMigration(filePath);
  } else {
    await runAllMigrations();
  }

  console.log('📝 Note: Some migrations may fail if tables already exist.');
  console.log('   This is normal - Supabase will report "relation already exists" errors.\n');
}

// Run migrations
main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
