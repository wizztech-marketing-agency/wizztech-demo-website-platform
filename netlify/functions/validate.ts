import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Centralized CORS configuration
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-wizztech-sdk-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Response helper ensuring consistent JSON structure
function jsonResponse(statusCode: number, data: Record<string, any>) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

// Normalize URLs to extract comparable hostnames
function normalizeHost(urlStr: string): string {
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

// SHA-256 Token Hasher
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Always handle OPTIONS preflight request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Ensure request method is POST
  if (event.httpMethod !== 'POST') {
    console.warn(`[Validate API] Rejected ${event.httpMethod} request (Only POST allowed)`);
    return jsonResponse(405, {
      status: 'error',
      message: 'Method Not Allowed. Use POST.',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  console.log('[Validate API] Step 1: Validation Request Received');

  // STEP 1: SDK Authentication Header Verification
  const sdkKeyHeader = event.headers['x-wizztech-sdk-key'] || event.headers['X-WizzTech-SDK-Key'];
  const configuredSdkKey = process.env.WIZZTECH_SDK_KEY || process.env.VITE_WIZZTECH_SDK_KEY;

  if (configuredSdkKey) {
    if (!sdkKeyHeader || sdkKeyHeader !== configuredSdkKey) {
      console.warn('[Validate API] Step 1 Failed: Invalid or missing x-wizztech-sdk-key header');
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'invalid_sdk_key',
        message: 'Invalid or missing SDK API key header',
        website: null,
        expiresAt: null,
        protectionEnabled: true
      });
    }
    console.log('[Validate API] Step 1 Passed: SDK Key Valid');
  } else {
    console.log('[Validate API] Step 1 Passed: SDK Key check passed (Key not enforced yet)');
  }

  let body: { websiteUrl?: string; origin?: string; demoToken?: string } = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('[Validate API] Failed to parse JSON request body:', err);
    return jsonResponse(400, {
      status: 'error',
      message: 'Invalid JSON payload',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const { websiteUrl, origin: bodyOrigin, demoToken } = body;

  if (!websiteUrl) {
    console.warn('[Validate API] Missing websiteUrl parameter');
    return jsonResponse(400, {
      status: 'not_found',
      message: 'Missing websiteUrl parameter',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  // Retrieve Supabase environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Validate API] Supabase environment variables missing');
    return jsonResponse(500, {
      status: 'error',
      message: 'Server configuration error: missing database credentials',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // STEP 2: Website Location in Supabase
  const requestHost = normalizeHost(websiteUrl);
  console.log(`[Validate API] Step 2: Looking up website for URL '${websiteUrl}' (Host: '${requestHost}')`);

  const { data: websites, error: websiteError } = await supabase
    .from('websites')
    .select('*');

  if (websiteError) {
    console.error('[Validate API] Database error querying websites:', websiteError);
    return jsonResponse(500, {
      status: 'error',
      message: 'Database query failed',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const matchedWebsite = (websites || []).find((w) => {
    if (!w.url) return false;
    if (w.url.trim().toLowerCase() === websiteUrl.trim().toLowerCase()) return true;
    const dbHost = normalizeHost(w.url);
    return dbHost === requestHost || requestHost.endsWith('.' + dbHost) || dbHost.endsWith('.' + requestHost);
  });

  if (!matchedWebsite) {
    console.log(`[Validate API] Website Located: FALSE (Website Not Found: ${websiteUrl})`);
    return jsonResponse(200, {
      status: 'not_found',
      message: 'Website is not registered in WizzTech Platform',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  console.log(`[Validate API] Website Located: SUCCESS (ID: ${matchedWebsite.id}, Name: '${matchedWebsite.name}', Protected: ${matchedWebsite.is_protected})`);

  // STEP 3: Origin Verification
  const requestOrigin = bodyOrigin || event.headers['origin'] || event.headers['referer'] || '';
  if (requestOrigin) {
    const originHost = normalizeHost(requestOrigin);
    const registeredHost = normalizeHost(matchedWebsite.url);

    if (originHost && registeredHost && originHost !== registeredHost && !originHost.endsWith('.' + registeredHost) && !registeredHost.endsWith('.' + originHost)) {
      console.warn(`[Validate API] Step 3 Failed: Origin Mismatch! Incoming origin '${originHost}' does not match registered domain '${registeredHost}'`);
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'origin_mismatch',
        message: `Request origin '${originHost}' does not match registered website URL '${registeredHost}'`,
        website: matchedWebsite.url,
        expiresAt: null,
        protectionEnabled: matchedWebsite.is_protected
      });
    }
    console.log(`[Validate API] Step 3 Passed: Origin Verified ('${originHost}' matches '${registeredHost}')`);
  } else {
    console.log('[Validate API] Step 3 Passed: Origin check skipped (No origin header or body parameter provided)');
  }

  // STEP 4: Protection Status Check
  if (!matchedWebsite.is_protected) {
    console.log(`[Validate API] Step 4: Protection Disabled for ${matchedWebsite.url} -> Returning Allowed`);
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Protection is disabled for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  console.log(`[Validate API] Step 4: Protection Enabled for ${matchedWebsite.url}`);

  // STEP 5: Demo Token Validation
  if (!demoToken || typeof demoToken !== 'string' || !demoToken.trim()) {
    console.log(`[Validate API] Step 5 Failed: No Demo Token provided for ${matchedWebsite.url} -> Returning Blocked`);
    return jsonResponse(200, {
      status: 'blocked',
      reason: 'protected',
      message: 'Website is protected and requires a valid demo token',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  const cleanToken = demoToken.trim();
  const tokenHash = hashToken(cleanToken);
  console.log(`[Validate API] Step 5: Validating Demo Token (SHA-256 Hash: ${tokenHash.slice(0, 10)}...) for website ID ${matchedWebsite.id}`);

  // Search Supabase for hashed token (and fallback to raw token for backwards compatibility)
  const { data: demoLinks, error: tokenError } = await supabase
    .from('demo_links')
    .select('*')
    .eq('website_id', matchedWebsite.id)
    .or(`token.eq.${tokenHash},token.eq.${cleanToken}`);

  if (tokenError) {
    console.error('[Validate API] Database error querying demo_links:', tokenError);
    return jsonResponse(500, {
      status: 'error',
      message: 'Database query error during token validation',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  const activeLink = demoLinks && demoLinks.length > 0 ? demoLinks[0] : null;

  if (!activeLink) {
    console.log(`[Validate API] Step 5 Result: Demo Token is Invalid for website ${matchedWebsite.url} -> Returning invalid_token`);
    return jsonResponse(200, {
      status: 'invalid_token',
      message: 'Demo token is invalid for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  // Check token expiration
  const now = new Date();
  const expiryDate = new Date(activeLink.expiry_at);

  if (expiryDate > now) {
    console.log(`[Validate API] Step 5 Result: Demo Token Valid (Expires: ${activeLink.expiry_at}) -> Returning Allowed`);
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Valid demo token',
      website: matchedWebsite.url,
      expiresAt: activeLink.expiry_at,
      protectionEnabled: true
    });
  } else {
    console.log(`[Validate API] Step 5 Result: Demo Token Expired on ${activeLink.expiry_at} -> Returning demo_expired`);
    return jsonResponse(200, {
      status: 'demo_expired',
      message: 'Demo token has expired',
      website: matchedWebsite.url,
      expiresAt: activeLink.expiry_at,
      protectionEnabled: true
    });
  }
};
