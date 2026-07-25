const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'hciolzairdpnouccywai.supabase.co';
const ANON_KEY = 'sb_publishable_1e4hqxq9y_wWb9VvUNyiAA_JVkTgG_k';

function hashToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

function request(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testTokenLookup(websiteId, rawToken) {
  const tokenHash = hashToken(rawToken);
  console.log('Testing rawToken:', rawToken);
  console.log('Testing tokenHash:', tokenHash);

  // 1. Direct eq search for rawToken
  const path1 = `/rest/v1/demo_links?website_id=eq.${websiteId}&token=eq.${rawToken}`;
  // 2. Direct eq search for tokenHash
  const path2 = `/rest/v1/demo_links?website_id=eq.${websiteId}&token=eq.${tokenHash}`;
  // 3. .in() search for both
  const tokensParam = encodeURIComponent(`("${tokenHash}","${rawToken}")`);
  const path3 = `/rest/v1/demo_links?website_id=eq.${websiteId}&token=in.${tokensParam}`;

  const res1 = await request(path1);
  console.log(`eq raw status: ${res1.status}, count: ${Array.isArray(res1.data) ? res1.data.length : 'error'}`);

  const res2 = await request(path2);
  console.log(`eq hash status: ${res2.status}, count: ${Array.isArray(res2.data) ? res2.data.length : 'error'}`);

  const res3 = await request(path3);
  console.log(`in both status: ${res3.status}, count: ${Array.isArray(res3.data) ? res3.data.length : 'error'}`);
  if (Array.isArray(res3.data)) {
    console.log('in both response:', JSON.stringify(res3.data));
  }
}

async function main() {
  const websiteId = 'e2c229a5-d8be-494f-a512-4f72fae1c606';
  await testTokenLookup(websiteId, 'ZH80UFr');
}

main().catch(console.error);
