// wg bg worker - menus, dnr, cookies, rss proxy

// DNR rule ID for User-Agent switcher (Ad Blocker removed in v3.1)
const UA_RULE_ID = 2001;
const FOCUS_BLOCK_RULE_BASE = 3000;
const FOCUS_BLOCK_RULE_LIMIT = 200;
let lastFocusPhaseNotification = 'idle';

function getFocusRuleIds() {
  return Array.from({ length: FOCUS_BLOCK_RULE_LIMIT }, (_, idx) => FOCUS_BLOCK_RULE_BASE + idx);
}

function normalizeBlockedHost(raw) {
  const normalized = String(raw || '').trim().toLowerCase();
  if (!normalized) return '';

  const withoutProto = normalized.replace(/^https?:\/\//, '');
  const host = withoutProto.split('/')[0].replace(/^\*+\.?/, '').replace(/\.+$/, '');
  return host;
}

function buildFocusBlockRules(entries) {
  const uniqueHosts = [...new Set((entries || []).map(normalizeBlockedHost).filter(Boolean))].slice(0, FOCUS_BLOCK_RULE_LIMIT);

  return uniqueHosts.map((host, idx) => ({
    id: FOCUS_BLOCK_RULE_BASE + idx,
    priority: 10,
    action: { type: 'block' },
    condition: {
      urlFilter: `||${host}^`,
      resourceTypes: ['main_frame', 'sub_frame']
    }
  }));
}

function updateFocusBlockRules(active) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['focusBlockedSites'], (data) => {
      const addRules = active ? buildFocusBlockRules(data.focusBlockedSites || []) : [];
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: getFocusRuleIds(), addRules },
        () => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve({ success: true, count: addRules.length });
        }
      );
    });
  });
}

function notifyFocusTransition(state) {
  if (!state || !state.isRunning || state.isPaused) return;
  if (state.phase === lastFocusPhaseNotification) return;

  lastFocusPhaseNotification = state.phase;

  if (!chrome.notifications || !chrome.notifications.create) return;

  const isBreak = state.phase === 'break';
  const title = isBreak ? 'WebGrenade Focus: Break Time' : 'WebGrenade Focus: Focus Time';
  const message = isBreak
    ? 'Focus session finished. Time for a break.'
    : 'Break finished. Back to focus.';

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title,
    message
  }, () => {});
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen || !chrome.offscreen.createDocument) {
    return { success: false, error: 'Offscreen API unavailable' };
  }

  try {
    if (chrome.offscreen.hasDocument) {
      const exists = await chrome.offscreen.hasDocument();
      if (exists) return { success: true };
    }

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Maintain Pomodoro timer while service worker sleeps.'
    });

    return { success: true };
  } catch (error) {
    const msg = String(error?.message || 'Unknown offscreen error');
    if (msg.includes('Only a single offscreen')) {
      return { success: true };
    }
    return { success: false, error: msg };
  }
}

async function sendFocusCommand(command, payload) {
  const ready = await ensureOffscreenDocument();
  if (!ready.success) return ready;

  try {
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen-focus',
      command,
      payload: payload || {}
    });
    return response || { success: false, error: 'No offscreen response' };
  } catch (error) {
    return { success: false, error: String(error?.message || error) };
  }
}

function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}


/* Context menus */


chrome.runtime.onInstalled.addListener(() => {
  // Remove any stale menus first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "fake-filler-menu",
      title: "🪄 Fill with fake data",
      contexts: ["editable"]
    });

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

  if (info.menuItemId === "fake-filler-menu") {
    chrome.tabs.sendMessage(tab.id, { action: "fillFakeData" }).catch(() => {});
    return;
  }

  if (engines[info.menuItemId] && info.srcUrl) {
    chrome.tabs.create({ url: engines[info.menuItemId] + encodeURIComponent(info.srcUrl) });
  }
});


/* Message routing */


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // fetch cookies
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      sendResponse({ cookies: cookies });
    });
    return true;
  }

  // set cookie (MV3 strict)
  if (request.action === 'setCookie') {
    const { url, name, value, domain, path, secure, httpOnly, sameSite, expirationDate } = request.cookie;

    // clean up samesite to avoid MV3 throwing
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

    // drop domain for host-only
    if (domain && domain.startsWith('.')) {
      cookieDetails.domain = domain;
    }

    // skip expiration for session cookies
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

  // delete cookie
  if (request.action === 'deleteCookie') {
    chrome.cookies.remove({ url: request.url, name: request.name }, (details) => {
      sendResponse({ success: true, details });
    });
    return true;
  }

  // nuke all cookies for domain
  if (request.action === 'deleteAllCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      let pending = cookies.length; // track callbacks
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

  // proxy RSS fetch to bypass CORS
  if (request.action === 'fetchRSS') {
    fetchWithTimeout(request.url, {
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
    })
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

  // proxy HTML fetch for rss auto-discovery
  if (request.action === 'fetchHTML') {
    fetchWithTimeout(request.url, {
      headers: { 'Accept': 'text/html, */*' }
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(htmlText => sendResponse({ htmlText }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  // DNR based UA switcher
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
          urlFilter: '|http',
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

  // history clear req
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

  // open whitelisted popup
  if (request.action === 'open_allowed_popup' && request.url) {
    chrome.tabs.create({ url: request.url, active: true });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'addTemporaryPopupWhitelist' && request.url) {
    const now = Date.now();
    const ttlMs = Number.isFinite(request.ttlMs) ? Math.max(1000, request.ttlMs) : 120000;
    const expiresAt = now + ttlMs;

    let parsed;
    try {
      parsed = new URL(request.url);
    } catch (_) {
      sendResponse({ success: false, error: 'Invalid URL' });
      return true;
    }

    chrome.storage.local.get(['popupTempWhitelist'], (data) => {
      const existing = Array.isArray(data.popupTempWhitelist) ? data.popupTempWhitelist : [];
      const filtered = existing.filter((entry) => entry && entry.expiresAt && entry.expiresAt > now);

      filtered.push({
        url: parsed.href,
        domain: parsed.hostname,
        expiresAt
      });

      chrome.storage.local.set({ popupTempWhitelist: filtered }, () => {
        sendResponse({ success: true, expiresAt });
      });
    });
    return true;
  }

  if (request.action === 'focusTimerCommand') {
    sendFocusCommand(request.command, request.payload || {})
      .then(async (result) => {
        if (!result?.success) {
          sendResponse(result || { success: false, error: 'Focus command failed' });
          return;
        }

        if (result.state) {
          await chrome.storage.local.set({ focusTimerState: result.state });
          const shouldBlock = result.state.isRunning && !result.state.isPaused && result.state.phase === 'focus';
          await updateFocusBlockRules(shouldBlock);

          if (!result.state.isRunning) {
            lastFocusPhaseNotification = 'idle';
          } else {
            notifyFocusTransition(result.state);
          }
        }

        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({ success: false, error: String(error?.message || error) });
      });
    return true;
  }

  if (request.action === 'focusPhaseChanged' && request.state) {
    chrome.storage.local.set({ focusTimerState: request.state }, async () => {
      const shouldBlock = request.state.isRunning && !request.state.isPaused && request.state.phase === 'focus';
      const blockResult = await updateFocusBlockRules(shouldBlock);
      if (!request.state.isRunning) {
        lastFocusPhaseNotification = 'idle';
      } else {
        notifyFocusTransition(request.state);
      }
      sendResponse({ success: true, blockResult });
    });
    return true;
  }

  if (request.action === 'focusSyncBlocking') {
    sendFocusCommand('getState', {})
      .then(async (result) => {
        if (!result?.success || !result.state) {
          sendResponse(result || { success: false, error: 'No focus state available' });
          return;
        }

        const shouldBlock = result.state.isRunning && !result.state.isPaused && result.state.phase === 'focus';
        const blockResult = await updateFocusBlockRules(shouldBlock);
        sendResponse({ success: true, state: result.state, blockResult });
      })
      .catch((error) => {
        sendResponse({ success: false, error: String(error?.message || error) });
      });
    return true;
  }

  // Genius search API (no auth needed)
  //
  // Uses genius.com/api/search/multi (public, no key required, cross-browser).
  // Cleans the query with a noise-stripping regex before sending.
  // Returns: { url, title, artist } of the first type==='song' hit.
  if (request.action === 'searchGenius') {
    const rawQuery = String(request.query || '').trim();
    if (!rawQuery) { sendResponse({ error: 'Empty query' }); return true; }

    // strip junk from song titles to improve match rate
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

  // fetch genius HTML page for scraping
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

  // Firefox eyedropper polyfill req
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

  // track blocked popup stat
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