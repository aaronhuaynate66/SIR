// SIR Chrome Extension — Instagram profile extractor
'use strict';

(function () {
  const SKIP = new Set(['explore', 'reels', 'stories', 'direct', 'accounts', 'p', 'tv', 'reel']);

  function getUsername() {
    const m = location.pathname.match(/^\/([^/]+)\/?$/);
    return m && !SKIP.has(m[1]) ? m[1] : null;
  }

  let username = getUsername();
  if (!username) return;

  let attempts = 0;
  const MAX    = 12;

  function tryExtract() {
    attempts++;
    if (attempts > MAX) return;

    const data = extractInstagram(username);
    if (!data.name && !data.username) {
      setTimeout(tryExtract, 1000);
      return;
    }

    const cacheKey = data.instagram_url;

    checkCache(cacheKey, cached => {
      if (cached) return;
      getSIRToken(token => {
        if (!token) return;
        showBanner(data.name || data.username, (onSuccess, onError) => {
          sendToSIR(data, 'instagram', onSuccess, onError);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryExtract, 2500));
  } else {
    setTimeout(tryExtract, 2500);
  }

  // SPA navigation listener
  let lastPath = location.pathname;
  const navObserver = new MutationObserver(() => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    const newUser = getUsername();
    if (newUser && newUser !== username) {
      username = newUser;
      attempts = 0;
      setTimeout(tryExtract, 2500);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });

  // ── Extraction logic ────────────────────────────────────────────────────────

  function extractInstagram(uname) {
    const data = {
      username:      uname,
      instagram_url: `https://www.instagram.com/${uname}/`,
    };

    // Name — Instagram renders it in h1 inside header
    const headerEl = document.querySelector('header, main header');
    const h2El     = headerEl?.querySelector('h2') ?? document.querySelector('h2');
    const h1El     = headerEl?.querySelector('h1') ?? document.querySelector('h1');
    data.name = (h1El || h2El)?.textContent?.trim() || uname;

    // Bio — look for the typical bio container
    const bioCandidates = [
      document.querySelector('span[class*="_aacl"]'),
      document.querySelector('div[class*="_aad7"] span'),
      // Fallback: find a span in header that has substantial text
      ...(headerEl
        ? Array.from(headerEl.querySelectorAll('span')).filter(el => {
            const t = el.textContent.trim();
            return t.length > 15 && t.length < 300 && !el.querySelector('span');
          })
        : []),
    ];
    for (const el of bioCandidates) {
      const text = el?.textContent?.trim();
      if (text && text.length > 10) { data.bio = text; break; }
    }

    // Stats (followers / following)
    const statEls = document.querySelectorAll('header ul li, header li');
    const statTexts = Array.from(statEls)
      .map(li => li.textContent?.trim())
      .filter(t => t && /[\d.,kmKM]/.test(t))
      .slice(0, 2);
    if (statTexts.length >= 2) {
      data.followers = statTexts[0];
      data.following  = statTexts[1];
    }

    // External link in bio
    const linkEl = headerEl?.querySelector('a[href]:not([href*="instagram.com/"])');
    if (linkEl?.href) data.website = linkEl.href;

    return data;
  }
})();
