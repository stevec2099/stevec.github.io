(async function () {
  const BACKEND_BASE = "https://telkom-lead-backend.vercel.app";

  const statusEl = document.getElementById("status");
  const grid = document.getElementById("grid");
  const serviceNameEl = document.getElementById("serviceName");

  function isUuid36(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  }

  function getConversationIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    let raw =
      params.get("conversationid") ||
      params.get("conversationId") ||
      params.get("pcConversationId") ||
      params.get("gcConversationId");

    if (!raw) return null;
    try { raw = decodeURIComponent(raw); } catch (_) {}
    raw = raw.replace(/[{}]/g, "").trim();

    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return m[0];
    return raw;
  }

  // Simple white-line SVG icons (match the mock vibe)
  const ICONS = {
    lead: `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="14" height="14" rx="2" stroke="white" stroke-width="2" opacity=".95"/>
        <path d="M8 9h6M8 13h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M18 10h2M19 9v2" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    campaign: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 11v2l11 4V7L3 11Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M14 9l6-3v12l-6-3" stroke="white" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `,
    customer: `
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.2" stroke="white" stroke-width="2"/>
        <path d="M5 20c1.6-4 11.4-4 14 0" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    deal: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 7h10v10H7V7Z" stroke="white" stroke-width="2" opacity=".95"/>
        <path d="M9.5 12.5l2 2 4-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 20h14" stroke="white" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      </svg>
    `,
    phone: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6.5 3.8l2.4-.6 2 5-1.7 1.2c1.3 2.6 3.4 4.7 6 6l1.2-1.7 5 2-.6 2.4c-.2.8-.9 1.4-1.8 1.4C10.3 21.9 2.1 13.7 3.1 5.6c0-.9.6-1.6 1.4-1.8Z"
          stroke="white" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `,
    id: `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="white" stroke-width="2"/>
        <circle cx="9" cy="12" r="2" stroke="white" stroke-width="2"/>
        <path d="M13 10h5M13 14h5" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    email: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16v10H4V7Z" stroke="white" stroke-width="2" opacity=".95"/>
        <path d="M4.5 7.5 12 13l7.5-5.5" stroke="white" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `
  };

  function makeField({ label, value, icon }) {
    const v = (value ?? "").toString().trim();

    const el = document.createElement("div");
    el.className = "field";

    el.innerHTML = `
      <div class="field-label">${label.toUpperCase()}</div>
      <div class="field-row">
        <div class="tile" aria-hidden="true">${icon}</div>
        <div class="value ${v ? "" : "empty"}">${v || "—"}</div>
      </div>
    `;
    return el;
  }

  async function loadFromBackend(conversationId) {
    const url = `${BACKEND_BASE}/api/lead?conversationId=${encodeURIComponent(conversationId)}`;
    const res = await fetch(url);
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) throw new Error(data?.error || text);
    return data;
  }

  const conversationId = getConversationIdFromUrl();
  if (!conversationId || !isUuid36(conversationId)) {
    statusEl.textContent = `Bad/missing conversationId: "${conversationId ?? ""}"`;
    return;
  }

  statusEl.textContent = `Conversation: ${conversationId} — loading…`;

  try {
    const data = await loadFromBackend(conversationId);
    const lead = data.lead?.data || data.lead || {};

    // Service Name in the top pill
    const serviceName =
      lead["Campaign Name"] ??
      lead["Campaign_Name"] ??
      lead["Campaign"] ??
      "";

    serviceNameEl.textContent = (serviceName || "—").toString();

    // Render fields (2 columns like your mock)
    const fields = [
      { label: "Lead ID", value: lead["LEAD_ID"] || lead["lead_id"] || lead["id"], icon: ICONS.lead },
      { label: "Campaign", value: lead["CAMPAIGN"], icon: ICONS.campaign },

      { label: "Customer", value: lead["CUSTOMER"], icon: ICONS.customer },
      { label: "Deal_Name", value: lead["DEAL_NAME"], icon: ICONS.deal },

      { label: "Alternate Number", value: lead["ALTERNATE_NUMBER"], icon: ICONS.phone },
      { label: "Contact_Number", value: lead["CONTACT_NUMBER"], icon: ICONS.phone },

      { label: "ID_Number", value: lead["ID_NUMBER"], icon: ICONS.id },
      { label: "Email", value: lead["EMAIL"], icon: ICONS.email },
    ];

    grid.innerHTML = "";
    for (const f of fields) grid.appendChild(makeField(f));

    statusEl.textContent = "Loaded lead.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message || err}`;
  }
})();
