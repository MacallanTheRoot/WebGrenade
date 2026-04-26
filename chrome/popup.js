/**
 * WebGrenade v3.0 - Vertical Dashboard
 * Advanced Module System with Persistent Storage + Pro Features
 * Ad Blocker · Dark Mode · Volume Booster · UA Switcher · History Cleaner
 * © 2026 MacallanTheRoot
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

const state = {
  currentUrl: '',
  currentTab: null,
  activeModule: 'media',
  videoData: null,
  apiConfig: {
    key: '',
    host: '',
    configured: false
  }
};

const GENIUS_LYRICS_CACHE_KEY = 'geniusLyricsCache';
const LAST_ACTIVE_MODULE_KEY = 'lastActiveModule';

function isFullViewMode() {
  return new URLSearchParams(window.location.search).get('view') === 'full';
}

function initializeLayoutMode() {
  if (!isFullViewMode()) return;
  document.documentElement.classList.add('wg-fullview');
  document.body.classList.add('wg-fullview');
}

function openFullViewDashboard() {
  const url = chrome.runtime.getURL('popup.html?view=full');
  chrome.tabs.create({ url }).catch(() => {
    showToast('⚠️ Could not open full view', 'warning');
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initializeLayoutMode();

    // Restore saved custom popup height
    await restorePopupHeight();
    
    // Initialize resize handle listener
    initResizer();

    // Load current tab info
    await loadCurrentTab();

    // Load API configuration
    await loadApiConfig();

    // Initialize all modules
    initializeSidebar();
    initializeMediaCenter();
    initializeLinkStation();
    initializeColorStudio();
    initializeSecurityHub();
    initializeCookieManager();
    initializeRSSReader();
    initializeUtilities();
    initializeUtilitiesButtons();
    initializeSettings();
    initializeProFeatures();  // v3.0 Pro Features
    initializeGeniusLyrics(); // Genius Lyrics module
    initializeFakeFiller();   // Fake Input Filler module

    // Show the last visited module (fallback to media)
    const initialModule = await getInitialModule();
    showModule(initialModule);
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.currentTab = tab;
  state.currentUrl = tab.url;

  // Update URL displays
  const urlInputs = document.querySelectorAll('#current-url');
  urlInputs.forEach(input => input.value = state.currentUrl);
}

async function loadApiConfig() {
  const config = await chrome.storage.local.get(['apiKey', 'apiHost']);
  if (config.apiKey && config.apiHost) {
    state.apiConfig.key = config.apiKey;
    state.apiConfig.host = config.apiHost;
    state.apiConfig.configured = true;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showStatus(elementId, message, type) {
  const statusEl = document.getElementById(elementId);
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
  }
}

function hideStatus(elementId) {
  const statusEl = document.getElementById(elementId);
  if (statusEl) {
    statusEl.style.display = 'none';
  }
}

function getPopupModuleContext() {
  return {
    state,
    chrome,
    deps: {
      showToast,
      showStatus,
      hideStatus,
      copyToClipboard,
      formatDate,
      isInjectableUrl,
      sendMessageToAllFrames,
      isYouTubeUrl,
      extractVideoId,
      createEditIconSVG,
      createCloseIconSVG
    }
  };
}

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================
function initializeSidebar() {
  const navBtns = document.querySelectorAll('.sidebar-btn');
  if (!navBtns.length) return;

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showModule(btn.dataset.module);
    });
  });
}

function initializeUtilitiesButtons() {
  // Open Color Studio from Utilities card
  const openColorBtn = document.getElementById('open-color-studio-btn');
  if (openColorBtn) {
    openColorBtn.addEventListener('click', () => {
      showModule('color');
    });
  }
}

function showModule(name) {
  const target = document.querySelector(`.module-content[data-module="${name}"]`);
  if (!target) return;

  state.activeModule = name;

  // reset classes
  document.querySelectorAll('.module-content').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });

  target.style.animation = 'none';
  target.classList.add('active');
  target.style.display = 'block';
  target.style.opacity = '1';
  target.style.visibility = 'visible';
  setTimeout(() => target.style.animation = '', 10);

  // Keep sidebar state aligned even when modules are opened programmatically.
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.module === name);
  });

  chrome.storage.local.set({ [LAST_ACTIVE_MODULE_KEY]: name }).catch(() => {});

  // Module-specific initializers
  const routes = {
    media: () => { checkForYouTubeVideo(); sniffPageVideos(); },
    link: () => generateQRCode(state.currentUrl),
    cookies: loadCookies,
    rss: loadSavedFeeds,
    lyrics: detectMediaMetadataForLyrics,
    utilities: updateBlockedCountBadge
  };
  
  if (routes[name]) routes[name]();
}

async function getInitialModule() {
  const fallback = 'media';
  const stored = await chrome.storage.local.get(LAST_ACTIVE_MODULE_KEY);
  const saved = stored[LAST_ACTIVE_MODULE_KEY];

  if (!saved || typeof saved !== 'string') return fallback;
  const exists = !!document.querySelector(`.module-content[data-module="${saved}"]`);
  return exists ? saved : fallback;
}

// ============================================================================
// MODULE 1: MEDIA CENTER
// ============================================================================

function initializeMediaCenter() {
  window.WGMediaModule?.initialize(getPopupModuleContext());
}

async function sniffPageVideos() {
  return window.WGMediaModule?.sniffPageVideos(getPopupModuleContext());
}

async function checkForYouTubeVideo() {
  return window.WGMediaModule?.checkForYouTubeVideo(getPopupModuleContext());
}

// ============================================================================
// MODULE 2: LINK STATION
// ============================================================================

function initializeLinkStation() {
  const shortenBtn = document.getElementById('shorten-btn');
  const copyBtn = document.getElementById('copy-short-url-btn');
  const downloadQRBtn = document.getElementById('download-qr-btn');
  const apiSelect = document.getElementById('shortener-api');
  const clearHistoryBtn = document.getElementById('clear-link-history-btn');

  shortenBtn?.addEventListener('click', shortenUrl);
  copyBtn?.addEventListener('click', () => copyToClipboard(document.getElementById('shortened-url').value));
  downloadQRBtn?.addEventListener('click', downloadQRCode);
  clearHistoryBtn?.addEventListener('click', clearLinkHistory);

  // Event delegation for link history actions
  const historyList = document.getElementById('link-history-list');
  historyList?.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.link-copy-btn');
    const deleteBtn = e.target.closest('.link-delete-btn');

    if (copyBtn) {
      const url = copyBtn.dataset.url;
      copyToClipboard(url);
    } else if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index);
      deleteLinkHistoryItem(index);
    }
  });

  loadLinkHistory();
}

async function shortenUrl() {
  const url = state.currentUrl;
  const api = document.getElementById('shortener-api').value;

  if (!url) {
    showToast('No URL available', 'error');
    return;
  }

  try {
    let shortUrl = '';

    if (api === 'isgd') {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      const data = await response.json();
      shortUrl = data.shorturl;
    } else if (api === 'tinyurl') {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      shortUrl = await response.text();
    }

    if (shortUrl) {
      document.getElementById('shortened-url').value = shortUrl;
      document.getElementById('shortened-section').style.display = 'block';

      // Generate QR for shortened URL
      generateQRCode(shortUrl);
      document.getElementById('download-qr-btn').style.display = 'block';

      // Add to history
      await addToLinkHistory({
        original: url,
        shortened: shortUrl,
        timestamp: Date.now()
      });

      showToast('✅ URL shortened!', 'success');
      loadLinkHistory();
    }
  } catch (error) {
    console.error('Shorten error:', error);
    showToast('❌ Failed to shorten URL', 'error');
  }
}

function generateQRCode(url) {
  const container = document.getElementById('qr-container');
  if (!container) return;

  container.textContent = '';

  try {
    // Use secure API-based QR code generation (no innerHTML)
    const qrImage = document.createElement('img');
    qrImage.setAttribute('alt', 'QR Code');
    qrImage.setAttribute('width', '200');
    qrImage.setAttribute('height', '200');
    qrImage.style.border = '1px solid #333';
    qrImage.style.borderRadius = '8px';

    // Use QR Server API for secure image generation
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    qrImage.src = apiUrl;
    qrImage.dataset.qrUrl = url; // Store URL for download functionality

    // Add loading state
    qrImage.addEventListener('load', () => {
      qrImage.style.opacity = '1';
    });

    qrImage.addEventListener('error', () => {
      container.textContent = '';
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: #ef4444; font-size: 13px; text-align: center; padding: 20px;';
      errorDiv.textContent = 'Failed to generate QR code';
      container.appendChild(errorDiv);
    });

    qrImage.style.opacity = '0.5';
    container.appendChild(qrImage);
  } catch (error) {
    console.error('QR generation error:', error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'color: #ef4444; font-size: 13px; text-align: center; padding: 20px;';
    errorDiv.textContent = 'Failed to generate QR code';
    container.appendChild(errorDiv);
  }
}

async function downloadQRCode() {
  const qrImage = document.querySelector('#qr-container img');
  if (!qrImage || !qrImage.dataset.qrUrl) {
    showToast('No QR code to download', 'error');
    return;
  }

  try {
    // Fetch the QR code image from API
    const qrUrl = qrImage.dataset.qrUrl;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to fetch QR code');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'qrcode.png';
    a.click();

    URL.revokeObjectURL(blobUrl);
    showToast('✅ QR code downloaded!', 'success');
  } catch (error) {
    console.error('QR download error:', error);
    showToast('❌ Failed to download QR code', 'error');
  }
}

async function loadLinkHistory() {
  const { linkHistory = [] } = await chrome.storage.local.get('linkHistory');
  const historyList = document.getElementById('link-history-list');

  if (!historyList) return;

  historyList.textContent = '';

  if (linkHistory.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No shortened links yet';
    historyList.appendChild(emptyDiv);
    return;
  }

  const items = linkHistory.slice(-5).reverse();

  items.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    const content = document.createElement('div');
    content.className = 'history-item-content';

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = item.shortened;

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';
    meta.textContent = formatDate(item.timestamp);

    content.appendChild(title);
    content.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'history-item-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-icon link-copy-btn';
    copyBtn.setAttribute('data-url', item.shortened);
    copyBtn.setAttribute('title', 'Copy');
    copyBtn.appendChild(createCopyIconSVG());

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon btn-danger link-delete-btn';
    deleteBtn.setAttribute('data-index', String(linkHistory.length - 1 - index));
    deleteBtn.setAttribute('title', 'Delete');
    deleteBtn.appendChild(createDeleteIconSVG());

    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);

    historyItem.appendChild(content);
    historyItem.appendChild(actions);
    historyList.appendChild(historyItem);
  });
}

async function addToLinkHistory(item) {
  const { linkHistory = [] } = await chrome.storage.local.get('linkHistory');
  linkHistory.push(item);
  await chrome.storage.local.set({ linkHistory });
}

async function deleteLinkHistoryItem(index) {
  const { linkHistory = [] } = await chrome.storage.local.get('linkHistory');
  linkHistory.splice(index, 1);
  await chrome.storage.local.set({ linkHistory });
  loadLinkHistory();
  showToast('Link removed', 'success');
}

async function clearLinkHistory() {
  if (confirm('Clear all link history?')) {
    await chrome.storage.local.set({ linkHistory: [] });
    loadLinkHistory();
    showToast('History cleared', 'success');
  }
}

// ============================================================================
// MODULE 3: COLOR STUDIO
// ============================================================================

function initializeColorStudio() {
  const eyedropperBtn = document.getElementById('eyedropper-btn');
  const clearHistoryBtn = document.getElementById('clear-color-history-btn');
if (window.EyeDropper) {
    // Chrome / Chromium — use the native EyeDropper API
    eyedropperBtn?.addEventListener('click', pickColorNative);
  } else {
    // Firefox — use canvas-based polyfill via content.js + background.js
    if (eyedropperBtn) {
      eyedropperBtn.textContent = '💡 Pick Color from Page (Canvas)';
      eyedropperBtn.disabled = false; // re-enable (was disabled in old code)
    }
    eyedropperBtn?.addEventListener('click', pickColorPolyfill);

    // Listen for the result message from content.js
    chrome.runtime.onMessage.addListener(function eyedropperResultHandler(msg) {
      if (msg.action !== 'eyedropperResult') return;
      chrome.runtime.onMessage.removeListener(eyedropperResultHandler);

      if (msg.color) {
        // Apply picked color to UI
        document.getElementById('color-preview').style.backgroundColor = msg.color;
        document.getElementById('color-hex').value = msg.color;
        document.getElementById('color-rgb').value = hexToRgb(msg.color);
        addToColorHistory(msg.color).then(() => loadColorHistory());
        copyToClipboard(msg.color);
        showToast(`✅ Color picked: ${msg.color}`, 'success');
      } else if (msg.error) {
        showToast('❌ Eyedropper failed: ' + msg.error, 'error');
      }
      // If color is null without error the user pressed Escape — silent cancel
    });
  }

  clearHistoryBtn?.addEventListener('click', clearColorHistory);

  // Copy Palette button
  const copyPaletteBtn = document.getElementById('copy-palette-btn');
  copyPaletteBtn?.addEventListener('click', async () => {
    const { colorHistory = [] } = await chrome.storage.local.get('colorHistory');
    if (colorHistory.length === 0) {
      showToast('No colors in palette yet', 'warning');
      return;
    }
    const csv = colorHistory.join(', ');
    try {
      await navigator.clipboard.writeText(csv);
      showToast(`✅ ${colorHistory.length} color(s) copied!`, 'success');
    } catch {
      showToast('❌ Clipboard access denied', 'error');
    }
  });

  // Event delegation for color history grid
  const colorGrid = document.getElementById('color-history-grid');
  colorGrid?.addEventListener('click', (e) => {
    const colorItem = e.target.closest('.color-history-item');
    if (colorItem) copyToClipboard(colorItem.dataset.color);
  });

  loadColorHistory();
}

// Native EyeDropper (Chrome / Chromium)
async function pickColorNative() {
  try {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    const color = result.sRGBHex;

    document.getElementById('color-preview').style.backgroundColor = color;
    document.getElementById('color-hex').value = color;
    document.getElementById('color-rgb').value = hexToRgb(color);

    await addToColorHistory(color);
    await copyToClipboard(color);
    showToast(`✅ Color picked: ${color}`, 'success');
    loadColorHistory();

  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Color picker error:', error);
      showToast('❌ Failed to pick color', 'error');
    }
  }
}

// Canvas-based EyeDropper polyfill (Firefox)
// Closes the popup, sends a message to content.js to launch the canvas overlay.
// The result is received via chrome.runtime.onMessage in initializeColorStudio().
async function pickColorPolyfill() {
  if (!isInjectableUrl(state.currentUrl)) {
    showToast('⚠️ Cannot inject eyedropper on this page', 'warning');
    return;
  }
  try {
    showToast('💡 Click any pixel on the page. Press Esc to cancel.', 'info');
    await chrome.tabs.sendMessage(state.currentTab.id, { action: 'startEyedropperPolyfill' });
    // Popup closes automatically on Firefox when user interacts with the page.
    // The result is sent back via chrome.runtime.sendMessage from content.js.
  } catch (err) {
    showToast('❌ Eyedropper injection failed: ' + err.message, 'error');
  }
}

async function loadColorHistory() {
  const { colorHistory = [] } = await chrome.storage.local.get('colorHistory');
  const grid = document.getElementById('color-history-grid');

  if (!grid) return;

  grid.textContent = '';

  if (colorHistory.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No colors picked yet';
    grid.appendChild(emptyDiv);
    return;
  }

  const colors = colorHistory.slice(-10).reverse();

  colors.forEach(color => {
    const colorItem = document.createElement('div');
    colorItem.className = 'color-history-item';
    colorItem.style.backgroundColor = color;
    colorItem.setAttribute('data-color', color);
    colorItem.setAttribute('title', `Click to copy ${color}`);
    grid.appendChild(colorItem);
  });
}

async function addToColorHistory(color) {
  const { colorHistory = [] } = await chrome.storage.local.get('colorHistory');
  // Avoid duplicates
  if (!colorHistory.includes(color)) {
    colorHistory.push(color);
  }
  await chrome.storage.local.set({ colorHistory });
}

async function clearColorHistory() {
  if (confirm('Clear all color history?')) {
    await chrome.storage.local.set({ colorHistory: [] });
    loadColorHistory();
    showToast('History cleared', 'success');
  }
}

// ============================================================================
// MODULE 4: SECURITY HUB (Password Generator)
// ============================================================================

function initializeSecurityHub() {
  // Legacy implementation moved to module-securityhub-advanced.js.
}

// ============================================================================
// MODULE 5: COOKIE MANAGER (Professional Edition)
// ============================================================================

function initializeCookieManager() {
  window.WGCookieModule?.initialize(getPopupModuleContext());
}

async function loadCookies() {
  return window.WGCookieModule?.loadCookies(getPopupModuleContext());
}

// ============================================================================
// MODULE 6: RSS READER
// ============================================================================

function initializeRSSReader() {
  const addFeedBtn = document.getElementById('add-feed-btn');
  const refreshBtn = document.getElementById('refresh-feed-btn');
  const deleteFeedBtn = document.getElementById('delete-feed-btn');
  const feedSelect = document.getElementById('saved-feeds');

  addFeedBtn?.addEventListener('click', addRSSFeed);
  refreshBtn?.addEventListener('click', refreshCurrentFeed);
  deleteFeedBtn?.addEventListener('click', deleteCurrentFeed);
  feedSelect?.addEventListener('change', () => {
    const url = feedSelect.value;
    if (url) fetchRSSFeed(url);
  });

  // Event delegation for RSS items
  const feedList = document.getElementById('rss-feed-list');
  feedList?.addEventListener('click', (e) => {
    const rssItem = e.target.closest('.rss-item');
    if (rssItem) {
      const link = rssItem.dataset.link;
      if (link) window.open(link, '_blank');
    }
  });
}

async function loadSavedFeeds() {
  const { rssFeeds = [] } = await chrome.storage.local.get('rssFeeds');
  const feedSelect = document.getElementById('saved-feeds');

  if (!feedSelect) return;

  feedSelect.textContent = '';

  if (rssFeeds.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No feeds saved';
    feedSelect.appendChild(option);
    return;
  }

  rssFeeds.forEach(feed => {
    const option = document.createElement('option');
    option.value = feed.url;
    option.textContent = feed.title || feed.url;
    feedSelect.appendChild(option);
  });

  // Load first feed
  if (rssFeeds.length > 0) {
    fetchRSSFeed(rssFeeds[0].url);
  }
}

async function addRSSFeed() {
  const urlInput = document.getElementById('rss-feed-url');
  const rawInput = urlInput ? urlInput.value.trim() : '';

  if (!rawInput) {
    showToast('Please enter a URL or feed link', 'warning');
    return;
  }

  // Normalise: add protocol if bare domain entered
  let inputUrl = rawInput;
  if (!/^https?:\/\//.test(inputUrl)) {
    inputUrl = 'https://' + inputUrl;
  }
// If it already looks like an XML/feed path, skip HTML discovery
  const looksLikeFeed = /\.xml$|\/feed|rss|atom/i.test(inputUrl);

  let feedUrl = inputUrl;

  if (!looksLikeFeed) {
showToast('🔍 Searching for RSS feed…', 'info');

    try {
      const resp = await chrome.runtime.sendMessage({ action: 'fetchHTML', url: inputUrl });

      if (resp.error) throw new Error(resp.error);

      // Parse the HTML in popup context (DOMParser is available here)
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(resp.htmlText, 'text/html');

      // Look for <link rel="alternate" type="application/rss+xml"> or atom
      const linkEl =
        htmlDoc.querySelector('link[rel="alternate"][type="application/rss+xml"]') ||
        htmlDoc.querySelector('link[rel="alternate"][type="application/atom+xml"]') ||
        htmlDoc.querySelector('link[type="application/rss+xml"]') ||
        htmlDoc.querySelector('link[type="application/atom+xml"]');

      if (!linkEl) {
        showToast('❌ No RSS feed found on this site', 'error');
        return;
      }

      // Resolve the href to an absolute URL relative to the page
      const rawHref = linkEl.getAttribute('href') || '';
      try {
        feedUrl = new URL(rawHref, inputUrl).href;
      } catch (_) {
        feedUrl = rawHref; // Already absolute or best-effort
      }

      showToast('✅ Feed found: ' + feedUrl, 'success');
    } catch (err) {
      showToast('❌ Could not reach site: ' + err.message, 'error');
      return;
    }
  }
const { rssFeeds = [] } = await chrome.storage.local.get('rssFeeds');

  if (rssFeeds.some(feed => feed.url === feedUrl)) {
    showToast('Feed already saved', 'warning');
    return;
  }

  rssFeeds.push({
    url: feedUrl,
    title: feedUrl,
    addedAt: Date.now()
  });

  await chrome.storage.local.set({ rssFeeds });

  if (urlInput) urlInput.value = '';
  showToast('✅ Feed added!', 'success');
  loadSavedFeeds();
}

async function refreshCurrentFeed() {
  const feedSelect = document.getElementById('saved-feeds');
  const url = feedSelect?.value;

  if (!url) {
    showToast('No feed selected', 'warning');
    return;
  }

  fetchRSSFeed(url);
}

async function deleteCurrentFeed() {
  const feedSelect = document.getElementById('saved-feeds');
  const url = feedSelect?.value;

  if (!url) return;

  if (!confirm('Delete this feed?')) return;

  const { rssFeeds = [] } = await chrome.storage.local.get('rssFeeds');
  const filtered = rssFeeds.filter(feed => feed.url !== url);

  await chrome.storage.local.set({ rssFeeds: filtered });

  showToast('Feed deleted', 'success');
  loadSavedFeeds();
}

async function fetchRSSFeed(url) {
  const feedList = document.getElementById('rss-feed-list');

  if (!feedList) return;

  feedList.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'empty-state';
  loadingDiv.textContent = 'Loading feed...';
  feedList.appendChild(loadingDiv);

  try {
    // Background fetches raw XML text (avoids CORS), we parse here with DOMParser
    const response = await chrome.runtime.sendMessage({
      action: 'fetchRSS',
      url: url
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // v3.0 FIX: Use DOMParser (available in popup context, NOT in service workers)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.rawText, 'text/xml');

    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid XML in feed response');
    }

    // Extract items — support both RSS <item> and Atom <entry>
    const itemEls = Array.from(xmlDoc.getElementsByTagName('item'));
    const entryEls = Array.from(xmlDoc.getElementsByTagName('entry'));
    const allEls = itemEls.length > 0 ? itemEls : entryEls;

    const items = allEls.map(el => {
      // Helper: get text content of first matching tag, stripping CDATA
      function getText(tagName) {
        const node = el.getElementsByTagName(tagName)[0];
        if (!node) return '';
        return (node.textContent || '').replace(/<![CDATA[|]]>/g, '').trim();
      }
      // Atom uses <title>, <link href="...">, <summary>
      let link = getText('link');
      if (!link) {
        const linkEl = el.getElementsByTagName('link')[0];
        link = linkEl ? (linkEl.getAttribute('href') || '') : '';
      }
      return {
        title: getText('title') || 'Untitled',
        link: link,
        description: getText('description') || getText('summary') || '',
        pubDate: getText('pubDate') || getText('published') || getText('updated') || ''
      };
    }).filter(item => item.link);

    displayRSSItems(items);

  } catch (error) {
    console.error('RSS fetch error:', error);
    feedList.textContent = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'empty-state';
    errorDiv.textContent = '❌ Failed to load feed: ' + error.message;
    feedList.appendChild(errorDiv);
    showToast('❌ Failed to load feed', 'error');
  }
}

function displayRSSItems(items) {
  const feedList = document.getElementById('rss-feed-list');

  if (!feedList) return;

  feedList.textContent = '';

  if (!items || items.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No items in feed';
    feedList.appendChild(emptyDiv);
    return;
  }

  const displayItems = items.slice(0, 20);

  displayItems.forEach(item => {
    const rssItem = document.createElement('div');
    rssItem.className = 'rss-item';
    rssItem.setAttribute('data-link', item.link);

    const title = document.createElement('div');
    title.className = 'rss-item-title';
    title.textContent = item.title;

    const description = document.createElement('div');
    description.className = 'rss-item-description';
    description.textContent = item.description || '';

    const meta = document.createElement('div');
    meta.className = 'rss-item-meta';
    meta.textContent = item.pubDate ? formatDate(new Date(item.pubDate).getTime()) : '';

    rssItem.appendChild(title);
    rssItem.appendChild(description);
    rssItem.appendChild(meta);
    feedList.appendChild(rssItem);
  });
}

// ============================================================================
// MODULE 6.5: GENIUS LYRICS (v3.2.1 — NEW)
// ============================================================================

/**
 * Auto-detects current tab media metadata (artist + title) by messaging content.js.
 * Populates the manual input fields for convenience.
 */
async function detectMediaMetadataForLyrics() {
  if (!isInjectableUrl(state.currentUrl)) return;
  try {
    const response = await chrome.tabs.sendMessage(state.currentTab.id, { action: 'getMediaMeta' });
    if (!response) return;

    const artistInput = document.getElementById('lyrics-artist-input');
    const songInput = document.getElementById('lyrics-song-input');
    const metaBar = document.getElementById('lyrics-meta-bar');
    const trackLabel = document.getElementById('lyrics-detected-track');

    if (response.title && (artistInput.value === '' && songInput.value === '')) {
      if (artistInput) artistInput.value = response.artist || '';
      if (songInput) songInput.value = response.title || '';
    }

    if (response.title && metaBar && trackLabel) {
      const display = [response.artist, response.title].filter(Boolean).join(' — ');
      trackLabel.textContent = display;
      metaBar.style.display = '';
    }
  } catch (_) {
    // Content script not reachable (e.g., chrome:// page) — silently skip
  }
}

function initializeGeniusLyrics() {
  const fetchBtn = document.getElementById('fetch-lyrics-btn');
  const copyLyricsBtn = document.getElementById('copy-lyrics-btn');

  fetchBtn?.addEventListener('click', fetchLyrics);
  restoreCachedLyrics();

  copyLyricsBtn?.addEventListener('click', async () => {
    const pre = document.getElementById('lyrics-output');
    if (!pre || !pre.textContent.trim()) {
      showToast('No lyrics to copy', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(pre.textContent);
      showToast('✅ Lyrics copied!', 'success');
    } catch {
      showToast('❌ Clipboard access denied', 'error');
    }
  });
}

/**
 * Genius Lyrics fetch pipeline (v3.2.2):
 *   Step 1: background.js 'searchGenius' → JSON API → first type==='song' URL
 *   Step 2: background.js 'fetchGeniusLyricsPage' → raw HTML → DOMParser extract
 *   Step 3: Display in <pre> via textContent (no innerHTML)
 */
async function fetchLyrics() {
  const artist = (document.getElementById('lyrics-artist-input')?.value || '').trim();
  const song = (document.getElementById('lyrics-song-input')?.value || '').trim();

  if (!song) {
    const statusEl = document.getElementById('lyrics-status');
    if (statusEl) statusEl.textContent = '⚠️ Please enter at least a song title';
    return;
  }

  const rawQuery = [artist, song].filter(Boolean).join(' ');
  const cacheId = normalizeLyricsQuery(artist, song);
  const lyricsStatusEl = document.getElementById('lyrics-status');
  const setStatus = (msg) => { if (lyricsStatusEl) lyricsStatusEl.textContent = msg; };
  const clearStatus = () => { if (lyricsStatusEl) lyricsStatusEl.textContent = ''; };

  const cachedEntry = await getCachedLyrics();
  if (cachedEntry && cachedEntry.cacheId === cacheId && cachedEntry.lyricsText) {
    renderLyrics(cachedEntry.lyricsText);
    setStatus('🗂 Loaded from cache');
    return;
  }

  setStatus('🔍 Searching Genius...');
  document.getElementById('lyrics-output-wrapper').style.display = 'none';

  try {
const searchResp = await chrome.runtime.sendMessage({
      action: 'searchGenius',
      query: rawQuery
    });

    if (!searchResp || searchResp.error) {
      throw new Error(searchResp?.error || 'No response from background');
    }

    const { url: lyricsPageUrl, title: matchedTitle, artist: matchedArtist, cleanedQuery } = searchResp;

    // Show confirmation of what we matched (lets user spot wrong hits)
    setStatus(`📄 Matched: "${matchedTitle}" by ${matchedArtist || 'Unknown'} — fetching lyrics…`);
const lyricsResp = await chrome.runtime.sendMessage({
      action: 'fetchGeniusLyricsPage',
      url: lyricsPageUrl
    });

    if (!lyricsResp || lyricsResp.error) {
      throw new Error(lyricsResp?.error || 'Lyrics page fetch failed');
    }
const parser = new DOMParser();
    const lyricsDoc = parser.parseFromString(lyricsResp.html, 'text/html');

    // Modern Genius: [data-lyrics-container="true"] divs with <br> line breaks
    const containers = lyricsDoc.querySelectorAll('[data-lyrics-container="true"]');
    let lyricsText = '';

    if (containers.length > 0) {
      containers.forEach(container => {
        lyricsText += extractTextPreservingBreaks(container) + '\n\n';
      });
    } else {
      // Legacy Genius markup fallback
      const legacyEl = lyricsDoc.querySelector('.lyrics, .song_body-lyrics');
      if (legacyEl) lyricsText = extractTextPreservingBreaks(legacyEl);
    }

    lyricsText = lyricsText.trim();

    if (!lyricsText) {
      setStatus('⚠️ Could not extract lyrics (page structure may have changed)');
      return;
    }
clearStatus();
    renderLyrics(lyricsText);
    await setCachedLyrics({
      cacheId,
      artist,
      song,
      matchedTitle,
      matchedArtist,
      lyricsPageUrl,
      lyricsText,
      savedAt: Date.now()
    });

  } catch (err) {
    console.error('[WebGrenade] Lyrics fetch error:', err);
    setStatus('❌ ' + err.message);
  }
}

/**
 * Walk a DOM element's childNodes recursively, converting <br> to newlines
 * and extracting .textContent from all other nodes.
 * Preserves line structure without relying on innerHTML.
 */
function extractTextPreservingBreaks(el) {
  let text = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') {
        text += '\n';
      } else {
        text += extractTextPreservingBreaks(node);
      }
    }
  });
  return text;
}

// ============================================================================
// MODULE 7: UTILITIES
// ============================================================================

function initializeUtilities() {
  // Right Click Unlocker
  const rightClickToggle = document.getElementById('toggle-right-click');
  rightClickToggle?.addEventListener('change', async (e) => {
    await toggleUtility('rightClickUnlocker', e.target.checked);
  });

  // Popup Killer — v3.0: wired to content.js via tabs.sendMessage
  const popupToggle = document.getElementById('toggle-popup-killer');
  popupToggle?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.local.set({ popupBlockerEnabled: enabled });
    if (!isInjectableUrl(state.currentUrl)) {
      showToast('⚠️ Cannot inject on this page', 'warning');
      e.target.checked = !enabled;
      return;
    }
    try {
      await chrome.tabs.sendMessage(state.currentTab.id, {
        action: enabled ? 'enablePopupBlocker' : 'disablePopupBlocker'
      });
      showToast(`🚫 Popup Blocker ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'info');
    } catch (e) {
      // Content script not yet loaded — use scripting.executeScript fallback
      await toggleUtility('popupKiller', enabled);
    }
  });

  // Page Cleaner
  const pageCleanerToggle = document.getElementById('toggle-page-cleaner');
  pageCleanerToggle?.addEventListener('change', async (e) => {
    await toggleUtility('pageCleaner', e.target.checked);
  });

  // PiP Mode (button)
  const pipBtn = document.getElementById('pip-mode-btn');
  pipBtn?.addEventListener('click', activatePiP);

  // Whitelist buttons
  const whitelistSiteBtn = document.getElementById('whitelist-site-btn');
  whitelistSiteBtn?.addEventListener('click', addCurrentSiteToWhitelist);

  const viewWhitelistBtn = document.getElementById('view-whitelist-btn');
  viewWhitelistBtn?.addEventListener('click', openWhitelistModal);

  // Whitelist modal close buttons
  const closeWhitelistBtnX = document.getElementById('close-whitelist-modal-x');
  const closeWhitelistBtn = document.getElementById('close-whitelist-modal-btn');
  closeWhitelistBtnX?.addEventListener('click', closeWhitelistModal);
  closeWhitelistBtn?.addEventListener('click', closeWhitelistModal);

  // Event delegation for whitelist items
  const whitelistList = document.getElementById('whitelist-list');
  whitelistList?.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.whitelist-remove-btn');
    if (removeBtn) {
      const domain = removeBtn.dataset.domain;
      removeFromWhitelist(domain);
    }
  });

  // Load saved toggle states and blocked count
  loadUtilityStates();
  updateBlockedCountBadge();
}

async function loadUtilityStates() {
  const { utilityStates = {} } = await chrome.storage.local.get('utilityStates');

  if (utilityStates.rightClickUnlocker) {
    document.getElementById('toggle-right-click').checked = true;
  }
  if (utilityStates.popupKiller) {
    document.getElementById('toggle-popup-killer').checked = true;
  }
  if (utilityStates.pageCleaner) {
    document.getElementById('toggle-page-cleaner').checked = true;
  }
}

async function toggleUtility(name, enabled) {
  const { utilityStates = {} } = await chrome.storage.local.get('utilityStates');
  utilityStates[name] = enabled;
  await chrome.storage.local.set({ utilityStates });

  // Check if current page is injectable
  if (!isInjectableUrl(state.currentUrl)) {
    showToast(`⚠️ Cannot use ${name} on this page`, 'warning');
    // Revert toggle
    const toggleElement = document.getElementById(
      name === 'rightClickUnlocker' ? 'toggle-right-click' :
        name === 'popupKiller' ? 'toggle-popup-killer' :
          'toggle-page-cleaner'
    );
    if (toggleElement) toggleElement.checked = !enabled;
    utilityStates[name] = !enabled;
    await chrome.storage.local.set({ utilityStates });
    return;
  }

  // Check whitelist before injecting popup killer
  if (name === 'popupKiller') {
    const domain = getDomainFromUrl(state.currentUrl);
    const isWhitelisted = await checkIfWhitelisted(domain);

    if (isWhitelisted && enabled) {
      showToast('⚠️ Site is whitelisted - popup killer not applied', 'info');
      return;
    }
  }

  // Inject script based on utility
  if (name === 'rightClickUnlocker') {
    await chrome.scripting.executeScript({
      target: { tabId: state.currentTab.id },
      func: enabled ? enableRightClick : disableRightClick
    });
  } else if (name === 'popupKiller') {
    await chrome.scripting.executeScript({
      target: { tabId: state.currentTab.id },
      func: enabled ? enableAggressivePopupKiller : disablePopupKiller
    });
  } else if (name === 'pageCleaner') {
    await chrome.scripting.executeScript({
      target: { tabId: state.currentTab.id },
      func: enabled ? enablePageCleaner : disablePageCleaner
    });
  }

  showToast(`${name} ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

// Whitelist System
async function loadWhitelist() {
  const { popupWhitelist = [] } = await chrome.storage.local.get('popupWhitelist');
  return popupWhitelist;
}

async function checkIfWhitelisted(domain) {
  const whitelist = await loadWhitelist();
  return whitelist.some(entry => entry.domain === domain);
}

async function addCurrentSiteToWhitelist() {
  const domain = getDomainFromUrl(state.currentUrl);

  if (!domain) {
    showToast('❌ Invalid domain', 'error');
    return;
  }

  const whitelist = await loadWhitelist();

  // Check if already whitelisted
  if (whitelist.some(entry => entry.domain === domain)) {
    showToast('ℹ️ Site already whitelisted', 'info');
    return;
  }

  // Add to whitelist
  whitelist.push({
    domain: domain,
    addedAt: new Date().toISOString()
  });

  await chrome.storage.local.set({ popupWhitelist: whitelist });
  showToast(`✅ ${domain} added to whitelist`, 'success');

  // Update modal if it's open
  const modal = document.getElementById('whitelist-modal');
  if (modal && modal.style.display === 'flex') {
    await updateWhitelistContent();
  }

  // Disable popup killer if currently enabled
  const { utilityStates = {} } = await chrome.storage.local.get('utilityStates');
  if (utilityStates.popupKiller) {
    document.getElementById('toggle-popup-killer').checked = false;
    utilityStates.popupKiller = false;
    await chrome.storage.local.set({ utilityStates });
  }
}

async function removeFromWhitelist(domain) {
  const whitelist = await loadWhitelist();
  const filtered = whitelist.filter(entry => entry.domain !== domain);

  await chrome.storage.local.set({ popupWhitelist: filtered });
  showToast(`✅ ${domain} removed from whitelist`, 'success');

  // Update modal content
  await updateWhitelistContent();
}

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

async function updateWhitelistContent() {
  const listContainer = document.getElementById('whitelist-list');
  if (!listContainer) return;

  const whitelist = await loadWhitelist();

  listContainer.textContent = '';

  if (whitelist.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No whitelisted sites';
    listContainer.appendChild(emptyDiv);
  } else {
    whitelist.forEach(entry => {
      const whitelistItem = document.createElement('div');
      whitelistItem.className = 'whitelist-item';

      const domain = document.createElement('div');
      domain.className = 'whitelist-domain';
      domain.textContent = entry.domain;

      const date = document.createElement('div');
      date.className = 'whitelist-date';
      date.textContent = `Added: ${new Date(entry.addedAt).toLocaleDateString()}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-icon whitelist-remove-btn';
      removeBtn.setAttribute('data-domain', entry.domain);
      removeBtn.setAttribute('title', 'Remove');
      removeBtn.textContent = '🗑️';

      whitelistItem.appendChild(domain);
      whitelistItem.appendChild(date);
      whitelistItem.appendChild(removeBtn);
      listContainer.appendChild(whitelistItem);
    });
  }
}

async function openWhitelistModal() {
  const modal = document.getElementById('whitelist-modal');
  if (!modal) return;

  await updateWhitelistContent();

  modal.style.display = 'flex';

  // Close on overlay click
  setTimeout(() => {
    modal.onclick = (e) => {
      if (e.target === modal) closeWhitelistModal();
    };
  }, 0);
}

function closeWhitelistModal() {
  const modal = document.getElementById('whitelist-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.onclick = null;
  }
}

// Blocked Counter System
async function updateBlockedCountBadge() {
  const { blockedCounts = {} } = await chrome.storage.local.get('blockedCounts');
  const domain = getDomainFromUrl(state.currentUrl);

  if (!domain) return;

  const count = blockedCounts[domain] || 0;
  const badge = document.getElementById('blocked-count-badge');

  if (badge) {
    badge.textContent = count;
  }
}

async function updateBlockedCountBadge() {
  try {
    const domain = getDomainFromUrl(state.currentUrl);
    if (!domain) {
      // Set badge to 0 for invalid domains
      const badge = document.getElementById('blocked-count-badge');
      if (badge) badge.textContent = '0';
      return;
    }

    // Check if URL is injectable (skip chrome://, about:, edge:// etc.)
    if (!isInjectableUrl(state.currentUrl)) {
      const badge = document.getElementById('blocked-count-badge');
      if (badge) badge.textContent = '0';
      return;
    }

    // Inject script to read blocked count from localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId: state.currentTab.id },
      func: () => {
        const domain = window.location.hostname;
        const stored = localStorage.getItem('webgrenade_blocked_' + domain);
        return parseInt(stored) || 0;
      }
    });

    const count = results[0]?.result || 0;
    const badge = document.getElementById('blocked-count-badge');
    if (badge) {
      badge.textContent = count;
    }
  } catch (error) {
    // Silently fail for restricted pages
    const badge = document.getElementById('blocked-count-badge');
    if (badge) badge.textContent = '0';
  }
}

function isInjectableUrl(url) {
  if (!url) return false;

  // List of non-injectable URL schemes
  const restrictedSchemes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'data:',
    'file://',
    'devtools://'
  ];

  return !restrictedSchemes.some(scheme => url.startsWith(scheme));
}

async function sendMessageToAllFrames(tabId, payload) {
  if (!tabId) return { success: false, responses: [] };

  let frameIds = [0];
  if (chrome.webNavigation?.getAllFrames) {
    frameIds = await new Promise((resolve) => {
      chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
        if (chrome.runtime.lastError || !Array.isArray(frames)) {
          resolve([0]);
          return;
        }
        const ids = [...new Set(frames.map(f => f.frameId))];
        resolve(ids.length ? ids : [0]);
      });
    });
  }

  const responses = [];

  for (const frameId of frameIds) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, payload, { frameId });
      if (response) responses.push(response);
    } catch (_) {
      // Frame may not host content script or may be restricted.
    }
  }

  return {
    success: responses.some(r => r.success),
    responses
  };
}

function normalizeLyricsQuery(artist, song) {
  return [artist, song]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function getCachedLyrics() {
  const stored = await chrome.storage.local.get(GENIUS_LYRICS_CACHE_KEY);
  return stored[GENIUS_LYRICS_CACHE_KEY] || null;
}

async function setCachedLyrics(cache) {
  await chrome.storage.local.set({ [GENIUS_LYRICS_CACHE_KEY]: cache });
}

function renderLyrics(lyricsText) {
  const pre = document.getElementById('lyrics-output');
  if (pre) pre.textContent = lyricsText;
  const wrapper = document.getElementById('lyrics-output-wrapper');
  if (wrapper) wrapper.style.display = '';
}

async function restoreCachedLyrics() {
  const cache = await getCachedLyrics();
  if (!cache || !cache.lyricsText) return;

  renderLyrics(cache.lyricsText);

  const artistInput = document.getElementById('lyrics-artist-input');
  const songInput = document.getElementById('lyrics-song-input');
  if (artistInput && !artistInput.value) artistInput.value = cache.artist || '';
  if (songInput && !songInput.value) songInput.value = cache.song || '';
}

// Utility injection functions
function enableRightClick() {
  document.addEventListener('contextmenu', (e) => e.stopPropagation(), true);
  document.addEventListener('copy', (e) => e.stopPropagation(), true);
  document.body.style.userSelect = 'auto';
  document.body.style.webkitUserSelect = 'auto';
}

function disableRightClick() {
  // Cannot truly disable, page reload needed
}

function enableAggressivePopupKiller() {
  const domain = window.location.hostname;
  let blockedCount = 0;

  // Load existing blocked count
  try {
    const stored = localStorage.getItem('webgrenade_blocked_' + domain);
    if (stored) blockedCount = parseInt(stored) || 0;
  } catch (e) { }

  function saveCount() {
    try {
      localStorage.setItem('webgrenade_blocked_' + domain, blockedCount.toString());
    } catch (e) { }
  }

  function blockPopup(logMsg) {
    blockedCount++;
    saveCount();
  }

  // ============= LAYER 1: Window API Override =============
  const originalOpen = window.open;
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;

  window.open = function (...args) {
    // Allow specific user-initiated opens (within 1 second of click)
    const timeSinceLastClick = Date.now() - (window._lastUserClick || 0);
    if (timeSinceLastClick < 1000 && args[0]) {
      // Check if it's a legit URL
      try {
        const url = new URL(args[0], window.location.href);
        if (url.hostname === window.location.hostname) {
          return originalOpen.apply(this, args);
        }
      } catch (e) { }
    }

    blockPopup('Blocked window.open()');
    return null;
  };

  window.alert = function (...args) {
    // Block all alerts except on user click
    const timeSinceLastClick = Date.now() - (window._lastUserClick || 0);
    if (timeSinceLastClick < 500) {
      return originalAlert.apply(this, args);
    }
    blockPopup('Blocked alert()');
  };

  window.confirm = function () {
    blockPopup('Blocked confirm()');
    return false;
  };

  window.prompt = function () {
    blockPopup('Blocked prompt()');
    return null;
  };

  // Track user clicks
  document.addEventListener('click', () => {
    window._lastUserClick = Date.now();
  }, true);

  // ============= LAYER 2: Click Hijacking Prevention =============
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    const targetAttr = target.getAttribute('target');

    // Block suspicious patterns
    if (targetAttr === '_blank' && (!href || href === '#' || href === 'javascript:void(0)')) {
      e.preventDefault();
      e.stopPropagation();
      blockPopup('Blocked suspicious link click');
      return false;
    }

    // Block popup window patterns
    if (target.onclick?.toString().includes('window.open') ||
      target.onclick?.toString().includes('popup')) {
      e.preventDefault();
      e.stopPropagation();
      blockPopup('Blocked onclick popup');
      return false;
    }
  }, true);

  // ============= LAYER 3: Smart Overlay Detection =============
  function isWebGrenadeElement(el) {
    if (!el) return false;

    let current = el;
    while (current) {
      const id = current.id?.toLowerCase() || '';
      if (id.includes('webgrenade') || id.includes('import-modal') ||
        id.includes('whitelist-modal') || id.includes('toast-container')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function getViewportCoverage(el) {
    const rect = el.getBoundingClientRect();
    const viewportArea = window.innerWidth * window.innerHeight;
    const elementArea = rect.width * rect.height;
    return (elementArea / viewportArea) * 100;
  }

  function isPopupOverlay(el) {
    if (!el || el.nodeType !== 1 || isWebGrenadeElement(el)) return false;

    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();

    // Ignore if hidden
    if (style.display === 'none' || style.visibility === 'hidden' ||
      parseFloat(style.opacity) < 0.1) return false;

    // Ignore non-positioned or inline elements
    const position = style.position;
    if (position !== 'fixed' && position !== 'absolute') return false;

    const zIndex = parseInt(style.zIndex) || 0;
    const coverage = getViewportCoverage(el);

    // RULE 1: Very high z-index (999+) + coverage > 50%
    if (zIndex >= 999 && coverage > 50) return true;

    // RULE 2: Full viewport coverage (95%+) with backdrop
    if (coverage > 95) {
      const bg = style.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return true;
      }
    }

    // RULE 3: Keyword-based detection with strict validation
    const className = el.className?.toString().toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    const combined = className + ' ' + id;

    const popupKeywords = [
      'modal', 'popup', 'popover', 'overlay', 'backdrop',
      'lightbox', 'dialog', 'subscribe', 'newsletter',
      'interstitial', 'takeover', 'splash'
    ];

    for (const keyword of popupKeywords) {
      if (combined.includes(keyword)) {
        // Must be positioned and visible
        if ((position === 'fixed' || position === 'absolute') &&
          zIndex > 99 && coverage > 30) {
          return true;
        }
      }
    }

    // RULE 4: Suspiciously large fixed element
    if (position === 'fixed' && zIndex > 500) {
      const width = parseInt(style.width);
      const height = parseInt(style.height);
      if ((width > window.innerWidth * 0.7 || style.width === '100%') &&
        (height > window.innerHeight * 0.7 || style.height === '100%')) {
        return true;
      }
    }

    // RULE 5: Iframe with suspicious properties
    if (tag === 'iframe' && (position === 'fixed' || position === 'absolute')) {
      if (zIndex > 999 || coverage > 80) return true;
    }

    return false;
  }

  function removeElement(el, reason) {
    if (!el || !el.parentNode) return false;

    try {
      el.remove();
      blockPopup(`Removed ${reason}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============= LAYER 4: Aggressive DOM Scanner =============
  let scanTimeout = null;

  function aggressiveScan() {
    // Debounce rapid scans
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      // Find all suspicious elements
      const suspects = document.querySelectorAll(
        'div[class*="modal"], div[class*="popup"], div[class*="overlay"], ' +
        'div[id*="modal"], div[id*="popup"], div[id*="overlay"], ' +
        'div[class*="backdrop"], div[class*="lightbox"], div[class*="dialog"], ' +
        'iframe[style*="position"][style*="fixed"], iframe[style*="position"][style*="absolute"]'
      );

      suspects.forEach(el => {
        if (isPopupOverlay(el)) {
          removeElement(el, 'suspicious overlay');
        }
      });

      // Fix body scroll lock
      if (document.body.style.overflow === 'hidden' ||
        document.body.style.overflowY === 'hidden') {
        const bodyClass = document.body.className.toLowerCase();
        if (!bodyClass.includes('webgrenade')) {
          document.body.style.overflow = 'auto';
          document.body.style.overflowY = 'auto';
        }
      }

      // Remove position:fixed on html
      if (document.documentElement.style.overflow === 'hidden') {
        document.documentElement.style.overflow = 'auto';
      }
    }, 100);
  }

  // Initial aggressive scan
  aggressiveScan();

  // ============= LAYER 5: Mutation Observer =============
  const observer = new MutationObserver((mutations) => {
    let needsScan = false;

    for (const mutation of mutations) {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (isPopupOverlay(node)) {
            removeElement(node, 'new popup element');
          } else {
            needsScan = true;
          }
        }
      }

      // Check attribute changes (style, class changes can reveal popups)
      if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
        if (isPopupOverlay(mutation.target)) {
          removeElement(mutation.target, 'modified to popup');
        }
      }
    }

    if (needsScan) {
      aggressiveScan();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'id']
  });

  // ============= LAYER 6: Event Prevention =============
  // Block beforeunload popups
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    delete e['returnValue'];
  }, true);

  // Periodic scan for persistent popups
  const intervalId = setInterval(aggressiveScan, 3000);

  // Store cleanup references
  window._webgrenadePopupObserver = observer;
  window._webgrenadePopupInterval = intervalId;
  window._webgrenadeBlockedCount = blockedCount;
}

function disablePopupKiller() {
  // Stop observer
  if (window._webgrenadePopupObserver) {
    window._webgrenadePopupObserver.disconnect();
    delete window._webgrenadePopupObserver;
  }

  // Stop interval scanner
  if (window._webgrenadePopupInterval) {
    clearInterval(window._webgrenadePopupInterval);
    delete window._webgrenadePopupInterval;
  }
}

function enablePageCleaner() {
  const style = document.createElement('style');
  style.id = 'webgrenade-page-cleaner';
  style.textContent = `
    [class*="ad-"], [class*="advertisement"], [id*="ad-"],
    aside, [role="complementary"], .sidebar,
    [class*="popup"], [class*="modal"]:not([id*="webgrenade"]) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function disablePageCleaner() {
  const style = document.getElementById('webgrenade-page-cleaner');
  if (style) style.remove();
}

async function activatePiP() {
  // Check if current page is injectable
  if (!isInjectableUrl(state.currentUrl)) {
    showToast('⚠️ Cannot use PiP on this page', 'warning');
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: state.currentTab.id },
      func: () => {
        const video = document.querySelector('video');
        if (!video) return 'No video found';

        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
          return 'PiP disabled';
        } else {
          video.requestPictureInPicture();
          return 'PiP enabled';
        }
      }
    });

    showToast(result.result, 'success');

  } catch (error) {
    console.error('PiP error:', error);
    showToast('❌ PiP not available', 'error');
  }
}

// ============================================================================
// MODULE 8: SETTINGS
// ============================================================================

// ============================================================================
// PRO FEATURES INIT (v3.0)
// ============================================================================

function initializeProFeatures() {
const darkModeToggle = document.getElementById('toggle-dark-mode');
  darkModeToggle?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.local.set({ darkModeEnabled: enabled });
    if (!isInjectableUrl(state.currentUrl)) {
      showToast('⚠️ Cannot inject on this page', 'warning');
      e.target.checked = !enabled;
      return;
    }
    try {
      await chrome.tabs.sendMessage(state.currentTab.id, {
        action: enabled ? 'enableDarkMode' : 'disableDarkMode'
      });
      showToast(`🌙 Dark Mode ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'info');
    } catch (_) {
      // Content script may not have loaded (e.g. extension freshly installed) — inject via scripting
      await chrome.scripting.executeScript({
        target: { tabId: state.currentTab.id },
        func: (on) => {
          const id = 'wg-dark-mode';
          if (on) {
            if (!document.getElementById(id)) {
              const s = document.createElement('style');
              s.id = id;
              s.textContent = 'html{filter:invert(1) hue-rotate(180deg)!important}img,video,picture,canvas,svg,iframe{filter:invert(1) hue-rotate(180deg)!important}';
              (document.head || document.documentElement).appendChild(s);
            }
          } else {
            const el = document.getElementById(id);
            if (el) el.remove();
          }
        },
        args: [enabled]
      });
      showToast(`🌙 Dark Mode ${enabled ? 'ON' : 'OFF'}`, enabled ? 'success' : 'info');
    }
  });
const volSlider = document.getElementById('volume-boost-slider');
  const volLabel = document.getElementById('volume-boost-value');
  volSlider?.addEventListener('input', () => {
    if (volLabel) volLabel.textContent = volSlider.value + '%';
  });
  volSlider?.addEventListener('change', async () => {
    const level = parseInt(volSlider.value, 10);
    if (!isInjectableUrl(state.currentUrl)) {
      showToast('⚠️ Cannot inject on this page', 'warning');
      return;
    }
    try {
      await sendMessageToAllFrames(state.currentTab.id, { action: 'setVolume', level });
      showToast(`🔊 Volume set to ${level}%`, 'success');
    } catch (_) {
      showToast('⚠️ Reload the page to apply volume boost', 'warning');
    }
  });
const nukeBtn = document.getElementById('nuke-history-btn');
  nukeBtn?.addEventListener('click', async () => {
    const input = document.getElementById('history-cleaner-input');
    const query = (input ? input.value : '').trim();
    if (!query) {
      showToast('⚠️ Enter a domain or URL first', 'warning');
      return;
    }
    nukeBtn.disabled = true;
    nukeBtn.textContent = '⏳ Nuking...';
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'nukeHistory', query });
      if (resp && resp.success) {
        showToast(`💣 Nuked ${resp.count} history entr${resp.count === 1 ? 'y' : 'ies'} matching "${query}"`, 'success');
        if (input) input.value = '';
      } else {
        showToast('❌ ' + (resp && resp.error || 'Failed'), 'error');
      }
    } catch (err) {
      showToast('❌ ' + err.message, 'error');
    } finally {
      nukeBtn.disabled = false;
      nukeBtn.textContent = '💣 Nuke';
    }
  });
chrome.storage.local.get(['darkModeEnabled', 'popupBlockerEnabled', 'volumeLevel'], (r) => {
    if (r.darkModeEnabled) {
      const el = document.getElementById('toggle-dark-mode');
      if (el) el.checked = true;
    }
    if (r.popupBlockerEnabled) {
      const el = document.getElementById('toggle-popup-killer');
      if (el) el.checked = true;
    }
    if (r.volumeLevel !== undefined) {
      const slider = document.getElementById('volume-boost-slider');
      const label = document.getElementById('volume-boost-value');
      if (slider) slider.value = r.volumeLevel;
      if (label) label.textContent = r.volumeLevel + '%';
    }
  });
}

function initializeSettings() {
  const presetSelect = document.getElementById('provider-preset');
  const saveBtn = document.getElementById('save-settings-btn');
  const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
  const advancedSettings = document.getElementById('advanced-settings');

  presetSelect?.addEventListener('change', (e) => {
    applyPreset(e.target.value);
  });

  saveBtn?.addEventListener('click', saveSettings);

  toggleAdvancedBtn?.addEventListener('click', () => {
    const isHidden = advancedSettings.style.display === 'none';
    advancedSettings.style.display = isHidden ? 'block' : 'none';
    toggleAdvancedBtn.textContent = isHidden ? 'Hide Advanced Settings' : 'Show Advanced Settings';
  });

  // Load existing settings
  loadSettings();
}

async function loadSettings() {
  const config = await chrome.storage.local.get(['apiKey', 'apiHost', 'endpoint', 'method']);

  if (config.apiKey) {
    document.getElementById('api-key-input').value = config.apiKey;
  }
  if (config.apiHost) {
    document.getElementById('api-host-input').value = config.apiHost;
  }
  if (config.endpoint) {
    document.getElementById('endpoint-path').value = config.endpoint;
  }
  if (config.method) {
    document.getElementById('http-method').value = config.method;
  }
}

function applyPreset(preset) {
  const hostInput = document.getElementById('api-host-input');
  const endpointInput = document.getElementById('endpoint-path');
  const methodSelect = document.getElementById('http-method');
  const advancedSettings = document.getElementById('advanced-settings');

  if (preset === 'datafanatic') {
    hostInput.value = 'youtube-media-downloader.p.rapidapi.com';
    endpointInput.value = '/v2/video/details';
    methodSelect.value = 'GET';
    advancedSettings.style.display = 'none';
  } else if (preset === 'ytmp3') {
    hostInput.value = 'youtube-mp36.p.rapidapi.com';
    endpointInput.value = '/dl';
    methodSelect.value = 'GET';
    advancedSettings.style.display = 'none';
  } else if (preset === 'custom') {
    advancedSettings.style.display = 'block';
  }
}

async function saveSettings() {
  const apiKeyInput = document.getElementById('api-key-input');
  const apiHostInput = document.getElementById('api-host-input');
  const endpointInput = document.getElementById('endpoint-path');
  const methodSelect = document.getElementById('http-method');

  if (!apiKeyInput || !apiHostInput) {
    console.error('Settings form elements not found');
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  const apiHost = apiHostInput.value.trim();
  const endpoint = endpointInput ? endpointInput.value.trim() : '';
  const method = methodSelect ? methodSelect.value : 'GET';

  if (!apiKey || !apiHost) {
    showStatus('settings-status', '❌ API Key and Host are required', 'error');
    return;
  }

  await chrome.storage.local.set({
    apiKey,
    apiHost,
    endpoint,
    method
  });

  state.apiConfig.key = apiKey;
  state.apiConfig.host = apiHost;
  state.apiConfig.configured = true;

  showStatus('settings-status', '✅ Settings saved successfully!', 'success');
  setTimeout(() => hideStatus('settings-status'), 3000);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : '';
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

// SVG Icon Helper Functions (avoiding innerHTML)
function createCopyIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '9');
  rect.setAttribute('y', '9');
  rect.setAttribute('width', '13');
  rect.setAttribute('height', '13');
  rect.setAttribute('rx', '2');
  rect.setAttribute('ry', '2');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');

  svg.appendChild(rect);
  svg.appendChild(path);
  return svg;
}

function createDeleteIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', '3 6 5 6 21 6');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');

  svg.appendChild(polyline);
  svg.appendChild(path);
  return svg;
}

function createEditIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');

  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');

  svg.appendChild(path1);
  svg.appendChild(path2);
  return svg;
}

function createCloseIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '18');
  line1.setAttribute('y1', '6');
  line1.setAttribute('x2', '6');
  line1.setAttribute('y2', '18');

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '6');
  line2.setAttribute('y1', '6');
  line2.setAttribute('x2', '18');
  line2.setAttribute('y2', '18');

  svg.appendChild(line1);
  svg.appendChild(line2);
  return svg;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function createDeleteIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', '3 6 5 6 21 6');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');

  svg.appendChild(polyline);
  svg.appendChild(path);
  return svg;
}

function createEditIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');

  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');

  svg.appendChild(path1);
  svg.appendChild(path2);
  return svg;
}

function createCloseIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '18');
  line1.setAttribute('y1', '6');
  line1.setAttribute('x2', '6');
  line1.setAttribute('y2', '18');

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '6');
  line2.setAttribute('y1', '6');
  line2.setAttribute('x2', '18');
  line2.setAttribute('y2', '18');

  svg.appendChild(line1);
  svg.appendChild(line2);
  return svg;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// MODULE: FAKE INPUT FILLER
// ============================================================================

function initializeFakeFiller() {
  const btn = document.getElementById('fill-forms-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    showStatus('fakefiller-status', 'Injecting fake data...', 'info');

    try {
      if (!state.currentTab || !state.currentTab.id) {
        throw new Error('No active tab found. Please open a webpage.');
      }
      
      const response = await chrome.tabs.sendMessage(state.currentTab.id, {
        action: 'fillFakeData'
      });
      
      if (response && response.success) {
        showStatus('fakefiller-status', `Successfully filled ${response.count} input fields.`, 'success');
        showToast(`Filled ${response.count} fields!`, 'success');
      } else {
        throw new Error((response && response.error) || 'Failed to communicate with content script. Try reloading the page.');
      }
    } catch (e) {
      showStatus('fakefiller-status', `Error: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
      setTimeout(() => hideStatus('fakefiller-status'), 4000);
    }
  });
}

// ============================================================================
// RESIZER LOGIC
// ============================================================================

const POPUP_MIN_HEIGHT = 520;
const POPUP_DEFAULT_HEIGHT = 560;
const POPUP_MAX_HEIGHT_LIMIT = 600;

function getPopupMaxHeight() {
  return POPUP_MAX_HEIGHT_LIMIT;
}

async function restorePopupHeight() {
  if (isFullViewMode()) {
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    document.body.style.width = '100%';
    document.documentElement.style.width = '100%';
    return;
  }

  const data = await chrome.storage.local.get('dashboardHeight');
  applyPopupHeight(data.dashboardHeight || POPUP_DEFAULT_HEIGHT);
}

function applyPopupHeight(height) {
  const minHeight = POPUP_MIN_HEIGHT;
  const maxHeight = getPopupMaxHeight();
  // Ensure within bounds
  let finalHeight = Math.max(minHeight, Math.min(height, maxHeight));
  document.body.style.height = `${finalHeight}px`;
  document.documentElement.style.height = `${finalHeight}px`;
}

function initResizer() {
  const handle = document.getElementById('wg-resize-handle');
  if (!handle) return;

  if (isFullViewMode()) {
    handle.style.display = 'none';
    return;
  }

  let isResizing = false;
  let startY;
  let startHeight;

  const beginResize = (clientY) => {
    isResizing = true;
    startY = clientY;
    startHeight = document.documentElement.clientHeight || document.body.clientHeight;
    document.body.style.cursor = 'ns-resize';
    handle.classList.add('is-resizing');
  };

  const moveResize = (clientY) => {
    if (!isResizing) return;
    const deltaY = clientY - startY;
    const newHeight = startHeight + deltaY;
    applyPopupHeight(newHeight);
  };

  const endResize = async () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    handle.classList.remove('is-resizing');

    const finalHeight = document.documentElement.clientHeight || document.body.clientHeight;
    await chrome.storage.local.set({ dashboardHeight: finalHeight });
  };

  const pointerSupported = typeof window.PointerEvent !== 'undefined';
  if (pointerSupported) {
    handle.addEventListener('pointerdown', (e) => {
      beginResize(e.clientY);
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (_) {
        // Pointer capture may fail on some popup implementations.
      }
      e.preventDefault();
    });
  }

  handle.addEventListener('dblclick', (e) => {
    e.preventDefault();
    openFullViewDashboard();
  });

  handle.addEventListener('mousedown', (e) => {
    if (pointerSupported) return;
    beginResize(e.clientY);
    e.preventDefault();
  });

  handle.addEventListener('touchstart', (e) => {
    if (pointerSupported) return;
    if (!e.touches || !e.touches[0]) return;
    beginResize(e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('mousemove', (e) => {
    moveResize(e.clientY);
  });

  document.addEventListener('pointermove', (e) => {
    if (!pointerSupported) return;
    moveResize(e.clientY);
  });

  document.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    moveResize(e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('mouseup', async () => {
    if (pointerSupported) return;
    await endResize();
  });

  document.addEventListener('pointerup', async () => {
    if (!pointerSupported) return;
    await endResize();
  });

  document.addEventListener('touchend', async () => {
    if (pointerSupported) return;
    await endResize();
  });
}
