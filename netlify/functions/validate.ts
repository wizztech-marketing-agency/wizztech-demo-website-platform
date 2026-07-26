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
    console.warn(`[Validate] Rejected ${event.httpMethod} request (only POST allowed)`);
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
    console.warn('[Validate] Failed to parse JSON request body:', err);
    return jsonResponse(400, {
      status: 'error',
      message: 'Invalid JSON payload',
      website: null,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const { websiteUrl, origin: bodyOrigin, demoToken, incrementView } = body;

  // ─────────────────────────────────────────────────────────────
  // DEBUG: Log every incoming field so we can trace the full flow
  // ─────────────────────────────────────────────────────────────
  console.log('[Validate] ── INCOMING REQUEST ──────────────────────────');
  console.log('[Validate] websiteUrl   :', websiteUrl);
  console.log('[Validate] bodyOrigin   :', bodyOrigin);
  console.log('[Validate] demoToken    :', demoToken);
  console.log('[Validate] incrementView:', incrementView);
  console.log('[Validate] httpMethod   :', event.httpMethod);
  console.log('[Validate] headers.origin:', event.headers['origin']);
  console.log('[Validate] ─────────────────────────────────────────────');

  // STEP 1: SDK Authentication Header Verification
  const sdkKeyHeader = event.headers['x-wizztech-sdk-key'] || event.headers['X-WizzTech-SDK-Key'];
  const configuredSdkKey = process.env.WIZZTECH_SDK_KEY || process.env.VITE_WIZZTECH_SDK_KEY;

  if (configuredSdkKey) {
    if (!sdkKeyHeader || sdkKeyHeader !== configuredSdkKey) {
      console.warn('[Validate] Step 1 FAILED: Invalid or missing x-wizztech-sdk-key header');
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'invalid_sdk_key',
        message: 'Invalid or missing SDK API key header',
        website: null,
        expiresAt: null,
        protectionEnabled: true
      });
    }
    console.log('[Validate] Step 1 PASSED: SDK Key valid');
  } else {
    console.log('[Validate] Step 1 PASSED: No SDK key configured, skipping check');
  }

  if (!websiteUrl) {
    console.warn('[Validate] Missing websiteUrl parameter');
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
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  console.log('[Validate] Supabase URL present   :', !!supabaseUrl);
  console.log('[Validate] Supabase KEY present   :', !!supabaseKey);
  console.log('[Validate] Key type (first 20 chars):', supabaseKey.substring(0, 20));

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Validate] Supabase environment variables missing');
    return jsonResponse(500, {
      status: 'error',
      message: 'Server configuration error: missing database credentials',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // STEP 2: Website lookup in Supabase
  const requestHost = normalizeHost(websiteUrl);
  console.log(`[Validate] Step 2: Looking up website for URL='${websiteUrl}' (normalizedHost='${requestHost}')`);

  const { data: websites, error: websiteError } = await supabase
    .from('websites')
    .select('*');

  if (websiteError) {
    console.error('[Validate] Step 2 FAILED: Database error querying websites:', JSON.stringify(websiteError));
    return jsonResponse(500, {
      status: 'error',
      message: 'Database query failed',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  console.log(`[Validate] Step 2: Total websites in database: ${(websites || []).length}`);
  (websites || []).forEach((w, i) => {
    console.log(`[Validate]   [${i}] id=${w.id} name='${w.name}' url='${w.url}' normalizedHost='${normalizeHost(w.url)}' is_protected=${w.is_protected}`);
  });

  const matchedWebsite = (websites || []).find((w) => {
    if (!w.url) return false;
    // Exact match (case-insensitive)
    if (w.url.trim().toLowerCase() === websiteUrl.trim().toLowerCase()) return true;
    // Hostname match
    const dbHost = normalizeHost(w.url);
    const matches = dbHost === requestHost || requestHost.endsWith('.' + dbHost) || dbHost.endsWith('.' + requestHost);
    console.log(`[Validate]   Comparing dbHost='${dbHost}' vs requestHost='${requestHost}' → ${matches}`);
    return matches;
  });

  // Unregistered websites must NOT be blocked
  if (!matchedWebsite) {
    console.log(`[Validate] Step 2: No website matched for '${websiteUrl}' → returning allowed (not registered)`);
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Website is not registered in WizzTech Platform',
      website: websiteUrl,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  console.log(`[Validate] Step 2 PASSED: Matched website id=${matchedWebsite.id} name='${matchedWebsite.name}' is_protected=${matchedWebsite.is_protected}`);

  // STEP 3: Protection status check
  const isProtected = matchedWebsite.is_protected;
  console.log(`[Validate] Step 3: Protection enabled? ${isProtected}`);

  if (!isProtected) {
    console.log('[Validate] Step 3: Protection OFF → returning allowed');
    return jsonResponse(200, {
      status: 'allowed',
      message: 'Protection is disabled for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: false
    });
  }

  // STEP 4: Origin Verification (only when protection is ON)
  const requestOrigin = bodyOrigin || event.headers['origin'] || event.headers['referer'] || '';
  console.log(`[Validate] Step 4: requestOrigin='${requestOrigin}'`);

  if (requestOrigin) {
    const originHost = normalizeHost(requestOrigin);
    const registeredHost = normalizeHost(matchedWebsite.url);
    const isDevOrigin = originHost === 'localhost' || originHost === '127.0.0.1' || originHost.startsWith('localhost:');

    console.log(`[Validate] Step 4: originHost='${originHost}' registeredHost='${registeredHost}' isDevOrigin=${isDevOrigin}`);

    if (isDevOrigin) {
      console.log('[Validate] Step 4 PASSED: Development origin allowed for testing');
    } else if (
      originHost &&
      registeredHost &&
      originHost !== registeredHost &&
      !originHost.endsWith('.' + registeredHost) &&
      !registeredHost.endsWith('.' + originHost)
    ) {
      console.warn(`[Validate] Step 4 FAILED: Origin mismatch! '${originHost}' !== '${registeredHost}'`);
      return jsonResponse(200, {
        status: 'blocked',
        reason: 'origin_mismatch',
        message: `Request origin '${originHost}' does not match registered website URL '${registeredHost}'`,
        website: matchedWebsite.url,
        expiresAt: null,
        protectionEnabled: true
      });
    } else {
      console.log(`[Validate] Step 4 PASSED: Origin '${originHost}' matches registered host '${registeredHost}'`);
    }
  } else {
    console.log('[Validate] Step 4 PASSED: No origin header provided, skipping check');
  }

  // STEP 5: Demo Token check
  const hasToken = !!(demoToken && typeof demoToken === 'string' && demoToken.trim());
  console.log(`[Validate] Step 5: Demo token received? ${hasToken} (value: '${demoToken}')`);

  if (!hasToken) {
    console.log('[Validate] Step 5: No token → returning blocked (protection ON, no token)');
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
  console.log(`[Validate] Step 6: cleanToken='${cleanToken}' (len=${cleanToken.length})`);
  console.log(`[Validate] Step 6: tokenHash='${tokenHash}' (len=${tokenHash.length})`);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX: Use .in() instead of fragile .or() for dual-token lookup.
  // We search for BOTH the SHA-256 hash (new tokens) AND the raw token
  // (backward-compatibility for any old un-hashed tokens).
  // ─────────────────────────────────────────────────────────────────────────────
  const tokensToSearch = Array.from(new Set([tokenHash, cleanToken])); // dedup if same
  console.log(`[Validate] Step 6: Searching demo_links for website_id=${matchedWebsite.id} with tokens:`, tokensToSearch);

  const { data: demoLinks, error: tokenError } = await supabase
    .from('demo_links')
    .select('*')
    .eq('website_id', matchedWebsite.id)
    .in('token', tokensToSearch);

  if (tokenError) {
    console.error('[Validate] Step 6 FAILED: Database error querying demo_links:', JSON.stringify(tokenError));
    return jsonResponse(500, {
      status: 'error',
      message: 'Database query error during token validation',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  console.log(`[Validate] Step 6: demo_links query returned ${(demoLinks || []).length} rows`);
  (demoLinks || []).forEach((dl, i) => {
    console.log(`[Validate]   [${i}] id=${dl.id} token='${dl.token.substring(0, 20)}...' expiry_at=${dl.expiry_at}`);
  });

  const now = new Date();

  // Sort matching links so unexpired active links are prioritized over expired ones
  const sortedLinks = (demoLinks || []).sort((a, b) => {
    const aExpired = new Date(a.expiry_at) <= now;
    const bExpired = new Date(b.expiry_at) <= now;
    if (!aExpired && bExpired) return -1;
    if (aExpired && !bExpired) return 1;
    return new Date(b.expiry_at).getTime() - new Date(a.expiry_at).getTime();
  });

  const activeLink = sortedLinks.length > 0 ? sortedLinks[0] : null;

  if (!activeLink) {
    console.log('[Validate] Step 6: No matching token found → returning invalid_token');
    return jsonResponse(200, {
      status: 'invalid_token',
      message: 'Demo token is invalid for this website',
      website: matchedWebsite.url,
      expiresAt: null,
      protectionEnabled: true
    });
  }

  console.log(`[Validate] Step 6 PASSED: Selected demo link id=${activeLink.id}`);

  // STEP 7: Expiry Check
  const expiryDate = new Date(activeLink.expiry_at);
  const isExpired = expiryDate <= now;
  console.log(`[Validate] Step 7: now=${now.toISOString()} expiry=${activeLink.expiry_at} isExpired=${isExpired}`);

  if (isExpired) {
    // ─────────────────────────────────────────────────────────────────────────
    // FIX (Issue #8): Do NOT delete expired tokens.
    // Keep them in the database for history & auditing.
    // Only mark is_active = false if the column exists.
    // Since current schema has no is_active column, we simply DO NOT delete.
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Validate] Step 7: Token is EXPIRED. Keeping in DB (no delete). Returning demo_expired.');

    return jsonResponse(200, {
      status: 'demo_expired',
      message: 'Demo token has expired',
      website: matchedWebsite.url,
      expiresAt: activeLink.expiry_at,
      protectionEnabled: true
    });
  }

  console.log('[Validate] Step 7 PASSED: Token is active and not expired');

  // STEP 8: Increment view count (once per session — SDK handles deduplication)
  let updatedViewsCount = (activeLink.views_count || 0) + (incrementView ? 1 : 0);
  if (incrementView) {
    console.log('[Validate] Step 8: Incrementing view count for link id:', activeLink.id);
    const { error: rpcError } = await supabase.rpc('increment_demo_link_views', { link_id: activeLink.id });
    if (rpcError) {
      console.warn('[Validate] Step 8: RPC increment failed, falling back to direct update:', JSON.stringify(rpcError));
      const { error: updateError } = await supabase
        .from('demo_links')
        .update({ views_count: updatedViewsCount })
        .eq('id', activeLink.id);
      if (updateError) {
        console.warn('[Validate] Step 8: Failed to increment views_count:', JSON.stringify(updateError));
      } else {
        console.log('[Validate] Step 8: views_count fallback update succeeded, new count:', updatedViewsCount);
      }
    } else {
      console.log('[Validate] Step 8: views_count incremented successfully via RPC');
    }
  }

  console.log('[Validate] ── RESULT: ALLOWED ────────────────────────────');
  return jsonResponse(200, {
    status: 'allowed',
    message: 'Valid demo token',
    website: matchedWebsite.url,
    expiresAt: activeLink.expiry_at,
    protectionEnabled: true,
    websiteId: matchedWebsite.id
  });
};
