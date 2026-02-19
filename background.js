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
    // Opening via chrome.tabs.create bypasses the window.open override in inject.js
    chrome.tabs.create({ url: request.url, active: true });
    sendResponse({ success: true });
  }

});