// SIR Chrome Extension — Background Service Worker (Manifest V3)
'use strict';

const SIR_API = 'https://sir.marlabinc.com';

// In-session dedup cache (by social URL or name)
const sentCache = new Set();

// ─── Message router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ENRICH_PERSON') {
    handleEnrich(message.data, message.source)
      .then(result => sendResponse({ ok: true, ...result }))
      .catch(err  => sendResponse({ ok: false, error: err.message }));
    return true; // keep channel open for async response
  }

  if (message.type === 'CHECK_CACHE') {
    sendResponse({ cached: sentCache.has(message.url) });
    return false;
  }

  if (message.type === 'GET_TOKEN') {
    chrome.storage.local.get(['sir_token'], result => {
      sendResponse({ token: result['sir_token'] ?? null });
    });
    return true;
  }
});

// ─── External messages (from sir.marlabinc.com via connect_bridge.js) ─────────

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SIR_CONNECT' && typeof message.token === 'string') {
    chrome.storage.local.set({ sir_token: message.token }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

// ─── Core handler ─────────────────────────────────────────────────────────────

async function handleEnrich(data, source) {
  const cacheKey = data.linkedin_url || data.instagram_url || data.name;

  const stored = await chrome.storage.local.get(['sir_token']);
  const token  = stored['sir_token'];
  if (!token) throw new Error('No conectado — abre la extensión para conectar tu cuenta SIR');

  const resp = await fetch(`${SIR_API}/api/people/enrich`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data, source }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err['error'] || `HTTP ${resp.status}`);
  }

  const result = await resp.json();

  if (cacheKey) sentCache.add(cacheKey);

  // Persist recent captures (max 5)
  const recent = await chrome.storage.local.get(['sir_recent']);
  const list   = recent['sir_recent'] ?? [];
  list.unshift({ ...data, ...result, source, ts: Date.now() });
  await chrome.storage.local.set({ sir_recent: list.slice(0, 5) });

  return result;
}
