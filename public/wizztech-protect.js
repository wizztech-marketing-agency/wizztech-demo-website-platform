(function () {
  // 1. Immediately hide the body to prevent flash of protected content
  const style = document.createElement('style');
  style.id = 'wizztech-protect-hide';
  style.innerHTML = 'html, body { display: none !important; background: #000000 !important; }';
  document.documentElement.appendChild(style);

  // Supabase Configuration (publishable anonymous credentials)
  const SUPABASE_URL = "https://hciolzairdpnouccywai.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_1e4hqxq9y_wWb9VvUNyiAA_JVkTgG_k";

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
  function showRestrictionScreen() {
    // Remove all existing HTML in the document and write the premium restricted page
    document.open();
    document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted | WizzTech Security</title>
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
    <h1>Access Restricted</h1>
    <div class="text-msg">
      This website is protected by WizzTech Digital Agency.<br/>
      The link you're trying to access is unavailable or has expired.<br/><br/>
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

  // Query Supabase directly via REST API
  async function apiCall(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}?${query}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Core authorization flow
  async function runAuthorizationFlow() {
    try {
      const hostname = window.location.hostname;
      
      // 1. Fetch website record matching current host to verify protection requirements
      const websites = await apiCall('websites', { select: '*' });
      const currentSite = websites.find(w => {
        try {
          const wUrl = new URL(w.url);
          return wUrl.hostname === hostname || hostname.endsWith(wUrl.hostname);
        } catch {
          return w.url.includes(hostname);
        }
      });

      if (!currentSite) {
        // Not registered, bypass protection
        showPage();
        return;
      }

      if (!currentSite.is_protected) {
        // Registered but protection toggled OFF, bypass protection
        showPage();
        return;
      }

      // 2. Check for token in clean path `/demo/{token}`
      const path = window.location.pathname;
      const cleanPathMatch = path.match(/^\/demo\/([A-Za-z0-9]{7,8})$/);
      let tokenValue = null;

      if (cleanPathMatch) {
        tokenValue = cleanPathMatch[1];
      } else {
        // Query param fallback
        const urlParams = new URLSearchParams(window.location.search);
        tokenValue = urlParams.get('wz_token') || urlParams.get('demo');
      }

      // 3. Token is provided in the URL: Validate it
      if (tokenValue) {
        const matchingLinks = await apiCall('demo_links', {
          token: `eq.${tokenValue}`,
          website_id: `eq.${currentSite.id}`,
          select: '*'
        });

        const activeLink = matchingLinks[0];
        
        if (activeLink && new Date(activeLink.expiry_at) > new Date()) {
          // Token is valid and matches this website. Cache access in sessionStorage.
          sessionStorage.setItem('wizztech_auth_token', tokenValue);
          sessionStorage.setItem('wizztech_auth_expiry', activeLink.expiry_at);
          sessionStorage.setItem('wizztech_auth_site_id', currentSite.id);

          // If accessed via clean path /demo/TOKEN, redirect back to / for a cleaner URL
          if (cleanPathMatch) {
            window.history.replaceState(null, '', '/');
          }
          showPage();
          return;
        } else {
          // Invalid or expired token: show restriction screen
          showRestrictionScreen();
          return;
        }
      }

      // 4. Check for active token session stored in sessionStorage
      const sessionToken = sessionStorage.getItem('wizztech_auth_token');
      const sessionExpiry = sessionStorage.getItem('wizztech_auth_expiry');
      const sessionSiteId = sessionStorage.getItem('wizztech_auth_site_id');

      if (sessionToken && sessionExpiry && sessionSiteId === currentSite.id) {
        if (new Date(sessionExpiry) > new Date()) {
          // Double-check with database to ensure token was not deleted
          const verifyLinks = await apiCall('demo_links', {
            token: `eq.${sessionToken}`,
            website_id: `eq.${currentSite.id}`,
            select: 'id'
          });

          if (verifyLinks.length > 0) {
            showPage();
            return;
          }
        }
        // If local storage is invalid or database verification failed, clear storage
        sessionStorage.removeItem('wizztech_auth_token');
        sessionStorage.removeItem('wizztech_auth_expiry');
        sessionStorage.removeItem('wizztech_auth_site_id');
      }

      // 5. Cross-domain check for authenticated owner bypass
      // Embed an invisible iframe pointing to our platform to check if owner is logged in
      const iframe = document.createElement('iframe');
      iframe.src = `${platformBaseUrl}/iframe-auth-check`;
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.id = 'wizztech-auth-iframe';
      document.documentElement.appendChild(iframe);

      // Listen for message response from iframe
      const authTimeout = setTimeout(() => {
        // Fallback if iframe fails to load or respond
        showRestrictionScreen();
      }, 3000);

      window.addEventListener('message', function handleIframeAuth(event) {
        if (event.origin === platformBaseUrl && event.data && event.data.type === 'WIZZTECH_AUTH_RESULT') {
          clearTimeout(authTimeout);
          window.removeEventListener('message', handleIframeAuth);
          iframe.remove();

          if (event.data.isAuthenticated) {
            // Owner is logged in! Allow access bypass
            showPage();
          } else {
            // Not authenticated, no valid token. Restrict access.
            showRestrictionScreen();
          }
        }
      });

    } catch (e) {
      console.error('WizzTech security validation failed:', e);
      // Fail secure: restrict page access if any query fails
      showRestrictionScreen();
    }
  }

  // Execute verification on window load or DOMContentLoaded (whichever happens first)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAuthorizationFlow);
  } else {
    runAuthorizationFlow();
  }
})();
