(function () {
  // ──────────────────────────────────────────────────────────────────────────
  // WizzTech Protection SDK v1.1
  // Immediately hide the body to prevent flash of protected content
  // ──────────────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.id = 'wizztech-protect-hide';
  style.innerHTML = 'html, body { display: none !important; background: #000000 !important; }';
  document.documentElement.appendChild(style);

  // ── Configuration ──────────────────────────────────────────────────────────

  // DEBUG MODE: Set to false once everything is verified working
  var DEBUG_MODE = true;

  // SESSION CACHE: Set to false to force every page load to hit the API
  // Re-enable (true) once the full flow is verified working end-to-end
  var SESSION_CACHE_ENABLED = false;

  // Determine platform base URL dynamically from the script source
  var platformBaseUrl = 'http://localhost:8888';
  if (document.currentScript) {
    try {
      var scriptUrl = new URL(document.currentScript.src);
      platformBaseUrl = scriptUrl.origin;
    } catch (e) {
      console.warn('[WizzTech SDK] Could not parse script tag src, falling back to localhost', e);
    }
  }

  // ── Logging ────────────────────────────────────────────────────────────────

  function log() {
    if (DEBUG_MODE) {
      var args = Array.prototype.slice.call(arguments);
      console.log.apply(console, ['[WizzTech SDK]'].concat(args));
    }
  }

  function warn() {
    if (DEBUG_MODE) {
      var args = Array.prototype.slice.call(arguments);
      console.warn.apply(console, ['[WizzTech SDK]'].concat(args));
    }
  }

  log('SDK loaded. platformBaseUrl:', platformBaseUrl);
  log('SESSION_CACHE_ENABLED:', SESSION_CACHE_ENABLED);
  log('DEBUG_MODE:', DEBUG_MODE);
  log('window.location.href:', window.location.href);
  log('window.location.pathname:', window.location.pathname);
  log('window.location.search:', window.location.search);

  // ── DOM Helpers ────────────────────────────────────────────────────────────

  function showPage() {
    var hideStyle = document.getElementById('wizztech-protect-hide');
    if (hideStyle) hideStyle.remove();
    document.documentElement.style.display = '';
    log('Page revealed (access allowed)');
  }

  function showRestrictionScreen(status) {
    var isExpired = status === 'demo_expired';
    var title = isExpired ? 'Demo Link Expired' : 'Access Restricted';
    var message = isExpired
      ? 'The temporary demo link for this website has expired.<br/>Please request a new link from WizzTech.'
      : 'This website is protected by WizzTech Digital Agency.<br/>Please request a valid demo link to access this website.';

    log('Showing restriction screen, status:', status);

    document.open();
    document.write('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + title + ' | WizzTech Security</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0D0C0A;color:#fff;font-family:\'Outfit\',\'Inter\',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;overflow:hidden;position:relative}body::before,body::after{content:\'\';position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(251,124,41,.08) 0%,rgba(0,0,0,0) 70%);z-index:1;pointer-events:none}body::before{top:-100px;left:-100px}body::after{bottom:-100px;right:-100px}.card{background:rgba(20,19,17,.6);border:1px solid rgba(234,230,223,.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);width:100%;max-width:480px;border-radius:24px;padding:48px 40px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.03);z-index:2;opacity:0;transform:translateY(20px);animation:fadeInUp .8s cubic-bezier(.16,1,.3,1) forwards}.logo-container{width:72px;height:72px;border-radius:20px;background:rgba(251,124,41,.04);border:1px solid rgba(251,124,41,.15);margin:0 auto 32px;display:flex;align-items:center;justify-content:center;color:#FB7C29;position:relative}.logo-glow{position:absolute;width:100%;height:100%;border-radius:inherit;box-shadow:0 0 20px rgba(251,124,41,.2);animation:pulse 3s infinite ease-in-out}h1{font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin-bottom:16px}.text-msg{font-size:14px;line-height:1.6;color:rgba(255,255,255,.7);margin-bottom:32px;font-family:\'Inter\',sans-serif}.whatsapp-link{display:inline-block;width:100%;background:#fff;color:#000;border:1px solid #fff;padding:14px 28px;border-radius:14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);box-shadow:0 4px 12px rgba(0,0,0,.1)}.whatsapp-link:hover{background:transparent;color:#fff;border-color:rgba(255,255,255,.3);transform:translateY(-1px)}.footer-brand{margin-top:40px;font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.3);font-weight:600}@keyframes fadeInUp{to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}</style></head><body><div class="card"><div class="logo-container"><div class="logo-glow"></div><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h1>' + title + '</h1><div class="text-msg">' + message + '<br/><br/><a href="https://wa.me/19284385776" target="_blank" class="whatsapp-link">Please request a new demo link from WizzTech.</a></div><div class="footer-brand">WizzTech Security</div></div></body></html>');
    document.close();
  }

  // ── API Call ───────────────────────────────────────────────────────────────

  function callValidationApi(websiteUrl, demoToken, incrementView) {
    var url = platformBaseUrl + '/.netlify/functions/validate';
    var payload = { websiteUrl: websiteUrl, demoToken: demoToken, incrementView: !!incrementView };

    log('Calling validation API:', url);
    log('Payload:', JSON.stringify(payload));

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      log('API response status:', response.status);
      if (!response.ok) {
        throw new Error('Validation API HTTP error: ' + response.status + ' ' + response.statusText);
      }
      return response.json();
    }).then(function (data) {
      log('API response body:', JSON.stringify(data));
      return data;
    });
  }

  // ── Session Cache Helpers ──────────────────────────────────────────────────

  function clearSessionCache() {
    sessionStorage.removeItem('wizztech_auth_token');
    sessionStorage.removeItem('wizztech_auth_expiry');
    sessionStorage.removeItem('wizztech_auth_site_id');
    log('Session cache cleared');
  }

  function getCachedSession() {
    if (!SESSION_CACHE_ENABLED) return null;
    var token = sessionStorage.getItem('wizztech_auth_token');
    var expiry = sessionStorage.getItem('wizztech_auth_expiry');
    if (!token || !expiry) return null;
    if (new Date(expiry) <= new Date()) {
      log('Cached session is expired, clearing');
      clearSessionCache();
      return null;
    }
    return { token: token, expiry: expiry };
  }

  function setCachedSession(token, expiresAt, websiteId) {
    if (!SESSION_CACHE_ENABLED) return;
    sessionStorage.setItem('wizztech_auth_token', token);
    sessionStorage.setItem('wizztech_auth_expiry', expiresAt);
    sessionStorage.setItem('wizztech_auth_site_id', websiteId || '');
    log('Session cache written for token:', token, 'expires:', expiresAt);
  }

  // ── Background Validation ──────────────────────────────────────────────────

  function startBackgroundValidation(tokenValue, baseUrl) {
    if (!SESSION_CACHE_ENABLED) {
      log('Background validation skipped (session cache disabled)');
      return;
    }
    log('Starting background validation every 4 minutes');
    setInterval(function () {
      // Check session expiry first
      var expiry = sessionStorage.getItem('wizztech_auth_expiry');
      if (expiry && new Date(expiry) <= new Date()) {
        log('Background: session expired, restricting access');
        clearSessionCache();
        showRestrictionScreen('demo_expired');
        return;
      }

      log('Background: running periodic validation');
      callValidationApi(baseUrl, tokenValue, false).then(function (result) {
        if (result.status !== 'allowed') {
          warn('Background: token revoked or invalidated, status:', result.status);
          clearSessionCache();
          showRestrictionScreen(result.status);
        } else {
          log('Background: validation OK, refreshing expiry');
          if (result.expiresAt) {
            sessionStorage.setItem('wizztech_auth_expiry', result.expiresAt);
          }
        }
      }).catch(function (e) {
        warn('Background validation error (skipping):', e.message);
      });
    }, 240000); // 4 minutes
  }

  // ── Core Authorization Flow ────────────────────────────────────────────────

  function runAuthorizationFlow() {
    log('── runAuthorizationFlow START ────────────────────');

    // Extract the BASE site URL (origin only, no path/token) to send to the API.
    // This ensures the website lookup matches the registered URL in the database
    // regardless of whether the user is on /demo/TOKEN or /?wz_token=TOKEN.
    var siteBaseUrl = window.location.origin;
    log('siteBaseUrl (used for website lookup):', siteBaseUrl);

    // ── Extract Token from URL (Priority 1 & 2) ───────────────────────────────
    var tokenValue = null;
    var cleanPathMatch = null;

    // Priority 1: Read ?wz_token= or ?demo=
    var urlParams = new URLSearchParams(window.location.search);
    var paramToken = urlParams.get('wz_token') || urlParams.get('demo');
    if (paramToken && paramToken.trim()) {
      tokenValue = paramToken.trim();
      log('Priority 1: Token extracted from query param:', tokenValue);
    } else {
      // Priority 2: Check /demo/TOKEN (8-char alphanumeric)
      var path = window.location.pathname;
      var pathMatch = path.match(/^\/demo\/([A-Za-z0-9]{7,10})$/);
      if (pathMatch) {
        cleanPathMatch = pathMatch;
        tokenValue = pathMatch[1];
        log('Priority 2: Token extracted from path /demo/TOKEN:', tokenValue);
      }
    }

    if (!SESSION_CACHE_ENABLED) {
      log('Session cache DISABLED — clearing cache');
      clearSessionCache();
    }

    // Priority 3: If neither exists, use the existing session cache
    if (!tokenValue) {
      var cachedSession = getCachedSession();
      if (cachedSession) {
        log('Priority 3: Valid session cache found. Skipping API call and allowing access.');
        showPage();
        startBackgroundValidation(cachedSession.token, siteBaseUrl);
        return;
      }
      log('No demo token found in URL and no valid session cache exists. Sending null token (will be blocked if site is protected).');
    }

    // Increment view only once per session per token
    var incrementView = false;
    if (tokenValue && SESSION_CACHE_ENABLED) {
      var hasIncremented = sessionStorage.getItem('wizztech_view_incremented_' + tokenValue);
      if (!hasIncremented) {
        incrementView = true;
        log('Will increment view count (first time for this token in this session)');
      }
    } else if (tokenValue) {
      // When cache disabled, always count the view
      incrementView = true;
    }

    // ── Call Validation API ──────────────────────────────────────────────────
    // Send the BASE URL (origin) as websiteUrl — not the full path with token.
    // This ensures the database lookup matches the stored website URL correctly.
    callValidationApi(siteBaseUrl, tokenValue, incrementView).then(function (result) {
      log('Validation result received:', result.status, '| protectionEnabled:', result.protectionEnabled);

      if (result.status === 'allowed') {
        log('ACCESS ALLOWED ✓');

        // Cache session if cache is enabled and we have a token
        if (tokenValue && result.expiresAt && result.websiteId) {
          setCachedSession(tokenValue, result.expiresAt, result.websiteId);

          if (SESSION_CACHE_ENABLED) {
            // Mark view as incremented
            sessionStorage.setItem('wizztech_view_incremented_' + tokenValue, 'true');
          }

          // Clean up the URL after successful validation:
          // Remove the token from the URL so it doesn't show on subsequent page navigations
          if (cleanPathMatch) {
            // Was /demo/TOKEN — redirect to / (or ?redirect= param if present)
            var redirectParams = new URLSearchParams(window.location.search);
            var redirectPath = redirectParams.get('redirect') || '/';
            log('Cleaning up /demo/TOKEN path, redirecting to:', redirectPath);
            window.history.replaceState(null, '', redirectPath);
          } else {
            // Was ?wz_token=TOKEN — strip token params, keep rest of URL
            var cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('wz_token');
            cleanUrl.searchParams.delete('demo');
            var newHref = cleanUrl.pathname + cleanUrl.search + cleanUrl.hash;
            log('Cleaning up query token from URL, new path:', newHref);
            window.history.replaceState(null, '', newHref);
          }
        }

        showPage();

        if (tokenValue) {
          startBackgroundValidation(tokenValue, siteBaseUrl);
        }
        return;
      }

      // Not allowed — clear any stale session cache and show restriction
      if (tokenValue) {
        clearSessionCache();
      }

      warn('ACCESS DENIED. Status:', result.status, '| Reason:', result.reason || '(none)');
      showRestrictionScreen(result.status);

    }).catch(function (e) {
      warn('Validation API request failed with error:', e.message);
      // Fail secure: show restriction screen on network/API errors
      showRestrictionScreen('blocked');
    });
  }

  // ── Entry Point ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAuthorizationFlow);
  } else {
    runAuthorizationFlow();
  }

})();
