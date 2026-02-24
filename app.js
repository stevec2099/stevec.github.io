
(async function () {
  // app.js relies on oauth.js and pkce.js being loaded
  const API_BASE = "https://api.mypurecloud.ie";
  const statusEl = document.getElementById("status");
  const grid = document.getElementById("grid");
  const controls = document.getElementById("controls");
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn && logoutBtn.addEventListener('click', () => {
    signOut();
  });

  function renderLead(lead) {
    const fields = [
      ["Service Name", lead["Campaign Name"] ?? lead["Campaign_Name"] ?? lead["Campaign"] ],
      ["Lead ID", lead["LEAD_ID"] || lead["lead_id"] || lead["id"]],
      ["Campaign", lead["CAMPAIGN"]],
      ["Customer", lead["CUSTOMER"]],
      ["Deal Name", lead["DEAL_NAME"]],
      ["Alternate Number", lead["ALTERNATE_NUMBER"]],
      ["Contact Number", lead["CONTACT_NUMBER"]],
      ["ID Number", lead["ID_NUMBER"]],
      ["Email", lead["EMAIL"]],
    ];

    grid.innerHTML = "";
    for (const [k, v] of fields) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<div class="k">${k.toUpperCase()}</div><div class="v">${v ?? ""}</div>`;
      grid.appendChild(card);
    }
  }

  async function api(path) {
    const token = getStoredToken();
    if (!token) throw new Error("Missing access token. Please sign in.");
    const res = await fetch(API_BASE + path, { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  }

  // 1) handle OAuth callback if needed
  const handled = await handleRedirectCallbackIfNeeded();
  // show sign in button if no token
  const token = getStoredToken();
  if (!token) {
    statusEl.textContent = "Not signed in — click to sign in.";
    const btn = document.createElement('button');
    btn.textContent = "Sign in to Genesys Cloud";
    btn.addEventListener('click', () => buildAuthorizeUrl());
    statusEl.parentNode.appendChild(btn);
    return;
  } else {
    // show sign out
    controls.style.display = 'block';
  }

  // 2) get conversationId from URL
  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("conversationId");
  if (!conversationId) {
    statusEl.textContent = "Missing conversationId in URL.";
    return;
  }
  statusEl.textContent = `Conversation: ${conversationId} — loading...`;

  // 3) fetch conversation
  let conv;
  try {
    conv = await api(`/api/v2/conversations/calls/${encodeURIComponent(conversationId)}`);
  } catch (e) {
    console.warn("calls endpoint failed, trying generic conversations endpoint", e);
    conv = await api(`/api/v2/conversations/${encodeURIComponent(conversationId)}`);
  }
  console.log("Conversation payload:", conv);
  statusEl.textContent = "Conversation loaded; discovering contact attributes...";

  // 4) discover contactId/contactListId in participants/attributes
  let contactId, contactListId;
  const parts = conv.participants || conv.participant || [];
  for (const p of parts) {
    if (p.attributes) {
      for (const [k, v] of Object.entries(p.attributes)) {
        if (!contactId && /contact(id|Id|ContactId|outboundContactId)/i.test(k) && v) contactId = v;
        if (!contactListId && /contact(list)?(id|Id|ListId|ListID|contactListId)/i.test(k) && v) contactListId = v;
      }
    }
  }
  if ((!contactId || !contactListId) && conv.attributes) {
    for (const [k, v] of Object.entries(conv.attributes)) {
      if (!contactId && /contact(id|Id)/i.test(k) && v) contactId = v;
      if (!contactListId && /contact(list)?(id|Id|ListId|contactListId)/i.test(k) && v) contactListId = v;
    }
  }

  console.log("Discovered", { contactId, contactListId });
  if (!contactId || !contactListId) {
    statusEl.textContent = "Could not discover contactId/contactListId — check console for keys.";
    return;
  }

  // 5) fetch contact record
  statusEl.textContent = "Loading lead record...";
  let lead;
  try {
    lead = await api(`/api/v2/outbound/contactlists/${encodeURIComponent(contactListId)}/contacts/${encodeURIComponent(contactId)}`);
  } catch (e) {
    console.error("Error fetching contact:", e);
    statusEl.textContent = "Error fetching contact: " + e.message;
    return;
  }
  console.log("Lead record:", lead);
  // Genesys may return the contact at different levels; adapt
  const leadData = lead.data || lead || {};
  renderLead(leadData);
  statusEl.textContent = "Loaded lead.";
})();
