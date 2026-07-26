const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testPatch() {
  const linkId = "55d30d33-cef2-4b1f-a4df-f30587521822";
  console.log('Attempting to update views_count for link:', linkId);

  // 1. Test direct update via Supabase JS client
  const { data, error } = await supabase
    .from('demo_links')
    .update({ views_count: 1 })
    .eq('id', linkId)
    .select();

  console.log('Update result data:', data);
  console.log('Update result error:', error);
}

testPatch();
