import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually using process.cwd()
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Inspecting messages table columns...');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  } else {
    console.log('Sample message keys:', messages && messages[0] ? Object.keys(messages[0]) : 'No records found (table exists)');
  }

  console.log('Inspecting scheduled_reminders table columns...');
  const { data: reminders, error: remindersError } = await supabase
    .from('scheduled_reminders')
    .select('*')
    .limit(1);

  if (remindersError) {
    console.error('Error fetching reminders:', remindersError);
  } else {
    console.log('Sample reminder keys:', reminders && reminders[0] ? Object.keys(reminders[0]) : 'No records found (table exists)');
  }
}

main().catch(console.error);
