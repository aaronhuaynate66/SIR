// SIR Chrome Extension — LinkedIn profile extractor
'use strict';

(function () {
  if (!/^\/in\/[^/]+\/?(\?.*)?$/.test(location.pathname)) return;

  let attempts = 0;
  const MAX    = 12;

  const currentProfileUrl = 'https://www.linkedin.com' +
    location.pathname.split('?')[0].replace(/\/$/, '');

  function isOwnProfile() {
    // Elements that only appear when viewing your own LinkedIn profile
    return !!(
      document.querySelector('button[aria-label="Edit intro"]') ||
      document.querySelector('button[data-control-name="edit_intro"]') ||
      document.querySelector('a[href*="/in/edit"]') ||
      document.querySelector('[data-view-name="profile-card-edit-button"]')
    );
  }

  function tryExtract() {
    attempts++;
    if (attempts > MAX) return;

    const data = extractLinkedIn();
    if (!data.name) {
      setTimeout(tryExtract, 1000);
      return;
    }

    if (isOwnProfile()) {
      // Auto-save own profile URL to users.linkedin_url
      getSIRToken(token => {
        if (!token) return;
        fetch('https://sir.marlabinc.com/api/user/social', {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + token },
        })
          .then(r => r.ok ? r.json() : null)
          .then(stored => {
            if (stored?.linkedin_url === currentProfileUrl) return; // already saved
            return fetch('https://sir.marlabinc.com/api/user/social', {
              method: 'PATCH',
              headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
              body: JSON.stringify({ linkedin_url: currentProfileUrl }),
            });
          })
          .then(r => {
            if (r && r.ok) showOwnProfileToast();
          })
          .catch(() => {/* silent */});
      });
      return;
    }

    // Contact profile — existing capture flow
    const cacheKey = data.linkedin_url;
    checkCache(cacheKey, cached => {
      if (cached) return;
      getSIRToken(token => {
        if (!token) return;
        showBanner(data.name, (onSuccess, onError) => {
          sendToSIR(data, 'linkedin', onSuccess, onError);
        });
      });
    });
  }

  function showOwnProfileToast() {
    if (document.getElementById('sir-own-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'sir-own-toast';
    toast.textContent = '✓ SIR — Tu perfil LinkedIn guardado';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', left: '50%',
      transform: 'translateX(-50%)',
      background: '#1e1b4b', color: '#a5b4fc',
      padding: '10px 18px', borderRadius: '8px',
      fontSize: '13px', fontWeight: '600',
      zIndex: '99999', border: '1px solid #6366f1',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      transition: 'opacity 0.4s',
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
  }

  // Wait for DOM after React hydration
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryExtract, 2000));
  } else {
    setTimeout(tryExtract, 2000);
  }

  // Handle LinkedIn SPA navigation (URL changes without full page reload)
  let lastPath = location.pathname;
  const navObserver = new MutationObserver(() => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    if (/^\/in\/[^/]+\/?(\?.*)?$/.test(location.pathname)) {
      attempts = 0;
      setTimeout(tryExtract, 2500);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });

  // ── Extraction logic ────────────────────────────────────────────────────────

  function extractLinkedIn() {
    const data = {
      linkedin_url: currentProfileUrl,
    };

    // Name
    const nameEl =
      document.querySelector('h1.text-heading-xlarge') ||
      document.querySelector('h1[class*="heading"]')   ||
      document.querySelector('.pv-text-details__left-panel h1') ||
      document.querySelector('main h1');
    data.name = nameEl?.textContent?.trim() ?? null;

    // Headline → split "Role at Company"
    const hlEl =
      document.querySelector('.text-body-medium.break-words') ||
      document.querySelector('.pv-text-details__left-panel .text-body-medium');
    const headline = hlEl?.textContent?.trim() ?? null;
    if (headline) {
      const m = headline.match(/^(.+?)\s+(?:at|en|@)\s+(.+)$/i);
      if (m) {
        data.role         = m[1].trim();
        data.organization = m[2].trim();
      } else {
        data.role = headline;
      }
    }

    // Location
    const locEl =
      document.querySelector('.pv-text-details__left-panel .text-body-small.inline') ||
      document.querySelector('.text-body-small.inline.t-black--light');
    data.location = locEl?.textContent?.trim() ?? null;

    // Education (first entry)
    const eduSection = document.getElementById('education');
    if (eduSection) {
      const firstEdu = eduSection.querySelector('li.pvs-list__paged-list-item');
      if (firstEdu) {
        const schoolEl =
          firstEdu.querySelector('.mr1.hoverable-link-text span[aria-hidden]') ||
          firstEdu.querySelector('span[aria-hidden="true"]');
        data.education = schoolEl?.textContent?.trim() ?? null;
      }
    }

    // Work history (up to 5)
    const expSection = document.getElementById('experience');
    if (expSection) {
      const items = Array.from(expSection.querySelectorAll('li.pvs-list__paged-list-item')).slice(0, 5);
      const workHistory = [];
      for (const item of items) {
        const spans = Array.from(item.querySelectorAll('span[aria-hidden="true"]'))
          .map(s => s.textContent?.trim())
          .filter(Boolean);
        if (spans.length >= 2) {
          workHistory.push({
            role:    spans[0],
            company: spans[1],
            dates:   spans[2] ?? null,
          });
        }
      }
      if (workHistory.length > 0) data.work_history = workHistory;
    }

    return data;
  }
})();
