/**
 * Direct test of validation API using HTTP request
 * Tests the validate endpoint with a real token
 * 
 * Usage: node supabase/test-validate.cjs <token>
 */
const https = require('https');

const SUPABASE_URL = 'https://hciolzairdpnouccywai.supabase.co';
const ANON_KEY = 'sb_publishable_1e4hqxq9y_wWb9VvUNyiAA_JVkTgG_k';

// Test 1: Check if we can query demo_links with anon key
function checkDemoLinks() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hciolzairdpnouccywai.supabase.co',
      path: '/rest/v1/demo_links?select=id,website_id,token,expiry_at&limit=5',
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Test 2: Check websites table  
function checkWebsites() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hciolzairdpnouccywai.supabase.co',
      path: '/rest/v1/websites?select=id,name,url,is_protected&limit=5',
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Test 3: Try to INSERT into demo_links with anon key (expected to fail without new policy)
function testInsertAnonKey(websiteId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify([{
      website_id: websiteId,
      token: 'test_token_hash_' + Date.now(),
      expiry_at: new Date(Date.now() + 3600000).toISOString()
    }]);

    const options = {
      hostname: 'hciolzairdpnouccywai.supabase.co',
      path: '/rest/v1/demo_links',
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== WizzTech Database Diagnostic ===\n');

  console.log('--- Test 1: Read websites table ---');
  const websitesResult = await checkWebsites();
  console.log('Status:', websitesResult.status);
  const websites = JSON.parse(websitesResult.body);
  if (Array.isArray(websites) && websites.length > 0) {
    console.log('Websites found:', websites.length);
    websites.forEach((w, i) => {
      console.log(`  [${i}] id=${w.id} | name=${w.name} | url=${w.url} | protected=${w.is_protected}`);
    });
  } else {
    console.log('No websites found or error:', websitesResult.body.substring(0, 200));
  }

  console.log('\n--- Test 2: Read demo_links table ---');
  const demoLinksResult = await checkDemoLinks();
  console.log('Status:', demoLinksResult.status);
  const demoLinks = JSON.parse(demoLinksResult.body);
  if (Array.isArray(demoLinks) && demoLinks.length > 0) {
    console.log('Demo links found:', demoLinks.length);
    demoLinks.forEach((dl, i) => {
      console.log(`  [${i}] id=${dl.id} | website_id=${dl.website_id} | token=${dl.token.substring(0, 20)}... | expiry=${dl.expiry_at}`);
    });
  } else {
    console.log('No demo links found:', demoLinksResult.body.substring(0, 200));
  }

  // Test 3: Try insert
  if (Array.isArray(websites) && websites.length > 0) {
    const firstWebsite = websites[0];
    console.log(`\n--- Test 3: Try INSERT into demo_links with anon key (websiteId=${firstWebsite.id}) ---`);
    const insertResult = await testInsertAnonKey(firstWebsite.id);
    console.log('Status:', insertResult.status);
    if (insertResult.status === 201) {
      console.log('✅ INSERT SUCCEEDED! The anon INSERT policy is already in place.');
    } else {
      console.log('❌ INSERT FAILED (expected). Status:', insertResult.status);
      console.log('Response:', insertResult.body.substring(0, 300));
      console.log('\n⚠️  To fix this, run supabase/fix-migration.sql in your Supabase SQL Editor.');
      console.log('   URL: https://supabase.com/dashboard/project/hciolzairdpnouccywai/editor');
    }
  }
}

main().catch(console.error);
