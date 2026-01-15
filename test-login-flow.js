/**
 * Test Login Flow - Verify base64 encoding/decoding and bcrypt
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testLoginFlow() {
  try {
    console.log('='.repeat(60));
    console.log('Testing Complete Login Flow');
    console.log('='.repeat(60));

    // Step 1: Get admin from database
    console.log('\n📥 Step 1: Fetching admin from database...');
    const { data: staff, error } = await supabase
      .from('ypec_staff')
      .select('*')
      .eq('email', 'maggie@maggieforbesstrategies.com')
      .eq('role', 'admin')
      .single();

    if (error || !staff) {
      console.error('❌ Error fetching admin:', error);
      process.exit(1);
    }

    console.log('✅ Admin found:', staff.email);
    console.log('   Stored hash:', staff.password_hash);

    // Step 2: Simulate frontend base64 encoding
    console.log('\n🔐 Step 2: Simulating frontend base64 encoding...');
    const originalPassword = 'Success@2026!';
    const base64Password = Buffer.from(originalPassword).toString('base64');
    console.log('   Original password:', originalPassword);
    console.log('   Base64 encoded:', base64Password);

    // Step 3: Simulate backend base64 decoding
    console.log('\n🔓 Step 3: Simulating backend base64 decoding...');
    const decodedPassword = Buffer.from(base64Password, 'base64').toString('utf-8');
    console.log('   Decoded password:', decodedPassword);
    console.log('   Match original?', decodedPassword === originalPassword ? '✅ YES' : '❌ NO');

    // Step 4: Test bcrypt comparison
    console.log('\n🔍 Step 4: Testing bcrypt password verification...');
    const isValid = await bcrypt.compare(decodedPassword, staff.password_hash);
    console.log('   Bcrypt comparison result:', isValid ? '✅ VALID' : '❌ INVALID');

    // Step 5: Also test without encoding
    console.log('\n🔍 Step 5: Testing direct password (no base64)...');
    const isValidDirect = await bcrypt.compare(originalPassword, staff.password_hash);
    console.log('   Direct comparison result:', isValidDirect ? '✅ VALID' : '❌ INVALID');

    console.log('\n' + '='.repeat(60));
    if (isValid) {
      console.log('✅ SUCCESS: Complete login flow works correctly!');
    } else {
      console.log('❌ FAILURE: Login flow has issues');
    }
    console.log('='.repeat(60));

    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

testLoginFlow();
