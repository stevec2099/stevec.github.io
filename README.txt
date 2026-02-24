
Telkom Lead Panel - Static Web App
=================================

What this package contains
- index.html     : Main single-page app
- styles.css     : Styling for the Telkom look
- pkce.js        : PKCE helper functions
- oauth.js       : OAuth configuration + helpers (edit with your client values)
- app.js         : Main app logic (calls Genesys .ie APIs & renders lead data)

How to host
1. Upload these files to your web server (e.g., https://yourdomain.example/).
2. Ensure the redirect URI configured in Genesys Cloud OAuth matches the REDIRECT_URI in oauth.js.

Important places to edit (in oauth.js)
- OAUTH_CONFIG.CLIENT_ID    -> replace with your Genesys OAuth client ID
- OAUTH_CONFIG.REDIRECT_URI -> the redirect URL you registered in Genesys Cloud
- OAUTH_CONFIG.SCOPES       -> space-separated scopes your app requires
- Optionally update AUTH_BASE and API_BASE if using a different region.

OAuth setup (brief)
1. In Genesys Cloud: Admin -> Integrations -> OAuth. Create a client:
   - Grant Type: Authorization Code + PKCE
   - Redirect URI: e.g. https://yourdomain.example/
   - Scopes: conversations outbound users:readonly (adjust)
2. Deploy the files and open the page embedded in Genesys (Interaction Widget) with:
   https://yourdomain.example/index.html?conversationId={{gcConversationId}}

Embedding as Interaction Widget
1. Create a Client App (Admin -> Integrations -> Client Apps) and add a Panel / Interaction Widget.
2. Use the URL above as the widget URL. The system will substitute {{gcConversationId}} at runtime.
3. Ensure your domain is allowed to be embedded (iframe) in your org settings if required.

Notes & troubleshooting
- This sample stores access tokens in sessionStorage under 'gc_access_token'.
- The code attempts to discover contactListId/contactId from conversation payload attributes using common key patterns.
- If the fields are not discovered, paste a redacted conversation JSON into the developer and I can patch the discovery logic.
- For production, enforce HTTPS, tighten scopes, and consider server-side token exchange if needed for security.
