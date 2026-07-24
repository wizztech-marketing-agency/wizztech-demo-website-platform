(function () {
  // 1. Immediately hide the body to prevent flash of protected content
  const style = document.createElement('style');
  style.id = 'wizztech-protect-hide';
  style.innerHTML = 'html, body { display: none !important; background: #000000 !important; }';
  document.documentElement.appendChild(style);

  // Determine platform base URL dynamically from the script source
  let platformBaseUrl = "http://localhost:5173";
  if (document.currentScript) {
    try {
      const scriptUrl = new URL(document.currentScript.src);
      platformBaseUrl = scriptUrl.origin;
    } catch (e) {
      console.warn('Could not parse script tag src, falling back to localhost', e);
    }
  }

  const IS_DEV = platformBaseUrl.includes('localhost') || platformBaseUrl.includes('127.0.0.1');

  function devLog(...args) {
    if (IS_DEV) {
      console.log(...args);
    }
  }

  function devWarn(...args) {
    if (IS_DEV) {
      console.warn(...args);
    }
  }

  // Helper to unhide the website
  function showPage() {
    const hideStyle = document.getElementById('wizztech-protect-hide');
    if (hideStyle) {
      hideStyle.remove();
    }
    // Also restore default display if applied to documentElement directly
    document.documentElement.style.display = '';
  }

  // Helper to render the premium restricting screen
  function showRestrictionScreen(status) {
    const isExpired = status === 'demo_expired';
    const title = isExpired ? 'Demo Link Expired' : 'Access Restricted';
    const message = isExpired
      ? `The temporary demo link for this website has expired.<br/>Please request a new link from WizzTech.`
      : `This website is protected by WizzTech Digital Agency.<br/>Please request a valid demo link to access this website.`;

    // Remove all existing HTML in the document and write the premium restricted page
    document.open();
    document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | WizzTech Security</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #0D0C0A;
      color: #FFFFFF;
      font-family: 'Outfit', 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    /* Dynamic background abstract glows */
    body::before, body::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(251, 124, 41, 0.08) 0%, rgba(0,0,0,0) 70%);
      z-index: 1;
      pointer-events: none;
    }
    body::before {
      top: -100px;
      left: -100px;
    }
    body::after {
      bottom: -100px;
      right: -100px;
    }
    .card {
      background: rgba(20, 19, 17, 0.6);
      border: 1px solid rgba(234, 230, 223, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      width: 100%;
      max-width: 480px;
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03);
      z-index: 2;
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .logo-container {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(251, 124, 41, 0.04);
      border: 1px solid rgba(251, 124, 41, 0.15);
      margin: 0 auto 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FB7C29;
      position: relative;
    }
    .logo-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      box-shadow: 0 0 20px rgba(251, 124, 41, 0.2);
      animation: pulse 3s infinite ease-in-out;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin-bottom: 16px;
    }
    .text-msg {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 32px;
      font-family: 'Inter', sans-serif;
    }
    .whatsapp-link {
      display: inline-block;
      width: 100%;
      background: #FFFFFF;
      color: #000000;
      border: 1px solid #FFFFFF;
      padding: 14px 28px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .whatsapp-link:hover {
      background: transparent;
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    .footer-brand {
      margin-top: 40px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: rgba(255, 255, 255, 0.3);
      font-weight: 600;
    }
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes pulse {
      0%, 100% {
        opacity: 0.5;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <div class="logo-glow"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h1>${title}</h1>
    <div class="text-msg">
      ${message}<br/><br/>
      <a href="https://wa.me/19284385776" target="_blank" class="whatsapp-link">
        Please request a new demo link from WizzTech.
      </a>
    </div>
    <div class="footer-brand">WizzTech Security</div>
  </div>
</body>
</html>
    `);
    document.close();
  }

  // Call WizzTech validation API
  async function callValidationApi(websiteUrl, demoToken, incrementView = false) {
    const url = `${platformBaseUrl}/.netlify/functions/validate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ websiteUrl, demoToken, incrementView })
    });
    if (!response.ok) {
      throw new Error(`Validation API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Start background validation interval
  function startBackgroundValidation(tokenValue) {
    devLog('[SDK] Starting background validation check every 4 minutes');
    setInterval(async () => {
      try {
        // Automatically clear expired session cache first
        const expiry = sessionStorage.getItem('wizztech_auth_expiry');
        if (expiry && new Date(expiry) <= new Date()) {
          devLog('[SDK] Session expired in background. Clearing cache and restricting.');
          sessionStorage.removeItem('wizztech_auth_token');
          sessionStorage.removeItem('wizztech_auth_expiry');
          sessionStorage.removeItem('wizztech_auth_site_id');
          showRestrictionScreen('demo_expired');
          return;
        }

        devLog('[SDK] Running background token status verification');
        const result = await callValidationApi(window.location.href, tokenValue, false);
        if (result.status !== 'allowed') {
          devWarn('[SDK] Token revoked or invalidated in background:', result.status);
          sessionStorage.removeItem('wizztech_auth_token');
          sessionStorage.removeItem('wizztech_auth_expiry');
          sessionStorage.removeItem('wizztech_auth_site_id');
          showRestrictionScreen(result.status);
        } else {
          devLog('[SDK] Background validation check succeeded, session cache active');
          sessionStorage.setItem('wizztech_auth_expiry', result.expiresAt);
        }
      } catch (e) {
        devWarn('[SDK] Background validation check skipped due to request error:', e);
      }
    }, 240000); // 4 minutes
  }

  // Core authorization flow
  async function runAuthorizationFlow() {
    try {
      const currentUrlStr = window.location.href;

      // 4. Automatically clear expired session cache before making any validation request
      const sessionExpiry = sessionStorage.getItem('wizztech_auth_expiry');
      if (sessionExpiry && new Date(sessionExpiry) <= new Date()) {
        devLog('[SDK] Expired session detected in sessionStorage. Clearing cache.');
        sessionStorage.removeItem('wizztech_auth_token');
        sessionStorage.removeItem('wizztech_auth_expiry');
        sessionStorage.removeItem('wizztech_auth_site_id');
      }

      // 3. Respect Session Cache: Check if valid session is already cached
      const cachedToken = sessionStorage.getItem('wizztech_auth_token');
      const cachedExpiry = sessionStorage.getItem('wizztech_auth_expiry');
      if (cachedToken && cachedExpiry && new Date(cachedExpiry) > new Date()) {
        devLog('[SDK] Valid session cache found. Allowing access immediately.');
        showPage();
        startBackgroundValidation(cachedToken);
        return;
      }

      // Check URL for token
      const path = window.location.pathname;
      const cleanPathMatch = path.match(/^\/demo\/([A-Za-z0-9]{7,8})$/);
      let tokenValue = null;

      if (cleanPathMatch) {
        tokenValue = cleanPathMatch[1];
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        tokenValue = urlParams.get('wz_token') || urlParams.get('demo');
      }

      // 2. Demo link views should only increment once per browser session
      let incrementView = false;
      if (tokenValue) {
        const hasIncremented = sessionStorage.getItem('wizztech_view_incremented_' + tokenValue);
        if (!hasIncremented) {
          incrementView = true;
        }
      }

      devLog('[SDK] Querying validation API with URL token:', tokenValue);
      const result = await callValidationApi(currentUrlStr, tokenValue, incrementView);

      if (result.status === 'allowed') {
        devLog('[SDK] Validation succeeded: access allowed');

        if (tokenValue && result.expiresAt && result.websiteId) {
          // Store token in session cache
          sessionStorage.setItem('wizztech_auth_token', tokenValue);
          sessionStorage.setItem('wizztech_auth_expiry', result.expiresAt);
          sessionStorage.setItem('wizztech_auth_site_id', result.websiteId);
          sessionStorage.setItem('wizztech_view_incremented_' + tokenValue, 'true');

          // Confirm cache written successfully before modifying URL
          const checkToken = sessionStorage.getItem('wizztech_auth_token');
          if (checkToken === tokenValue) {
            // Restore original application route
            if (cleanPathMatch) {
              // Path was /demo/token. Restore path using 'redirect' query parameter if present, or /
              const urlParams = new URLSearchParams(window.location.search);
              const redirectPath = urlParams.get('redirect') || '/';
              window.history.replaceState(null, '', redirectPath);
            } else {
              // Token was in query params. Only strip token parameters, preserving original route.
              const url = new URL(window.location.href);
              url.searchParams.delete('wz_token');
              url.searchParams.delete('demo');
              window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }
          }
        }

        showPage();
        if (tokenValue) {
          startBackgroundValidation(tokenValue);
        }
        return;
      }

      // If token is invalid or expired, clear session cache
      if (tokenValue) {
        sessionStorage.removeItem('wizztech_auth_token');
        sessionStorage.removeItem('wizztech_auth_expiry');
        sessionStorage.removeItem('wizztech_auth_site_id');
      }

      devWarn('[SDK] Validation rejected, status:', result.status);
      showRestrictionScreen(result.status);

    } catch (e) {
      devWarn('WizzTech security validation request failed:', e);
      // Fail secure on request error
      showRestrictionScreen('blocked');
    }
  }

  // Execute verification on window load or DOMContentLoaded (whichever happens first)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAuthorizationFlow);
  } else {
    runAuthorizationFlow();
  }
})();
