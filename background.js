/**
 * WebGrenade v3.1 - Background Service Worker
 * Handles Context Menus, DNR Rules, Cookies, RSS Fetching,
 * History Cleaning, and User-Agent Switching.
 * Cross-browser: Chrome MV3 (service_worker) + Firefox MV3 (scripts)
 */

// DNR rule ID for User-Agent switcher (Ad Blocker removed in v3.1)
const UA_RULE_ID = 2001;

// ============================================================================
// 1. CONTEXT MENUS — Reverse Image Search (6 engines)
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  // Remove any stale menus first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "search-image-parent",
      title: "🔍 Search Image on...",
      contexts: ["image"]
    });

    const engines = [
      { id: "google", title: "Google Lens", url: "https://lens.google.com/uploadbyurl?url=" },
      { id: "bing", title: "Bing", url: "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=" },
      { id: "yandex", title: "Yandex", url: "https://yandex.com/images/search?rpt=imageview&url=" },
      { id: "tineye", title: "TinEye", url: "https://tineye.com/search?url=" },
      { id: "baidu", title: "Baidu", url: "https://graph.baidu.com/details?isfromtusoupc=1&tn=pc&carousel=0&image=" },
      { id: "sogou", title: "Sogou", url: "https://pic.sogou.com/ris?query=" }
    ];

    engines.forEach(engine => {
      chrome.contextMenus.create({
        parentId: "search-image-parent",
        id: engine.id,
        title: engine.title,
        contexts: ["image"]
      });
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const engines = {
    google: "https://lens.google.com/uploadbyurl?url=",
    bing: "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=",
    yandex: "https://yandex.com/images/search?rpt=imageview&url=",
    tineye: "https://tineye.com/search?url=",
    baidu: "https://graph.baidu.com/details?isfromtusoupc=1&tn=pc&carousel=0&image=",
    sogou: "https://pic.sogou.com/ris?query="
  };

  if (engines[info.menuItemId] && info.srcUrl) {
    chrome.tabs.create({ url: engines[info.menuItemId] + encodeURIComponent(info.srcUrl) });
  }
});

// ============================================================================
// 2. MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // --- Cookie: Get ---
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      sendResponse({ cookies: cookies });
    });
    return true;
  }

  // --- Cookie: Set ---
  if (request.action === 'setCookie') {
    const { url, name, value, domain, path, secure, httpOnly, sameSite, expirationDate } = request.cookie;

    // Build clean cookie object — only include supported SameSite values
    const validSameSite = ['no_restriction', 'lax', 'strict', 'unspecified'];
    const cookieDetails = {
      url: url,
      name: name,
      value: value,
      path: path || '/',
      secure: !!secure,
      httpOnly: !!httpOnly,
      sameSite: validSameSite.includes(sameSite) ? sameSite : 'lax'
    };

    // Only set domain if it's a non-host-only cookie (avoids MV3 errors)
    if (domain && domain.startsWith('.')) {
      cookieDetails.domain = domain;
    }

    // Only set expirationDate for persistent cookies
    if (expirationDate && !request.cookie.session) {
      cookieDetails.expirationDate = expirationDate;
    }

    chrome.cookies.set(cookieDetails, (cookie) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, cookie });
      }
    });
    return true;
  }

  // --- Cookie: Delete ---
  if (request.action === 'deleteCookie') {
    chrome.cookies.remove({ url: request.url, name: request.name }, (details) => {
      sendResponse({ success: true, details });
    });
    return true;
  }

  // --- Cookie: Delete All ---
  if (request.action === 'deleteAllCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      let pending = cookies.length;
      if (pending === 0) { sendResponse({ success: true, count: 0 }); return; }
      cookies.forEach(cookie => {
        chrome.cookies.remove({ url: request.url, name: cookie.name }, () => {
          pending--;
          if (pending === 0) sendResponse({ success: true, count: cookies.length });
        });
      });
    });
    return true;
  }

  // --- RSS Fetcher: Return raw text, let popup parse via DOMParser ---
  if (request.action === 'fetchRSS') {
    fetch(request.url, { headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(rawText => {
        sendResponse({ rawText: rawText });
      })
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  // --- RSS Auto-Discovery: Fetch raw HTML of a site URL to scan for <link rel="alternate"> ---
  if (request.action === 'fetchHTML') {
    fetch(request.url, { headers: { 'Accept': 'text/html, */*' } })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(htmlText => sendResponse({ htmlText }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  // --- User-Agent Switcher: Modify User-Agent request header via DNR ---
  if (request.action === 'setUserAgent') {
    if (request.ua && request.ua !== 'default') {
      const rule = {
        id: UA_RULE_ID,
        priority: 2,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'User-Agent', operation: 'set', value: request.ua }
          ]
        },
        condition: {
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'image', 'stylesheet', 'font', 'media', 'websocket']
        }
      };
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: [UA_RULE_ID], addRules: [rule] },
        () => sendResponse({ success: true })
      );
    } else {
      // Remove the UA rule (restore default)
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: [UA_RULE_ID], addRules: [] },
        () => sendResponse({ success: true })
      );
    }
    return true;
  }

  // --- History Cleaner: Nuke all history entries matching a domain/URL ---
  if (request.action === 'nukeHistory') {
    if (!chrome.history) {
      sendResponse({ success: false, error: 'History API not available' });
      return true;
    }
    const query = request.query || '';
    chrome.history.search({ text: query, maxResults: 10000, startTime: 0 }, (results) => {
      if (!results || results.length === 0) {
        sendResponse({ success: true, count: 0 });
        return;
      }
      // Filter to only entries that actually contain the query string
      const matching = results.filter(item =>
        item.url && item.url.toLowerCase().includes(query.toLowerCase())
      );
      if (matching.length === 0) {
        sendResponse({ success: true, count: 0 });
        return;
      }
      let pending = matching.length;
      matching.forEach(item => {
        chrome.history.deleteUrl({ url: item.url }, () => {
          pending--;
          if (pending === 0) {
            sendResponse({ success: true, count: matching.length });
          }
        });
      });
    });
    return true;
  }

  // ── POPUP BLOCKER: open an allowed URL that the user chose to unblock ─────
  if (request.action === 'open_allowed_popup' && request.url) {
    chrome.tabs.create({ url: request.url, active: true });
    sendResponse({ success: true });
  }

  // ── GENIUS LYRICS (v3.2.2): Step 1 — Search via JSON API ──────────────────────────
  //
  // Uses genius.com/api/search/multi (public, no key required, cross-browser).
  // Cleans the query with a noise-stripping regex before sending.
  // Returns: { url, title, artist } of the first type==='song' hit.
  if (request.action === 'searchGenius') {
    const rawQuery = String(request.query || '').trim();
    if (!rawQuery) { sendResponse({ error: 'Empty query' }); return true; }

    // — Noise stripping: remove common YouTube/Streaming suffixes from title —
    const cleanedQuery = rawQuery
      // Parenthetical/bracket junk
      .replace(/\s*[\[(]\s*(official\s*(music\s*)?video|official\s*audio|audio|lyric[s]?|lyrics video|live|acoustic|visualizer|explicit|clean|hq|hd|4k|slowed|reverb|nightcore|extended|instrumental|karaoke|cover|remix|original\s*mix|feat\.|ft\.|with\s+\w+|bonus\s*track)[\])]?\s*/gi, ' ')
      // feat. / ft. inline (outside brackets)
      .replace(/\s+(feat\.|ft\.)\s+[^\[\]()|]+/gi, '')
      // Dash-suffix patterns: "Song - Topic", "Song - Official"
      .replace(/\s+[-\u2013\u2014]+\s+(topic|official|audio|lyrics?|visualizer|live|music\s*video)\s*$/i, '')
      // Trailing year (e.g. 2024)
      .replace(/\s+\d{4}\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const apiUrl = 'https://genius.com/api/search/multi?per_page=5&q=' + encodeURIComponent(cleanedQuery);

    fetch(apiUrl, {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(r => {
        if (!r.ok) throw new Error('Genius API HTTP ' + r.status);
        return r.json();
      })
      .then(json => {
        // json.response.sections is an array of { type, hits[] }
        const sections = json?.response?.sections || [];
        let songHit = null;

        // Strict: only accept hits where type === 'song'
        for (const section of sections) {
          for (const hit of (section.hits || [])) {
            if (hit.type === 'song' && hit.result?.url) {
              songHit = hit.result;
              break;
            }
          }
          if (songHit) break;
        }

        if (!songHit) {
          sendResponse({ error: 'No song result found for: ' + cleanedQuery });
          return;
        }

        sendResponse({
          url: songHit.url,
          title: songHit.title || '',
          artist: songHit.primary_artist?.name || '',
          cleanedQuery
        });
      })
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  // ── GENIUS LYRICS (v3.2.2): Step 2 — Fetch lyrics page HTML ───────────────────────────
  //
  // Fetches the raw HTML of a Genius lyrics page.
  // popup.js parses it with DOMParser to extract [data-lyrics-container] text.
  if (request.action === 'fetchGeniusLyricsPage') {
    const url = String(request.url || '').trim();
    if (!url || !url.startsWith('https://genius.com/')) {
      sendResponse({ error: 'Invalid Genius URL' }); return true;
    }
    fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(html => sendResponse({ html }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  // ── EYEDROPPER POLYFILL: capture the visible tab as a PNG data-URL ──────────
  // Used by content.js to draw a full-viewport canvas for Firefox color picking.
  if (request.action === 'captureTab') {
    const tabId = sender.tab ? sender.tab.id : null;
    const windowId = sender.tab ? sender.tab.windowId : chrome.windows.WINDOW_ID_CURRENT;
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    return true;
  }

  // ── POPUP BLOCKER: increment per-domain blocked count in storage ────────
  // content.js relays this from inject.js (main world cannot access chrome.storage).
  if (request.action === 'incrementBlockedCount') {
    const domain = request.domain || '';
    if (!domain) { sendResponse({ success: false }); return true; }
    chrome.storage.local.get(['blockedCounts'], (data) => {
      const counts = data.blockedCounts || {};
      counts[domain] = (counts[domain] || 0) + 1;
      chrome.storage.local.set({ blockedCounts: counts }, () => {
        sendResponse({ success: true, count: counts[domain] });
      });
    });
    return true;
  }

});