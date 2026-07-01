import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      let value = parts.slice(1).join('=').trim();
      if (key && value) {
        // Strip surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\x1b[31mError: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local\x1b[0m');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const DEFAULT_NEW_PASSWORD = 'Password123!';

async function run() {
  const args = process.argv.slice(2);
  const targetEmail = args[0]?.trim();

  console.log('\x1b[34m%s\x1b[0m', '=== Concord Auth Bypass & Lockout Reset Tool ===');

  if (!targetEmail) {
    console.log('\n\x1b[33mNo email address provided. Listing all locked out accounts...\x1b[0m');
    const { data: lockedProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, login_attempts, login_lockouts, login_locked_until')
      .gt('login_locked_until', new Date().toISOString());

    if (fetchError) {
      console.error('\x1b[31mError fetching locked profiles:\x1b[0m', fetchError.message);
      console.log('Usage: node scripts/bypass-lockout.mjs <email>');
      process.exit(1);
    }

    if (!lockedProfiles || lockedProfiles.length === 0) {
      console.log('\x1b[32mNo accounts are currently in a lockout timeout.\x1b[0m');
      console.log('\nUsage: node scripts/bypass-lockout.mjs <email>');
      process.exit(0);
    }

    console.log('\nCurrently Locked Accounts:');
    lockedProfiles.forEach(p => {
      console.log(`- Email: \x1b[33m${p.email}\x1b[0m`);
      console.log(`  Lockout duration iteration: ${p.login_lockouts}`);
      console.log(`  Locked until: ${new Date(p.login_locked_until).toLocaleString()}`);
    });
    console.log('\nTo unlock one of these accounts, run:');
    console.log('\x1b[36mnode scripts/bypass-lockout.mjs <email>\x1b[0m');
    process.exit(0);
  }

  console.log(`\nAttempting to bypass lockout for email: \x1b[33m${targetEmail}\x1b[0m...`);

  // 1. Fetch user ID from auth.users (via admin API) or from profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, login_lockouts, login_locked_until')
    .eq('email', targetEmail)
    .maybeSingle();

  if (profileError) {
    console.error('\x1b[31mError querying profile:\x1b[0m', profileError.message);
    process.exit(1);
  }

  let userId = '';
  if (profiles) {
    userId = profiles.id;
  } else {
    // Fallback: look up in auth.users by email using admin API
    console.log('Profile record not matched. Querying auth users list...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('\x1b[31mError fetching auth users:\x1b[0m', listError.message);
      process.exit(1);
    }
    const match = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!match) {
      console.error(`\x1b[31mError: No user account found with email "${targetEmail}"\x1b[0m`);
      process.exit(1);
    }
    userId = match.id;
  }

  console.log(`User found! ID: \x1b[36m${userId}\x1b[0m`);

  // 2. Reset the lockout and attempt counters in public.profiles table
  console.log('Resetting attempts, lockouts, and timeout timers in profiles...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      login_attempts: 0,
      login_lockouts: 0,
      login_locked_until: null
    })
    .eq('id', userId);

  if (updateError) {
    console.error('\x1b[31mWarning: Failed to update profile lockout columns:\x1b[0m', updateError.message);
    console.log('Creating/updating profile record if it did not exist...');
    
    // Attempt insert/upsert if missing
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: targetEmail,
        login_attempts: 0,
        login_lockouts: 0,
        login_locked_until: null
      });
      
    if (upsertError) {
      console.error('\x1b[31mError resetting database profile counters:\x1b[0m', upsertError.message);
      process.exit(1);
    }
  }

  // 3. Reset password in Supabase Auth to default: 'Password123!'
  console.log(`Resetting auth user password to default: '\x1b[32m${DEFAULT_NEW_PASSWORD}\x1b[0m'...`);
  const { data: userData, error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: DEFAULT_NEW_PASSWORD }
  );

  if (authError) {
    console.error('\x1b[31mError updating password in auth:\x1b[0m', authError.message);
    process.exit(1);
  }

  console.log('\n\x1b[32m✔ SUCCESS: Lockout bypassed, timer reset, and password successfully updated!\x1b[0m');
  console.log(`User: \x1b[33m${targetEmail}\x1b[0m`);
  console.log(`Password reset to: \x1b[32m${DEFAULT_NEW_PASSWORD}\x1b[0m`);
  console.log('You can now log in securely through the main login page.');
}

run().catch(err => {
  console.error('\x1b[31mUnexpected system error:\x1b[0m', err);
});
