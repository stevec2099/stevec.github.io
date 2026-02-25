(async function () {
  const BACKEND_BASE = "https://telkom-lead-backend.vercel.app"; // ✅ your Vercel app
  const statusEl = document.getElementById("status");
  const grid = document.getElementById("grid");

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

    // try parse JSON for nicer errors
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg = data?.error ? data.error : text;
      throw new Error(msg);
    }
    return data;
  }

  // conversationId is passed from Genesys widget URL
  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("conversationId");

  if (!conversationId) {
    statusEl.textContent = "Missing conversationId in URL (Genesys widget must pass it).";
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
