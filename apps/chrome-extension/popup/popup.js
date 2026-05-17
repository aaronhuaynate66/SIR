// SIR Chrome Extension — Popup logic
'use strict';

const SIR_URL = 'https://sir.marlabinc.com';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const stored = await chrome.storage.local.get(['sir_token', 'sir_recent', 'sir_auto_capture']);
  const token       = stored['sir_token']       ?? null;
  const recent      = stored['sir_recent']      ?? [];
  const autoCapture = stored['sir_auto_capture'] !== false; // default true

  renderAuth(token);
  renderToggle(autoCapture, token !== null);
  renderRecent(recent);

  // Re-render if storage changes (e.g. token set by connect page)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if ('sir_token' in changes)  renderAuth(changes['sir_token'].newValue ?? null);
    if ('sir_recent' in changes) renderRecent(changes['sir_recent'].newValue ?? []);
  });
}

// ── Auth section ──────────────────────────────────────────────────────────────

function renderAuth(token) {
  const section = document.getElementById('auth-section');

  if (!token) {
    section.innerHTML =
      '<div class="not-connected">' +
        '<p>Conecta tu cuenta SIR para capturar perfiles automáticamente.</p>' +
        '<a href="' + SIR_URL + '/extension/connect" target="_blank" class="btn-primary">Conectar cuenta →</a>' +
        '<div class="paste-row">' +
          '<input class="paste-input" id="token-input" type="password" placeholder="O pega tu token aquí">' +
          '<button class="btn-paste" id="token-save">OK</button>' +
        '</div>' +
      '</div>';

    document.getElementById('token-save').addEventListener('click', async () => {
      const input = document.getElementById('token-input');
      const val   = input.value.trim();
      if (val.length < 20) { input.style.borderColor = '#f87171'; return; }
      await chrome.storage.local.set({ sir_token: val });
      renderAuth(val);
      renderToggle(true, true);
    });

    document.getElementById('toggle-section').classList.add('hidden');
    return;
  }

  // Decode JWT payload for email
  let email = '—';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    email = payload['email'] ?? payload['sub'] ?? '—';
  } catch { /* ignore */ }

  section.innerHTML =
    '<div class="connected">' +
      '<span class="dot green"></span>' +
      '<span class="email">' + escapeHtml(email) + '</span>' +
      '<button class="btn-text" id="disconnect-btn">Desconectar</button>' +
    '</div>';

  document.getElementById('disconnect-btn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['sir_token', 'sir_recent']);
    renderAuth(null);
    renderToggle(false, false);
    renderRecent([]);
  });
}

// ── Toggle section ────────────────────────────────────────────────────────────

function renderToggle(autoCapture, visible) {
  const section = document.getElementById('toggle-section');
  section.classList.toggle('hidden', !visible);

  const toggle = document.getElementById('auto-capture');
  if (!toggle) return;
  toggle.checked = autoCapture;
  // Remove existing listener then re-add
  const fresh = toggle.cloneNode(true);
  toggle.parentNode.replaceChild(fresh, toggle);
  fresh.addEventListener('change', () => {
    chrome.storage.local.set({ sir_auto_capture: fresh.checked });
  });
}

// ── Recent section ────────────────────────────────────────────────────────────

function renderRecent(list) {
  const section = document.getElementById('recent-section');
  const ul      = document.getElementById('recent-list');

  if (!list || list.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  ul.innerHTML = '';

  list.forEach(item => {
    const icon  = item.source === 'linkedin' ? '💼' : '📸';
    const name  = item.name || item.username || 'Persona';
    const slug  = item.slug;
    const href  = slug ? SIR_URL + '/red/' + slug : SIR_URL + '/red';
    const badge = item.action === 'created' ? 'nuevo' : 'actualizado';

    const li = document.createElement('li');
    li.className = 'recent-item';
    li.innerHTML =
      '<a href="' + href + '" target="_blank">' +
        '<span>' + icon + '</span>' +
        '<span class="recent-name">' + escapeHtml(name) + '</span>' +
        '<span class="badge ' + escapeHtml(item.action || 'updated') + '">' + badge + '</span>' +
      '</a>';
    ul.appendChild(li);
  });
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
