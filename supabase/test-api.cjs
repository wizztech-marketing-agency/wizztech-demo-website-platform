/**
 * Test the validate API endpoint directly
 * Run with: node supabase/test-api.cjs
 */
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 8888;

function callApi(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function test(label, fn) {
  console.log('\n' + '─'.repeat(60));
  console.log('TEST:', label);
  console.log('─'.repeat(60));
  try {
    const result = await fn();
    console.log('✓ Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    console.error('✗ Error:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== WizzTech API E2E Test ===');
  console.log('Target:', `http://${BASE_URL}:${PORT}`);

  // Test 1: Validate with no website registered (should return "allowed")
  await test('Validate - unknown URL (not registered)', async () => {
    const res = await callApi('/.netlify/functions/validate', 'POST', {
      websiteUrl: 'https://unknown-test-site.com'
    });
    console.log('Expected: status=allowed');
    console.log('Actual:', res.body?.status);
    console.assert(res.body?.status === 'allowed', 'Should return "allowed" for unregistered site');
    return res.body;
  });

  // Test 2: OPTIONS preflight
  await test('Validate - OPTIONS preflight (CORS)', async () => {
    const res = await callApi('/.netlify/functions/validate', 'OPTIONS', null);
    console.log('Expected: HTTP 200');
    console.assert(res.status === 200, 'OPTIONS should return 200');
    return { status: res.status };
  });

  // Test 3: Validate with empty body
  await test('Validate - empty body (missing websiteUrl)', async () => {
    const res = await callApi('/.netlify/functions/validate', 'POST', {});
    console.log('Expected: status=400 or status=not_found');
    return res.body;
  });

  console.log('\n\n=== NOTE: Database is empty (no websites registered) ===');
  console.log('To test scenarios 3-9, register a website via the dashboard at:');
  console.log('  http://localhost:8888/dashboard/websites');
  console.log('\nAfter registering a website, re-run this test with the website URL as an argument:');
  console.log('  node supabase/test-api.cjs https://yoursite.com');
}

main().catch(console.error);
