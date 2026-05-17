// SIR Chrome Extension — Shared utilities for content scripts
'use strict';

const SIR_BANNER_ID = 'sir-capture-banner';

function getSIRToken(cb) {
  chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, res => cb(res?.token ?? null));
}

function checkCache(url, cb) {
  chrome.runtime.sendMessage({ type: 'CHECK_CACHE', url }, res => cb(res?.cached ?? false));
}

function showBanner(name, onConfirm) {
  const existing = document.getElementById(SIR_BANNER_ID);
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = SIR_BANNER_ID;
  banner.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'right:24px',
    'z-index:2147483647',
    'background:#1a1a2e',
    'border:1px solid #6c63ff',
    'border-radius:12px',
    'padding:16px 20px',
    'color:#fff',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'font-size:14px',
    'box-shadow:0 8px 32px rgba(108,99,255,0.35)',
    'max-width:320px',
    'line-height:1.4',
  ].join(';');

  banner.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
      '<span style="font-size:20px">🧠</span>' +
      '<span style="font-weight:600;color:#a78bfa">SIR detectó un perfil</span>' +
      '<button id="sir-x" style="margin-left:auto;background:none;border:none;color:#6b7280;cursor:pointer;font-size:16px;line-height:1">✕</button>' +
    '</div>' +
    '<p id="sir-msg" style="margin:0 0 12px;color:#d1d5db">' +
      '¿Guardar a <strong style="color:#fff">' + escapeHtml(name) + '</strong> en tu red?' +
    '</p>' +
    '<div id="sir-btns" style="display:flex;gap:8px">' +
      '<button id="sir-ok" style="flex:1;background:#6c63ff;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;padding:8px 12px;cursor:pointer">Guardar ✓</button>' +
      '<button id="sir-no" style="background:transparent;border:1px solid #4b5563;border-radius:8px;color:#9ca3af;font-size:13px;padding:8px 12px;cursor:pointer">Omitir</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById('sir-ok').onclick = () => {
    document.getElementById('sir-msg').textContent = 'Guardando…';
    document.getElementById('sir-btns').style.display = 'none';
    onConfirm(
      (_result) => {
        document.getElementById('sir-msg').textContent = '✓ Guardado en SIR';
        document.getElementById('sir-msg').style.color = '#34d399';
        setTimeout(() => banner.remove(), 2200);
      },
      (errMsg) => {
        document.getElementById('sir-msg').textContent = '✗ ' + errMsg;
        document.getElementById('sir-msg').style.color = '#f87171';
        setTimeout(() => banner.remove(), 3000);
      }
    );
  };

  document.getElementById('sir-no').onclick = () => banner.remove();
  document.getElementById('sir-x').onclick  = () => banner.remove();

  setTimeout(() => { if (banner.isConnected) banner.remove(); }, 25000);
}

function sendToSIR(data, source, onSuccess, onError) {
  chrome.runtime.sendMessage(
    { type: 'ENRICH_PERSON', data, source },
    res => {
      if (res?.ok) onSuccess(res);
      else onError(res?.error || 'Error desconocido');
    }
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
