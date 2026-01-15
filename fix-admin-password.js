/**
 * Fix Admin Password - Reset to Success@2026!
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixAdminPassword() {
  try {
    console.log('🔐 Generating bcrypt hash for: Success@2026!');
    const hash = await bcrypt.hash('Success@2026!', 10);
    console.log('✅ Hash generated:', hash);

    console.log('\n📝 Updating admin password in database...');
    const { data, error } = await supabase
      .from('ypec_staff')
      .update({ password_hash: hash })
      .eq('email', 'maggie@maggieforbesstrategies.com')
      .select();

    if (error) {
      console.error('❌ Error updating password:', error);
      process.exit(1);
    }

    console.log('✅ Admin password updated successfully!');
    console.log('Updated record:', data);

    // Verify the password works
    console.log('\n🔍 Verifying password...');
    const isValid = await bcrypt.compare('Success@2026!', hash);
    console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

fixAdminPassword();
