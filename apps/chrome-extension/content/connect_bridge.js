// SIR Chrome Extension — Bridge between sir.marlabinc.com connect page and extension
// Runs as content script on https://sir.marlabinc.com/*
'use strict';

// Listen for token event fired by the connect page
window.addEventListener('sir-connect-token', (event) => {
  const token = event.detail?.token;
  if (typeof token !== 'string' || token.length < 20) return;

  chrome.runtime.sendMessage({ type: 'SIR_CONNECT', token }, (res) => {
    if (res?.ok) {
      // Notify the page that connection succeeded
      window.dispatchEvent(new CustomEvent('sir-connect-result', { detail: { ok: true } }));
    }
  });
});
