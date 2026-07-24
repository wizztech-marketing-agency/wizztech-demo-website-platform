import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Centralized CORS configuration
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 
    'Content-Type, Authorization, X-Requested-With, x-wizztech-sdk-key, x-wizztech-sdk-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

// Development flag checked logging
function devLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development' || process.env.WIZZTECH_DEV_LOGS === 'true') {
    console.log(...args);
  }
}

function devWarn(...args: any[]) {
  if (process.env.NODE_ENV === 'development' || process.env.WIZZTECH_DEV_LOGS === 'true') {
    console.warn(...args);
  }
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
    devWarn(`[Validate API] Rejected ${event.httpMethod} request (Only POST allowed)`);
    return jsonResponse(405, {
      status: 'error',
      message: 'Method Not Allowed. Use POST.',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  let body: { websiteUrl?: string; origin?: string; demoToken?: string; incrementView?: boolean } = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    devWarn('[Validate API] Failed to parse JSON request body:', err);
    return jsonResponse(400, {
      status: 'error',
      message: 'Invalid JSON payload',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const { websiteUrl, origin: bodyOrigin, demoToken, incrementView } = body;

  devLog('[Validate API] Step 1: Validation Request Received. Body:', { websiteUrl, origin: bodyOrigin, demoToken, incrementView });

  // STEP 1: SDK Authentication Header Verification
  const sdkKeyHeader = event.headers['x-wizztech-sdk-key'] || event.headers['X-WizzTech-SDK-Key'];
  const configuredSdkKey = process.env.WIZZTECH_SDK_KEY || process.env.VITE_WIZZTECH_SDK_KEY;

  if (configuredSdkKey) {
    if (!sdkKeyHeader || sdkKeyHeader !== configuredSdkKey) {
      devWarn('[Validate API] Step 1 Failed: Invalid or missing x-wizztech-sdk-key header');
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'invalid_sdk_key',
        message: 'Invalid or missing SDK API key header',
        website: null,
        expiresAt: null,
        protectionEnabled: true
      });
    }
    devLog('[Validate API] Step 1 Passed: SDK Key Valid');
  } else {
    devLog('[Validate API] Step 1 Passed: SDK Key check passed (Key not enforced yet)');
  }

  if (!websiteUrl) {
    devWarn('[Validate API] Missing websiteUrl parameter');
    return jsonResponse(400, {
      status: 'not_found',
      message: 'Missing websiteUrl parameter',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  // Retrieve Supabase environment variables - Prefer service role key for backend access
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    devWarn('[Validate API] Supabase environment variables missing');
    return jsonResponse(500, {
      status: 'error',
      message: 'Server configuration error: missing database credentials',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // STEP 2: Website Location in Supabase
  const requestHost = normalizeHost(websiteUrl);
  devLog(`[Validate API] Looking up website for URL '${websiteUrl}' (Host: '${requestHost}')`);

  const { data: websites, error: websiteError } = await supabase
    .from('websites')
    .select('*');

  if (websiteError) {
    devWarn('[Validate API] Database error querying websites:', websiteError);
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

  // Bug 1: Unregistered Websites Must NOT Be Blocked -> Return Allowed
  if (!matchedWebsite) {
    devLog(`[Validate API] Step 2: Website Found? FALSE (Website Not Found: ${websiteUrl})`);
    devLog('[Validate API] Returning Allowed (Website not registered)');
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Website is not registered in WizzTech Platform',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  devLog(`[Validate API] Step 2: Website Found? TRUE (ID: ${matchedWebsite.id}, Name: '${matchedWebsite.name}', Protected: ${matchedWebsite.is_protected})`);

  // Bug 2: Protection OFF -> Move check before origin check so unregistered origins aren't blocked when protection is OFF
  const isProtected = matchedWebsite.is_protected;
  devLog(`[Validate API] Step 3: Protection Enabled? ${isProtected ? 'TRUE' : 'FALSE'}`);

  if (!isProtected) {
    devLog(`[Validate API] Returning Allowed (Protection disabled for ${matchedWebsite.url})`);
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Protection is disabled for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  // STEP 4: Origin Verification (only enforced if website is registered and protection is ON)
  const requestOrigin = bodyOrigin || event.headers['origin'] || event.headers['referer'] || '';
  if (requestOrigin) {
    const originHost = normalizeHost(requestOrigin);
    const registeredHost = normalizeHost(matchedWebsite.url);

    if (originHost && registeredHost && originHost !== registeredHost && !originHost.endsWith('.' + registeredHost) && !registeredHost.endsWith('.' + originHost)) {
      devWarn(`[Validate API] Step 4 Failed: Origin Mismatch! Incoming origin '${originHost}' does not match registered domain '${registeredHost}'`);
      devLog('[Validate API] Returning Blocked (Origin mismatch)');
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'origin_mismatch',
        message: `Request origin '${originHost}' does not match registered website URL '${registeredHost}'`,
        website: matchedWebsite.url,
        expiresAt: null,
        protectionEnabled: true
      });
    }
    devLog(`[Validate API] Step 4 Passed: Origin Verified ('${originHost}' matches '${registeredHost}')`);
  } else {
    devLog('[Validate API] Step 4 Passed: Origin check skipped (No origin provided)');
  }

  // STEP 5: Demo Token Received?
  const hasToken = !!(demoToken && typeof demoToken === 'string' && demoToken.trim());
  devLog(`[Validate API] Step 5: Demo Token Received? ${hasToken ? 'TRUE' : 'FALSE'}`);

  if (!hasToken) {
    devLog('[Validate API] Step 5 Failed: No Demo Token provided -> Returning Blocked');
    return jsonResponse(200, {
      status: 'blocked',
      reason: 'protected',
      message: 'Website is protected and requires a valid demo token',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  const cleanToken = demoToken!.trim();
  const tokenHash = hashToken(cleanToken);
  devLog(`[Validate API] Generated Token Hash: ${tokenHash}`);

  // Search Supabase for hashed token (and fallback to raw token for backwards compatibility)
  const { data: demoLinks, error: tokenError } = await supabase
    .from('demo_links')
    .select('*')
    .eq('website_id', matchedWebsite.id)
    .or(`token.eq.${tokenHash},token.eq.${cleanToken}`);

  if (tokenError) {
    devWarn('[Validate API] Database error querying demo_links:', tokenError);
    return jsonResponse(500, {
      status: 'error',
      message: 'Database query error during token validation',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  const activeLink = demoLinks && demoLinks.length > 0 ? demoLinks[0] : null;
  devLog(`[Validate API] Step 6: Database Match? ${activeLink ? 'TRUE' : 'FALSE'}`);

  if (!activeLink) {
    devLog('[Validate API] Returning Invalid Token');
    return jsonResponse(200, {
      status: 'invalid_token',
      message: 'Demo token is invalid for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  // STEP 7: Expiry Check
  const now = new Date();
  const expiryDate = new Date(activeLink.expiry_at);
  const isExpired = expiryDate <= now;
  devLog(`[Validate API] Step 7: Expiry Check? ${isExpired ? 'EXPIRED' : 'ACTIVE'} (Expires: ${activeLink.expiry_at}, Now: ${now.toISOString()})`);

  if (isExpired) {
    // 1. Expired demo tokens must automatically become inactive/deleted in Supabase
    devLog('[Validate API] Deleting expired token from database to inactivate it');
    const { error: deleteError } = await supabase
      .from('demo_links')
      .delete()
      .eq('id', activeLink.id);
    if (deleteError) {
      devWarn('[Validate API] Failed to delete/inactivate expired token:', deleteError);
    }

    devLog('[Validate API] Returning Demo Expired');
    return jsonResponse(200, {
      status: 'demo_expired',
      message: 'Demo token has expired',
      website: matchedWebsite.url,
      expiresAt: activeLink.expiry_at,
      protectionEnabled: true
    });
  }

  // 2. Demo link views should only increment once per browser session
  if (incrementView) {
    devLog('[Validate API] Incrementing view count in Supabase');
    const { error: updateError } = await supabase
      .from('demo_links')
      .update({ views_count: activeLink.views_count + 1 })
      .eq('id', activeLink.id);
    if (updateError) {
      devWarn('[Validate API] Failed to increment views_count:', updateError);
    }
  }

  devLog('[Validate API] Returning Allowed');
  return jsonResponse(200, {
    status: 'allowed',
    message: 'Valid demo token',
    website: matchedWebsite.url,
    expiresAt: activeLink.expiry_at,
    protectionEnabled: true,
    websiteId: matchedWebsite.id
  });
};
