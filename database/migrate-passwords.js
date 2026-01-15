#!/usr/bin/env node
/**
 * PASSWORD MIGRATION SCRIPT
 * Converts all plain text passwords to bcrypt hashes
 *
 * IMPORTANT: Run this ONCE before deploying the security updates
 * This will hash all existing passwords in the database
 *
 * Usage: node database/migrate-passwords.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔐 Password Migration Script');
console.log('================================\n');

async function migrateStaffPasswords() {
  console.log('📋 Migrating staff passwords...');

  try {
    // Get all staff with password_hash
    const { data: staff, error } = await supabase
      .from('ypec_staff')
      .select('id, email, password_hash')
      .not('password_hash', 'is', null);

    if (error) throw error;

    if (!staff || staff.length === 0) {
      console.log('   ℹ️  No staff passwords to migrate\n');
      return;
    }

    console.log(`   Found ${staff.length} staff accounts`);

    for (const member of staff) {
      // Check if already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (member.password_hash.match(/^\$2[aby]\$/)) {
        console.log(`   ✓ ${member.email} - already hashed`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(member.password_hash, SALT_ROUNDS);

      // Update in database
      const { error: updateError } = await supabase
        .from('ypec_staff')
        .update({ password_hash: hashedPassword })
        .eq('id', member.id);

      if (updateError) {
        console.log(`   ✗ ${member.email} - ERROR: ${updateError.message}`);
      } else {
        console.log(`   ✓ ${member.email} - hashed successfully`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('   ✗ Error migrating staff passwords:', error.message);
  }
}

async function migrateClientPasswords() {
  console.log('📋 Migrating client passwords...');

  try {
    // Get all households with password_hash
    const { data: households, error } = await supabase
      .from('ypec_households')
      .select('id, email, password_hash')
      .not('password_hash', 'is', null);

    if (error) throw error;

    if (!households || households.length === 0) {
      console.log('   ℹ️  No client passwords to migrate\n');
      return;
    }

    console.log(`   Found ${households.length} client accounts`);

    for (const household of households) {
      // Check if already hashed
      if (household.password_hash.match(/^\$2[aby]\$/)) {
        console.log(`   ✓ ${household.email} - already hashed`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(household.password_hash, SALT_ROUNDS);

      // Update in database
      const { error: updateError } = await supabase
        .from('ypec_households')
        .update({ password_hash: hashedPassword })
        .eq('id', household.id);

      if (updateError) {
        console.log(`   ✗ ${household.email} - ERROR: ${updateError.message}`);
      } else {
        console.log(`   ✓ ${household.email} - hashed successfully`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('   ✗ Error migrating client passwords:', error.message);
  }
}

async function migrateChefPasswords() {
  console.log('📋 Migrating chef passwords...');

  try {
    // Get all chefs with password_hash
    const { data: chefs, error } = await supabase
      .from('ypec_chefs')
      .select('id, email, password_hash')
      .not('password_hash', 'is', null);

    if (error) throw error;

    if (!chefs || chefs.length === 0) {
      console.log('   ℹ️  No chef passwords to migrate\n');
      return;
    }

    console.log(`   Found ${chefs.length} chef accounts`);

    for (const chef of chefs) {
      // Check if already hashed
      if (chef.password_hash.match(/^\$2[aby]\$/)) {
        console.log(`   ✓ ${chef.email} - already hashed`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(chef.password_hash, SALT_ROUNDS);

      // Update in database
      const { error: updateError } = await supabase
        .from('ypec_chefs')
        .update({ password_hash: hashedPassword })
        .eq('id', chef.id);

      if (updateError) {
        console.log(`   ✗ ${chef.email} - ERROR: ${updateError.message}`);
      } else {
        console.log(`   ✓ ${chef.email} - hashed successfully`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('   ✗ Error migrating chef passwords:', error.message);
  }
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file\n');
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will hash all plain text passwords in the database.');
  console.log('   Make sure you have a backup before proceeding!\n');

  // Migrate all password tables
  await migrateStaffPasswords();
  await migrateClientPasswords();
  await migrateChefPasswords();

  console.log('================================');
  console.log('✅ Password migration complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Verify all accounts can still login');
  console.log('   2. Deploy the updated code with bcrypt authentication');
  console.log('   3. Test login on all portals (admin, client, chef)\n');
}

// Run migration
main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
