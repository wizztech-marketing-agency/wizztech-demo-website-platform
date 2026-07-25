const https = require('https');

const projectRef = 'hciolzairdpnouccywai';
const anonKey = 'sb_publishable_1e4hqxq9y_wWb9VvUNyiAA_JVkTgG_k';

// Test: What does the existing demo_links RLS look like?
// Try reading from pg_policies using the REST API
const options = {
  hostname: projectRef + '.supabase.co',
  path: '/rest/v1/rpc/check_demo_links_policies',
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
