/**
 * Simulates the full validate flow end-to-end:
 * 1. Queries the websites table
 * 2. Tries to match a website
 * 3. Checks protection status
 * 4. Does demo_links lookup with a test token
 */
const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'hciolzairdpnouccywai.supabase.co';
const ANON_KEY = 'sb_publishable_1e4hqxq9y_wWb9VvUNyiAA_JVkTgG_k';

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path,
      method,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function normalizeHost(urlStr) {
  if (!urlStr) return '';
  let cleaned = urlStr.trim().toLowerCase();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

async function simulateValidate(websiteUrl, demoToken) {
  console.log('\n=== SIMULATING VALIDATE FUNCTION ===');
  console.log('websiteUrl:', websiteUrl);
  console.log('demoToken:', demoToken);
  
  const requestHost = normalizeHost(websiteUrl);
  console.log('requestHost (normalized):', requestHost);

  // Step 1: Query websites
  const websitesRes = await request('/rest/v1/websites?select=*', 'GET');
  console.log('\n[Step 2] Websites query status:', websitesRes.status);
  const websites = JSON.parse(websitesRes.body);
  console.log('[Step 2] Websites count:', websites.length);
  
  if (websites.length === 0) {
    console.log('[Step 2] No websites in database → would return "allowed" (unregistered)');
    return;
  }

  websites.forEach((w, i) => {
    const dbHost = normalizeHost(w.url);
    const matches = dbHost === requestHost || requestHost.endsWith('.' + dbHost) || dbHost.endsWith('.' + requestHost);
    console.log(`  [${i}] name='${w.name}' url='${w.url}' dbHost='${dbHost}' match=${matches} protected=${w.is_protected}`);
  });

  const matchedWebsite = websites.find(w => {
    if (!w.url) return false;
    if (w.url.trim().toLowerCase() === websiteUrl.trim().toLowerCase()) return true;
    const dbHost = normalizeHost(w.url);
    return dbHost === requestHost || requestHost.endsWith('.' + dbHost) || dbHost.endsWith('.' + requestHost);
  });

  if (!matchedWebsite) {
    console.log('[Step 2] No match → "allowed" (not registered)');
    return;
  }

  console.log('[Step 2] Matched:', matchedWebsite.name, '| protected:', matchedWebsite.is_protected);

  if (!matchedWebsite.is_protected) {
    console.log('[Step 3] Protection OFF → "allowed"');
    return;
  }

  if (!demoToken) {
    console.log('[Step 5] No token → "blocked"');
    return;
  }

  const cleanToken = demoToken.trim();
  const tokenHash = hashToken(cleanToken);
  console.log('[Step 6] cleanToken:', cleanToken);
  console.log('[Step 6] tokenHash (first 20):', tokenHash.substring(0, 20) + '...');

  // Try .in() query
  const tokensParam = encodeURIComponent(`(${tokenHash},${cleanToken})`);
  const demoLinksRes = await request(
    `/rest/v1/demo_links?select=*&website_id=eq.${matchedWebsite.id}&token=in.${tokensParam}`,
    'GET'
  );
  console.log('[Step 6] demo_links query status:', demoLinksRes.status);
  console.log('[Step 6] demo_links response:', demoLinksRes.body.substring(0, 300));
  
  const demoLinks = JSON.parse(demoLinksRes.body);
  if (Array.isArray(demoLinks) && demoLinks.length > 0) {
    const link = demoLinks[0];
    const now = new Date();
    const expiry = new Date(link.expiry_at);
    const isExpired = expiry <= now;
    console.log('[Step 7] Link found! id:', link.id, '| expired:', isExpired);
    if (isExpired) {
      console.log('→ Result: demo_expired');
    } else {
      console.log('→ Result: ALLOWED ✅');
    }
  } else {
    console.log('[Step 6] No matching demo link → "invalid_token"');
  }
}

async function main() {
  console.log('=== WizzTech Validate Simulation ===\n');

  // First check what's in the database
  const websitesRes = await request('/rest/v1/websites?select=id,name,url,is_protected', 'GET');
  const websites = JSON.parse(websitesRes.body);
  console.log('Websites in database:', websites.length);
  websites.forEach((w, i) => console.log(`  [${i}] ${w.name} | ${w.url} | protected: ${w.is_protected}`));

  const demoLinksRes = await request('/rest/v1/demo_links?select=id,website_id,token,expiry_at', 'GET');
  const demoLinks = JSON.parse(demoLinksRes.body);
  console.log('\nDemo links in database:', demoLinks.length);
  demoLinks.forEach((dl, i) => {
    const isExpired = new Date(dl.expiry_at) <= new Date();
    console.log(`  [${i}] token=${dl.token.substring(0, 20)}... | expiry=${dl.expiry_at} | expired=${isExpired}`);
  });

  if (websites.length > 0) {
    const site = websites[0];
    console.log('\n--- Simulating: registered site, protection ON, no token ---');
    await simulateValidate(site.url, null);

    if (demoLinks.length > 0) {
      const link = demoLinks[0];
      console.log('\n--- Simulating: registered site, valid token (raw) ---');
      await simulateValidate(site.url, link.token);
      
      const fakeHash = hashToken(link.token);
      console.log('\n--- Simulating: registered site, token hash (as if generated by generate-demo-link) ---');
      await simulateValidate(site.url, fakeHash);
    }
  }
}

main().catch(console.error);
