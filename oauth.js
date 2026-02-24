
/*
  Configure these values for your OAuth client. Add your Client ID and Redirect URI below.
  Create an OAuth client in Genesys Cloud (Admin > Integrations > OAuth) with:
    - Grant Type: Authorization Code + PKCE
    - Redirect URI: https://yourdomain.example/auth/callback (or https://yourdomain.example/)
    - Scopes: conversations outbound users:readonly (adjust as needed)
*/
const OAUTH_CONFIG = {
  AUTH_BASE: "https://login.mypurecloud.ie", // .ie region
  API_BASE: "https://api.mypurecloud.ie",
  CLIENT_ID: "2720e7d4-ced1-42cd-b6f9-d1c4250f1648",           // <<-- Replace with your OAuth client ID
  REDIRECT_URI: "https://stevec.github.io/auth/callback",// <<-- Replace with your registered redirect URI
  SCOPES: "conversations outbound users:readonly", // adjust scopes as needed
  TOKEN_STORAGE_KEY: "gc_access_token",
  TOKEN_EXPIRES_KEY: "gc_token_expires_at",
  CODE_VERIFIER_KEY: "gc_code_verifier",
};

function buildAuthorizeUrl() {
  const verifier = generateRandomString(96);
  generateCodeChallenge(verifier).then(challenge => {
    sessionStorage.setItem(OAUTH_CONFIG.CODE_VERIFIER_KEY, verifier);
    const url = new URL(`${OAUTH_CONFIG.AUTH_BASE}/oauth/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', OAUTH_CONFIG.CLIENT_ID);
    url.searchParams.set('redirect_uri', OAUTH_CONFIG.REDIRECT_URI);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('scope', OAUTH_CONFIG.SCOPES);
    // optional state - you can set conversationId or other context
    const currentParams = new URLSearchParams(window.location.search);
    const conversationId = currentParams.get('conversationId');
    if (conversationId) url.searchParams.set('state', conversationId);
    window.location.href = url.toString();
  });
}

async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem(OAUTH_CONFIG.CODE_VERIFIER_KEY);
  if (!verifier) throw new Error("Missing code_verifier in sessionStorage (PKCE).");

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
    client_id: OAUTH_CONFIG.CLIENT_ID,
    code_verifier: verifier
  });

  const resp = await fetch(`${OAUTH_CONFIG.AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${resp.statusText} - ${txt}`);
  }

  const data = await resp.json();
  // store token and expiry (epoch ms)
  sessionStorage.setItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY, data.access_token);
  if (data.expires_in) {
    sessionStorage.setItem(OAUTH_CONFIG.TOKEN_EXPIRES_KEY, (Date.now() + (data.expires_in * 1000)).toString());
  }
  return data;
}

function getStoredToken() {
  const token = sessionStorage.getItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
  const expiry = parseInt(sessionStorage.getItem(OAUTH_CONFIG.TOKEN_EXPIRES_KEY) || "0", 10);
  if (!token) return null;
  if (expiry && Date.now() > expiry) return null;
  return token;
}

function signOut() {
  sessionStorage.removeItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(OAUTH_CONFIG.TOKEN_EXPIRES_KEY);
  sessionStorage.removeItem(OAUTH_CONFIG.CODE_VERIFIER_KEY);
  // reload to trigger auth again
  window.location.href = window.location.pathname + window.location.search;
}

// When the redirect back to the app contains ?code=... handle it
async function handleRedirectCallbackIfNeeded() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    // exchange for token and then remove code from URL
    try {
      await exchangeCodeForToken(code);
      // remove code from URL
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('code');
      cleaned.searchParams.delete('state');
      window.history.replaceState({}, document.title, cleaned.pathname + cleaned.search);
      return true;
    } catch (err) {
      console.error(err);
      alert("OAuth token exchange failed: " + err.message);
    }
  }
  return false;
}
