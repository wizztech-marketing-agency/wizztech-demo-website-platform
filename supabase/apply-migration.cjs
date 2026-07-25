/**
 * apply-migration.js
 * 
 * Applies the fix-migration.sql to Supabase using the service role key.
 * Run with: node supabase/apply-migration.js
 * 
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 * If you only have the anon key, run the SQL manually in Supabase SQL Editor.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('No .env file found at', envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('');
  console.error('👉 Please run the SQL from supabase/fix-migration.sql manually in your');
  console.error('   Supabase dashboard → SQL Editor: https://supabase.com/dashboard');
  console.error('');
  console.error('The SQL to run:');
  console.error('─────────────────────────────────────────');
  const sql = fs.readFileSync(path.join(__dirname, 'fix-migration.sql'), 'utf8');
  console.error(sql);
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, 'fix-migration.sql'), 'utf8');
const urlObj = new URL(SUPABASE_URL);
const projectRef = urlObj.hostname.split('.')[0];
const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

console.log('🔄 Applying migration to Supabase project:', projectRef);

const body = JSON.stringify({ query: sql });
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY
  }
};

const req = https.request(apiUrl, options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
    } else {
      console.error('❌ Migration failed. Status:', res.statusCode);
      console.error('Response:', data);
      console.error('');
      console.error('👉 Please run the SQL from supabase/fix-migration.sql manually in your');
      console.error('   Supabase dashboard → SQL Editor: https://supabase.com/dashboard');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.error('👉 Please run the SQL from supabase/fix-migration.sql manually.');
});

req.write(body);
req.end();
