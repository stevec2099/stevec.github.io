(async function () {
  const BACKEND_BASE = "https://telkom-lead-backend.vercel.app";
  const statusEl = document.getElementById("status");
  const grid = document.getElementById("grid");

  function isUuid36(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  }

  function getConversationIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    // Accept common variants (Genesys widgets differ)
    let raw =
      params.get("conversationid") ||
      params.get("conversationId") ||
      params.get("pcConversationId") ||
      params.get("gcConversationId");

    if (!raw) return null;

    // URLSearchParams usually decodes, but we defensively decode again
    try { raw = decodeURIComponent(raw); } catch (_) {}

    // If token wasn't substituted, it might come through like "{{gcConversationId}}"
    // or URL-encoded "%7B%7BgcConversationId%7D%7D"
    raw = raw.replace(/[{}]/g, "").trim();

    // Sometimes it might be embedded with extra text; extract the first UUID if present
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return m[0];

    // Otherwise only accept if it is already a UUID
    return isUuid36(raw) ? raw : raw;
  }

  function renderLead(lead) {
    const fields = [
      ["Service Name", lead["Campaign Name"] ?? lead["Campaign_Name"] ?? lead["Campaign"]],
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

  async function loadFromBackend(conversationId) {
    const url = `${BACKEND_BASE}/api/lead?conversationId=${encodeURIComponent(conversationId)}`;
    const res = await fetch(url);
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg = data?.error ? data.error : text;
      throw new Error(msg);
    }
    return data;
  }

  const conversationId = getConversationIdFromUrl();

  if (!conversationId || !isUuid36(conversationId)) {
    statusEl.textContent =
      `Bad/missing conversationId. Received: "${conversationId ?? ""}". ` +
      `Your widget URL token is not being substituted. ` +
      `Try using conversationid={{pcConversationId}} in the Genesys widget URL.`;
    return;
  }

  statusEl.textContent = `Conversation: ${conversationId} — loading lead…`;

  try {
    const data = await loadFromBackend(conversationId);
    const leadData = data.lead?.data || data.lead || {};
    renderLead(leadData);
    statusEl.textContent = "Loaded lead.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message || err}`;
  }
})();
