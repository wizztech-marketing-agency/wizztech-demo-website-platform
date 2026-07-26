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

async function main() {
  console.log('--- WEBSITES ---');
  const { data: websites, error: wErr } = await supabase.from('websites').select('*');
  console.log('Websites error:', wErr);
  console.log('Websites:', JSON.stringify(websites, null, 2));

  console.log('\n--- DEMO LINKS ---');
  const { data: demoLinks, error: dErr } = await supabase.from('demo_links').select('*');
  console.log('Demo links error:', dErr);
  console.log('Demo links:', JSON.stringify(demoLinks, null, 2));
}

main();
