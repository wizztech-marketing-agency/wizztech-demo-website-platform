import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(statusCode: number, data: Record<string, any>) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

// Generate random secure token string (7-8 chars alphanumeric)
function generateRandomToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

// SHA-256 Token Hasher
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Construct demo URL
function buildDemoUrl(siteUrl: string, token: string): string {
  const cleanUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const isFile = /\.[a-zA-Z0-9]+$/.test(cleanUrl.split('/').pop() || '');
  if (isFile) {
    return `${cleanUrl}?wz_token=${token}`;
  }
  return `${cleanUrl}/demo/${token}`;
}

// Expiry parser in seconds
function parseExpirySeconds(expiry: string | number): number {
  if (typeof expiry === 'number') return expiry;
  const str = String(expiry).trim().toLowerCase();
  if (str === '30m') return 1800;
  if (str === '1h') return 3600;
  if (str === '6h') return 21600;
  if (str === '12h') return 43200;
  if (str === '24h' || str === '1d') return 86400;
  if (str === '3d') return 259200;
  if (str === '7d') return 604800;
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 1800 : parsed;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      status: 'error',
      message: 'Method Not Allowed. Use POST.'
    });
  }

  console.log('[Generate Demo Link API] Request received');

  let body: { websiteId?: string; expiry?: string | number } = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('[Generate Demo Link API] Failed to parse request body:', err);
    return jsonResponse(400, {
      status: 'error',
      message: 'Invalid JSON payload'
    });
  }

  const { websiteId, expiry = '30m' } = body;

  if (!websiteId) {
    return jsonResponse(400, {
      status: 'error',
      message: 'Missing websiteId parameter'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Generate Demo Link API] Database credentials missing');
    return jsonResponse(500, {
      status: 'error',
      message: 'Server configuration error'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch website from Supabase
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    console.error('[Generate Demo Link API] Website not found for ID:', websiteId);
    return jsonResponse(404, {
      status: 'error',
      message: 'Registered website not found'
    });
  }

  // 2. Generate raw token & SHA-256 hash
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  // 3. Calculate expiry timestamp
  const seconds = parseExpirySeconds(expiry);
  const expiryDate = new Date(Date.now() + seconds * 1000);

  // 4. Save hashed token into Supabase demo_links
  const { error: insertError } = await supabase
    .from('demo_links')
    .insert([
      {
        website_id: website.id,
        token: tokenHash,
        expiry_at: expiryDate.toISOString()
      }
    ]);

  if (insertError) {
    console.error('[Generate Demo Link API] Error inserting demo link:', insertError);
    return jsonResponse(500, {
      status: 'error',
      message: 'Failed to create demo link record'
    });
  }

  const demoUrl = buildDemoUrl(website.url, rawToken);
  console.log(`[Generate Demo Link API] Created secure demo link for website ${website.name} (Expires: ${expiryDate.toISOString()})`);

  return jsonResponse(200, {
    status: 'success',
    demoUrl,
    rawToken,
    expiresAt: expiryDate.toISOString()
  });
};
