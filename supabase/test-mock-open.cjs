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

// Simulate exact callSupabaseDirectValidation function from wizztech-protect.js
async function simulateDirectValidation(websiteUrl, demoToken) {
  console.log(`\n[Simulating Visitor Load] websiteUrl='${websiteUrl}' demoToken='${demoToken}'`);
  
  // 1. Fetch websites
  const resWebsites = await fetch(`${supabaseUrl}/rest/v1/websites?select=*`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  const websites = await resWebsites.json();
  const matched = websites.find(w => w.url.trim().toLowerCase() === websiteUrl.trim().toLowerCase());
  
  if (!matched) {
    console.log('Result: Website not registered');
    return;
  }
  
  console.log(`Matched website ID: ${matched.id} (${matched.name})`);

  // 2. Fetch demo links
  const resLinks = await fetch(`${supabaseUrl}/rest/v1/demo_links?website_id=eq.${matched.id}&select=*`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  const demoLinks = await resLinks.json();
  
  const activeLink = demoLinks.find(l => l.token === demoToken || l.id === demoToken);
  if (!activeLink) {
    console.log('Result: Active link not found');
    return;
  }

  console.log(`Active link found! Current views_count=${activeLink.views_count}`);

  // 3. Increment views_count via PATCH
  const newCount = (activeLink.views_count || 0) + 1;
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/demo_links?id=eq.${activeLink.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ views_count: newCount })
  });

  console.log(`PATCH response status: ${patchRes.status}`);
  console.log(`Successfully updated views_count to: ${newCount}`);
}

async function run() {
  await simulateDirectValidation('https://fleurwebsite.netlify.app/', 'FKvqDa5');
  await simulateDirectValidation('https://fleurwebsite.netlify.app/', 'FKvqDa5');
}

run();
