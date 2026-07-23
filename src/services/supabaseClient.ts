import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if the current configuration uses placeholder values
export const isMockMode =
  !supabaseUrl ||
  supabaseUrl.includes('YOUR_PROJECT_ID') ||
  supabaseUrl.includes('placeholder') ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes('placeholder') ||
  supabaseAnonKey.includes('your-anon-key');

if (isMockMode) {
  console.warn(
    'WizzTech Demo Protection Platform is running in [Sandbox Mock Mode]. ' +
    'To connect to a live Supabase project, update the environment variables in your .env file.'
  );
}

// Instantiate the Supabase client. If in Mock Mode, we use dummy URLs to prevent startup crashes.
export const supabase = createClient(
  isMockMode ? 'https://mock.supabase.co' : supabaseUrl,
  isMockMode ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key' : supabaseAnonKey
);
