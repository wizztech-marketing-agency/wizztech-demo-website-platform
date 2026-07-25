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

// Generate random secure token string (8 chars alphanumeric)
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

// Construct demo URL - always uses query parameters (?wz_token=TOKEN) to avoid server redirect requirements.
function buildDemoUrl(siteUrl: string, token: string): string {
  try {
    const parsed = new URL(siteUrl);
    parsed.searchParams.set('wz_token', token);
    return parsed.toString();
  } catch {
    // Fallback if URL parsing fails
    const separator = siteUrl.includes('?') ? '&' : '?';
    return `${siteUrl}${separator}wz_token=${token}`;
  }
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

  console.log('[GenerateDemoLink] ── INCOMING REQUEST ─────────────────');

  let body: { websiteId?: string; expiry?: string | number } = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('[GenerateDemoLink] Failed to parse request body:', err);
    return jsonResponse(400, {
      status: 'error',
      message: 'Invalid JSON payload'
    });
  }

  const { websiteId, expiry = '30m' } = body;
  console.log('[GenerateDemoLink] websiteId:', websiteId, '| expiry:', expiry);

  if (!websiteId) {
    console.warn('[GenerateDemoLink] Missing websiteId parameter');
    return jsonResponse(400, {
      status: 'error',
      message: 'Missing websiteId parameter'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('[GenerateDemoLink] Supabase URL present:', !!supabaseUrl);
  console.log('[GenerateDemoLink] Service Role Key present:', !!supabaseServiceKey);
  console.log('[GenerateDemoLink] Anon Key present:', !!supabaseAnonKey);

  if (!supabaseUrl) {
    console.error('[GenerateDemoLink] Supabase URL missing');
    return jsonResponse(500, {
      status: 'error',
      message: 'Server configuration error: missing SUPABASE_URL'
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION STRATEGY:
  //
  // Priority 1: Use the service role key (bypasses RLS entirely) — best for production.
  // Priority 2: Use the user's access token from the Authorization header (acts as the
  //             authenticated user, so the existing "authenticated" INSERT policy applies).
  // Priority 3: Use the anon key — will FAIL if no INSERT policy exists for anon role.
  // ─────────────────────────────────────────────────────────────────────────

  let supabase;
  let authMode: string;

  if (supabaseServiceKey) {
    // Service role key bypasses all RLS — most permissive, for server-side use
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    authMode = 'service_role';
    console.log('[GenerateDemoLink] Auth mode: SERVICE ROLE KEY (RLS bypassed)');
  } else {
    // Extract user's JWT from the Authorization header
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const userAccessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    console.log('[GenerateDemoLink] User access token from header:', userAccessToken ? userAccessToken.substring(0, 20) + '...' : 'MISSING');

    if (userAccessToken && supabaseAnonKey) {
      // Create a Supabase client authenticated as the user
      // This makes the INSERT operate under the user's auth.uid(), satisfying the
      // "Owners can manage their own demo links" policy
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${userAccessToken}` }
        }
      });
      authMode = 'user_jwt';
      console.log('[GenerateDemoLink] Auth mode: USER JWT (will respect RLS as authenticated user)');
    } else if (supabaseAnonKey) {
      // No user token and no service role key — anon will fail if no anon INSERT policy
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      authMode = 'anon_key';
      console.log('[GenerateDemoLink] Auth mode: ANON KEY — WARNING: may fail without anon INSERT policy');
    } else {
      console.error('[GenerateDemoLink] No valid credentials available');
      return jsonResponse(500, {
        status: 'error',
        message: 'Server configuration error: no valid database credentials'
      });
    }
  }

  // 1. Fetch website from Supabase
  console.log('[GenerateDemoLink] Fetching website with id:', websiteId);
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    console.error('[GenerateDemoLink] Website not found. Error:', JSON.stringify(websiteError));
    return jsonResponse(404, {
      status: 'error',
      message: 'Registered website not found',
      detail: websiteError?.message || 'No data returned'
    });
  }

  console.log('[GenerateDemoLink] Website found:', website.name, '|', website.url);

  // 2. Generate raw token & SHA-256 hash
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  console.log('[GenerateDemoLink] Raw token:', rawToken, '| Hash (first 20):', tokenHash.substring(0, 20) + '...');

  // 3. Calculate expiry timestamp
  const seconds = parseExpirySeconds(expiry);
  const expiryDate = new Date(Date.now() + seconds * 1000);
  console.log('[GenerateDemoLink] Expiry:', expiryDate.toISOString(), '(', seconds, 'seconds)');

  // 4. Insert the hashed token into demo_links
  // Note: We omit created_by for service role inserts (RLS bypassed).
  // For user JWT inserts, created_by will be set by auth.uid() automatically.
  const insertPayload: Record<string, any> = {
    website_id: website.id,
    token: tokenHash,
    expiry_at: expiryDate.toISOString()
  };

  console.log('[GenerateDemoLink] Inserting into demo_links:', JSON.stringify(insertPayload));
  console.log('[GenerateDemoLink] Auth mode for insert:', authMode);

  const { data: insertedRow, error: insertError } = await supabase
    .from('demo_links')
    .insert([insertPayload])
    .select()
    .single();

  if (insertError) {
    console.error('[GenerateDemoLink] INSERT FAILED:', JSON.stringify(insertError));
    console.error('[GenerateDemoLink] Insert error code:', insertError.code);
    console.error('[GenerateDemoLink] Insert error hint:', insertError.hint);
    console.error('[GenerateDemoLink] Auth mode was:', authMode);

    // Provide specific guidance based on error type
    let userMessage = 'Failed to create demo link record';
    if (insertError.code === '42501') {
      userMessage = 'RLS policy blocked the insert. The user may not be authenticated, or the insert policy is missing for the anon role.';
    } else if (insertError.code === '23503') {
      userMessage = 'Foreign key constraint failed — the website ID does not exist in the websites table.';
    } else if (insertError.code === '23502') {
      userMessage = 'NOT NULL constraint violated — a required field is missing.';
    }

    return jsonResponse(500, {
      status: 'error',
      message: userMessage,
      detail: insertError.message,
      hint: insertError.hint || '',
      code: insertError.code,
      authMode
    });
  }

  console.log('[GenerateDemoLink] INSERT SUCCESS. Row id:', insertedRow?.id);

  const demoUrl = buildDemoUrl(website.url, rawToken);
  console.log('[GenerateDemoLink] Demo URL:', demoUrl);
  console.log('[GenerateDemoLink] ── SUCCESS ──────────────────────────');

  return jsonResponse(200, {
    status: 'success',
    demoUrl,
    rawToken,
    expiresAt: expiryDate.toISOString()
  });
};
