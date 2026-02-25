const params = new URLSearchParams(window.location.search);

let conversationId =
  params.get("conversationid") ||
  params.get("conversationId"); // keep both

// decode and strip braces if anything weird comes through
if (conversationId) {
  conversationId = decodeURIComponent(conversationId).replace(/[{}]/g, "").trim();
}

// hard validate UUID
const uuid36 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!conversationId || !uuid36.test(conversationId)) {
  statusEl.textContent = `Bad conversationId received: "${conversationId}"`;
  return;
}
