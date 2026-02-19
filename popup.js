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

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
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
    initializeSettings();
    initializeProFeatures();  // v3.0 Pro Features

    // Show initial module
    showModule('media');
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

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

function initializeSidebar() {
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');

  if (!sidebarButtons || sidebarButtons.length === 0) {
    return;
  }

  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleName = btn.dataset.module;
      showModule(moduleName);

      // Update active state
      sidebarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function showModule(moduleName) {
  state.activeModule = moduleName;

  // Hide all modules
  const allModules = document.querySelectorAll('.module-content');
  allModules.forEach(module => {
    module.classList.remove('active');
    module.style.display = 'none';
  });

  // Show selected module
  const targetModule = document.querySelector(`.module-content[data-module="${moduleName}"]`);
  if (targetModule) {
    targetModule.style.animation = 'none';
    targetModule.classList.add('active');
    targetModule.style.display = 'block';
    targetModule.style.opacity = '1';
    targetModule.style.visibility = 'visible';

    setTimeout(() => {
      targetModule.style.animation = '';
    }, 10);
  }

  // Module-specific initialization
  if (moduleName === 'media') {
    checkForYouTubeVideo();
    sniffPageVideos();          // v3.2: also scan for native HTML5 videos
  } else if (moduleName === 'link') {
    generateQRCode(state.currentUrl);
  } else if (moduleName === 'cookies') {
    loadCookies();
  } else if (moduleName === 'rss') {
    loadSavedFeeds();
  } else if (moduleName === 'utilities') {
    updateBlockedCountBadge();
  }
}

// ============================================================================
// MODULE 1: MEDIA CENTER
// ============================================================================

function initializeMediaCenter() {
  const downloadBtn = document.getElementById('download-btn');
  const formatSelect = document.getElementById('format-select');
  const qualitySelect = document.getElementById('quality-select');

  downloadBtn?.addEventListener('click', downloadVideo);

  formatSelect?.addEventListener('change', () => {
    // Toggle quality options based on format
    if (formatSelect.value === 'mp3') {
      qualitySelect.disabled = true;
    } else {
      qualitySelect.disabled = false;
    }
  });

  // Load download history
  loadDownloadHistory();
}

// v3.2: HTML5 Video Sniffer — ask content script for native <video> sources
async function sniffPageVideos() {
  const section = document.getElementById('native-video-section');
  const listEl = document.getElementById('native-video-list');
  if (!section || !listEl) return;

  // Hide section until we know there are results
  section.style.display = 'none';
  listEl.textContent = '';

  let response;
  try {
    response = await chrome.tabs.sendMessage(state.currentTab.id, { action: 'sniffVideos' });
  } catch {
    return; // content script not reachable (e.g., chrome:// page)
  }

  const videos = response?.videos;
  if (!videos || videos.length === 0) return;

  section.style.display = 'block';

  videos.forEach(({ label, urls }) => {
    const card = document.createElement('div');
    card.className = 'history-item';
    card.style.cssText = 'flex-direction:column;align-items:flex-start;gap:6px;padding:10px;';

    const labelEl = document.createElement('div');
    labelEl.className = 'history-item-title';
    labelEl.textContent = label;
    card.appendChild(labelEl);

    // Show the first URL as a direct link + download button
    const primaryUrl = urls[0];

    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn btn-secondary';
    openBtn.style.fontSize = '11px';
    openBtn.href = primaryUrl;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.textContent = '▶ Open';

    const dlBtn = document.createElement('a');
    dlBtn.className = 'btn btn-primary';
    dlBtn.style.fontSize = '11px';
    dlBtn.href = primaryUrl;
    dlBtn.download = label.replace(/[^a-z0-9 _-]/gi, '_').trim() || 'video';
    dlBtn.textContent = '⬇ Download';

    actionsRow.appendChild(openBtn);
    actionsRow.appendChild(dlBtn);
    card.appendChild(actionsRow);

    // If there are multiple source URLs, list them
    if (urls.length > 1) {
      urls.slice(1).forEach((u, i) => {
        const extraLink = document.createElement('a');
        extraLink.href = u;
        extraLink.target = '_blank';
        extraLink.rel = 'noopener';
        extraLink.className = 'btn-text';
        extraLink.style.fontSize = '10px';
        extraLink.textContent = `Source ${i + 2}: ${new URL(u).pathname.split('/').pop() || u}`;
        card.appendChild(extraLink);
      });
    }

    listEl.appendChild(card);
  });
}

async function checkForYouTubeVideo() {
  const url = state.currentUrl;

  if (!isYouTubeUrl(url)) {
    showStatus('media-status', '⚠️ Not a YouTube page', 'warning');
    document.getElementById('video-info')?.style.setProperty('display', 'none');
    document.getElementById('download-controls')?.style.setProperty('display', 'none');
    return;
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    showStatus('media-status', '❌ Could not extract video ID', 'error');
    return;
  }

  if (!state.apiConfig.configured) {
    showStatus('media-status', '⚠️ API not configured. Go to Settings.', 'warning');
    return;
  }

  hideStatus('media-status');
  await fetchVideoInfo(videoId);
}

async function fetchVideoInfo(videoId) {
  try {
    showStatus('media-status', '🔄 Loading video info...', 'info');

    const endpoint = `https://${state.apiConfig.host}/v2/video/details?videoId=${videoId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': state.apiConfig.key,
        'X-RapidAPI-Host': state.apiConfig.host
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    state.videoData = data;

    displayVideoInfo(data);
    hideStatus('media-status');

  } catch (error) {
    console.error('Video fetch error:', error);
    showStatus('media-status', `❌ Failed to load video: ${error.message}`, 'error');
  }
}

function displayVideoInfo(data) {
  const videoInfo = document.getElementById('video-info');
  const downloadControls = document.getElementById('download-controls');
  const thumbnail = document.getElementById('video-thumbnail');
  const title = document.getElementById('video-title');
  const videoUrl = document.getElementById('video-url');

  if (data.thumbnail) {
    thumbnail.src = data.thumbnail;
  }

  if (data.title) {
    title.textContent = data.title;
  }

  if (videoUrl) {
    videoUrl.textContent = state.currentUrl;
  }

  videoInfo.style.display = 'block';
  downloadControls.style.display = 'block';
}

async function downloadVideo() {
  const format = document.getElementById('format-select').value;
  const quality = document.getElementById('quality-select').value;

  if (!state.videoData) {
    showToast('No video data available', 'error');
    return;
  }

  // Find matching format/quality
  let downloadUrl = null;

  if (format === 'mp4' && state.videoData.formats) {
    const videoFormats = state.videoData.formats.filter(f => f.mimeType?.includes('video/mp4'));
    const matchingFormat = videoFormats.find(f => f.qualityLabel === quality) || videoFormats[0];
    downloadUrl = matchingFormat?.url;
  } else if (format === 'mp3' && state.videoData.audioFormats) {
    const audioFormat = state.videoData.audioFormats[0];
    downloadUrl = audioFormat?.url;
  }

  if (!downloadUrl) {
    showToast('Download URL not available', 'error');
    return;
  }

  // Open download in new tab
  await chrome.tabs.create({ url: downloadUrl, active: false });

  // Save to history
  await addToDownloadHistory({
    title: state.videoData.title || 'Unknown',
    url: state.currentUrl,
    format: format,
    quality: format === 'mp4' ? quality : 'Audio',
    timestamp: Date.now()
  });

  showToast('✅ Download started!', 'success');
  loadDownloadHistory();
}

async function loadDownloadHistory() {
  const { downloadHistory = [] } = await chrome.storage.local.get('downloadHistory');
  const historyList = document.getElementById('download-history-list');

  if (!historyList) return;

  historyList.textContent = '';

  if (downloadHistory.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No downloads yet';
    historyList.appendChild(emptyDiv);
    return;
  }

  const items = downloadHistory.slice(-5).reverse();

  items.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    const content = document.createElement('div');
    content.className = 'history-item-content';

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = item.title;

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';
    meta.textContent = `${item.format.toUpperCase()} • ${item.quality} • ${formatDate(item.timestamp)}`;

    content.appendChild(title);
    content.appendChild(meta);
    historyItem.appendChild(content);
    historyList.appendChild(historyItem);
  });
}

async function addToDownloadHistory(item) {
  const { downloadHistory = [] } = await chrome.storage.local.get('downloadHistory');
  downloadHistory.push(item);
  await chrome.storage.local.set({ downloadHistory });
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

  // Check if EyeDropper is supported
  if (!window.EyeDropper) {
    eyedropperBtn.disabled = true;
    eyedropperBtn.textContent = '❌ EyeDropper not supported';
    eyedropperBtn.title = 'EyeDropper API not available in this browser';
  } else {
    eyedropperBtn?.addEventListener('click', pickColor);
  }

  clearHistoryBtn?.addEventListener('click', clearColorHistory);

  // Copy Palette button — gathers saved colors, copies as CSV to clipboard
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

  // Event delegation for color history
  const colorGrid = document.getElementById('color-history-grid');
  colorGrid?.addEventListener('click', (e) => {
    const colorItem = e.target.closest('.color-history-item');
    if (colorItem) {
      const color = colorItem.dataset.color;
      copyToClipboard(color);
    }
  });

  loadColorHistory();
}

async function pickColor() {
  try {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    const color = result.sRGBHex;

    // Update display
    document.getElementById('color-preview').style.backgroundColor = color;
    document.getElementById('color-hex').value = color;
    document.getElementById('color-rgb').value = hexToRgb(color);

    // Add to history
    await addToColorHistory(color);

    // Copy to clipboard
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
  const generateBtn = document.getElementById('generate-password-btn');
  const copyBtn = document.getElementById('copy-password-btn');
  const lengthSlider = document.getElementById('password-length');
  const lengthValue = document.getElementById('password-length-value');

  // Initialize with a password
  generatePassword();

  generateBtn?.addEventListener('click', generatePassword);
  copyBtn?.addEventListener('click', () => {
    const password = document.getElementById('generated-password').value;
    if (password) {
      copyToClipboard(password);
      showToast('✅ Password copied!', 'success');
    }
  });

  lengthSlider?.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
    generatePassword();
  });

  // Re-generate on option change
  document.querySelectorAll('#include-uppercase, #include-lowercase, #include-numbers, #include-symbols')
    .forEach(checkbox => {
      checkbox.addEventListener('change', generatePassword);
    });
}

function generatePassword() {
  const length = parseInt(document.getElementById('password-length').value);
  const includeUppercase = document.getElementById('include-uppercase').checked;
  const includeLowercase = document.getElementById('include-lowercase').checked;
  const includeNumbers = document.getElementById('include-numbers').checked;
  const includeSymbols = document.getElementById('include-symbols').checked;

  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    document.getElementById('generated-password').value = '';
    updateStrengthMeter(0, 'none');
    return;
  }

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  document.getElementById('generated-password').value = password;

  // Calculate and display strength
  const strength = calculatePasswordStrength(password, charset.length);
  updateStrengthMeter(strength.score, strength.label);
}

function calculatePasswordStrength(password, charsetSize) {
  // Calculate entropy: log2(charsetSize^length)
  const entropy = password.length * Math.log2(charsetSize);

  let score = 0;
  let label = 'weak';

  if (entropy < 40) {
    score = 25;
    label = 'weak';
  } else if (entropy < 60) {
    score = 50;
    label = 'fair';
  } else if (entropy < 80) {
    score = 75;
    label = 'good';
  } else {
    score = 100;
    label = 'strong';
  }

  return { score, label, entropy };
}

function updateStrengthMeter(score, label) {
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  strengthBar.className = `strength-bar ${label}`;
  strengthText.className = `strength-text ${label}`;
  strengthText.textContent = label === 'none' ? '-' : label.toUpperCase();
}

// ============================================================================
// MODULE 5: COOKIE MANAGER (Professional Edition)
// ============================================================================

let currentCookies = [];
let editingCookie = null;

function initializeCookieManager() {
  const searchInput = document.getElementById('cookie-search');
  const addBtn = document.getElementById('add-cookie-btn');
  const deleteAllBtn = document.getElementById('delete-all-cookies-btn');
  const exportBtn = document.getElementById('export-cookies-btn');
  const importBtn = document.getElementById('import-cookies-btn');
  const saveCookieBtn = document.getElementById('save-cookie-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-cookie-btn');
  const formatBtn = document.getElementById('format-cookie-value-btn');
  const sessionCheckbox = document.getElementById('edit-cookie-session');
  const confirmImportBtn = document.getElementById('confirm-import-btn');
  const closeImportBtnX = document.getElementById('close-import-modal-x');
  const cancelImportBtn = document.getElementById('cancel-import-btn');

  searchInput?.addEventListener('input', (e) => {
    filterCookies(e.target.value);
  });

  addBtn?.addEventListener('click', showAddCookieForm);
  deleteAllBtn?.addEventListener('click', deleteAllCookies);
  exportBtn?.addEventListener('click', exportCookiesToJSON);
  importBtn?.addEventListener('click', openImportModal);
  saveCookieBtn?.addEventListener('click', saveCookie);
  cancelEditBtn?.addEventListener('click', cancelEdit);
  formatBtn?.addEventListener('click', formatCookieValue);
  confirmImportBtn?.addEventListener('click', importCookiesFromJSON);
  closeImportBtnX?.addEventListener('click', closeImportModal);
  cancelImportBtn?.addEventListener('click', closeImportModal);

  // Event delegation for cookie list actions
  const cookieList = document.getElementById('cookie-list');
  cookieList?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.cookie-edit-btn');
    const deleteBtn = e.target.closest('.cookie-delete-btn');

    if (editBtn) {
      const index = parseInt(editBtn.dataset.index);
      editCookie(index);
    } else if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index);
      deleteCookie(index);
    }
  });

  // Toggle expiry date picker based on session checkbox
  sessionCheckbox?.addEventListener('change', (e) => {
    const expiryGroup = document.getElementById('cookie-expiry-group');
    if (expiryGroup) {
      expiryGroup.style.display = e.target.checked ? 'none' : 'block';
    }
  });
}

async function loadCookies() {
  const domain = new URL(state.currentUrl).hostname;
  const domainDisplay = document.getElementById('cookie-domain-display');
  if (domainDisplay) {
    domainDisplay.textContent = domain;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getCookies',
      url: state.currentUrl
    });

    currentCookies = response.cookies || [];
    displayCookies(currentCookies);

  } catch (error) {
    console.error('Cookie load error:', error);
    showToast('❌ Failed to load cookies', 'error');
  }
}

function displayCookies(cookies) {
  const cookieList = document.getElementById('cookie-list');

  if (!cookieList) return;

  cookieList.textContent = '';

  if (cookies.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No cookies found';
    cookieList.appendChild(emptyDiv);
    return;
  }

  cookies.forEach((cookie, index) => {
    const cookieItem = document.createElement('div');
    cookieItem.className = 'cookie-item';

    const header = document.createElement('div');
    header.className = 'cookie-item-header';

    const name = document.createElement('div');
    name.className = 'cookie-item-name';
    name.textContent = cookie.name;

    const actions = document.createElement('div');
    actions.className = 'cookie-item-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-icon cookie-edit-btn';
    editBtn.setAttribute('data-index', String(index));
    editBtn.setAttribute('title', 'Edit');
    editBtn.appendChild(createEditIconSVG());

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon btn-danger cookie-delete-btn';
    deleteBtn.setAttribute('data-index', String(index));
    deleteBtn.setAttribute('title', 'Delete');
    deleteBtn.appendChild(createCloseIconSVG());

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(name);
    header.appendChild(actions);

    const value = document.createElement('div');
    value.className = 'cookie-item-value';
    value.textContent = cookie.value;

    const meta = document.createElement('div');
    meta.className = 'cookie-item-meta';
    let metaText = `${cookie.domain} • ${cookie.path}`;
    if (cookie.secure) metaText += ' • 🔒 Secure';
    if (cookie.httpOnly) metaText += ' • 🚫 HttpOnly';
    meta.textContent = metaText;

    cookieItem.appendChild(header);
    cookieItem.appendChild(value);
    cookieItem.appendChild(meta);
    cookieList.appendChild(cookieItem);
  });
}

function filterCookies(query) {
  const lowerQuery = query.toLowerCase();
  const filtered = currentCookies.filter(cookie =>
    cookie.name.toLowerCase().includes(lowerQuery) ||
    cookie.domain.toLowerCase().includes(lowerQuery)
  );
  displayCookies(filtered);
}

// Export Cookies to JSON
async function exportCookiesToJSON() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getCookies',
      url: state.currentUrl
    });

    const cookies = response.cookies || [];

    if (cookies.length === 0) {
      showToast('No cookies to export', 'warning');
      return;
    }

    // Create clean export format
    const exportData = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      expirationDate: c.expirationDate
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    await copyToClipboard(jsonString);
    showToast(`✅ ${cookies.length} cookies exported to clipboard!`, 'success');

  } catch (error) {
    console.error('Export error:', error);
    showToast('❌ Failed to export cookies', 'error');
  }
}

// Open Import Modal
function openImportModal() {
  const modal = document.getElementById('import-modal');
  modal.style.display = 'flex';
  document.getElementById('import-json-textarea').value = '';
  document.getElementById('import-json-textarea').focus();

  // Close on overlay click
  setTimeout(() => {
    modal.onclick = (e) => {
      if (e.target === modal) closeImportModal();
    };
  }, 0);
}

// Close Import Modal
function closeImportModal() {
  const modal = document.getElementById('import-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.onclick = null;
  }
}

// Import Cookies from JSON
async function importCookiesFromJSON() {
  const textarea = document.getElementById('import-json-textarea');
  const jsonText = textarea.value.trim();

  if (!jsonText) {
    showToast('Please paste JSON data', 'warning');
    return;
  }

  try {
    const cookies = JSON.parse(jsonText);

    if (!Array.isArray(cookies)) {
      throw new Error('JSON must be an array of cookies');
    }

    let imported = 0;
    let errors = 0;

    for (const cookie of cookies) {
      try {
        const cookieData = {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || new URL(state.currentUrl).hostname,
          path: cookie.path || '/',
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || 'lax',
          url: state.currentUrl
        };

        if (cookie.expirationDate) {
          cookieData.expirationDate = cookie.expirationDate;
        }

        await chrome.runtime.sendMessage({
          action: 'setCookie',
          cookie: cookieData
        });

        imported++;
      } catch (err) {
        console.error('Failed to import cookie:', cookie.name, err);
        errors++;
      }
    }

    closeImportModal();
    showToast(`✅ Imported ${imported} cookies${errors > 0 ? ` (${errors} failed)` : ''}`, 'success');
    loadCookies();

  } catch (error) {
    console.error('Import parse error:', error);
    showToast('❌ Invalid JSON format', 'error');
  }
}

// Format Cookie Value (prettify JSON or decode URI)
function formatCookieValue() {
  const textarea = document.getElementById('edit-cookie-value');
  let value = textarea.value;

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(value);
    textarea.value = JSON.stringify(parsed, null, 2);
    showToast('✅ Formatted as JSON', 'success');
  } catch (e) {
    // Not JSON, try URL decoding
    try {
      const decoded = decodeURIComponent(value);
      if (decoded !== value) {
        textarea.value = decoded;
        showToast('✅ URL decoded', 'success');
      } else {
        showToast('Value is already decoded', 'info');
      }
    } catch (err) {
      showToast('Cannot format this value', 'warning');
    }
  }
}

function editCookie(index) {
  editingCookie = currentCookies[index];

  document.getElementById('edit-cookie-name').value = editingCookie.name;
  // v3.0: Decode URL-encoded values for display
  let displayValue = editingCookie.value;
  try { displayValue = decodeURIComponent(editingCookie.value); } catch (_) { }
  document.getElementById('edit-cookie-value').value = displayValue;
  document.getElementById('edit-cookie-domain').value = editingCookie.domain;
  document.getElementById('edit-cookie-path').value = editingCookie.path;
  document.getElementById('edit-cookie-secure').checked = !!editingCookie.secure;
  document.getElementById('edit-cookie-httponly').checked = !!editingCookie.httpOnly;

  const isSession = !editingCookie.expirationDate;
  document.getElementById('edit-cookie-session').checked = isSession;

  // Show/hide expiry date input
  const expiryGroup = document.getElementById('cookie-expiry-group');
  if (expiryGroup) {
    expiryGroup.style.display = isSession ? 'none' : 'block';
  }

  // Set expiry date if not session
  if (!isSession && editingCookie.expirationDate) {
    const expiryInput = document.getElementById('edit-cookie-expiry');
    const date = new Date(editingCookie.expirationDate * 1000);
    expiryInput.value = date.toISOString().slice(0, 16);
  }

  const sameSite = editingCookie.sameSite || 'no_restriction';
  document.getElementById('edit-cookie-samesite').value = sameSite;

  document.getElementById('cookie-edit-form').style.display = 'block';
  document.getElementById('cookie-edit-form').scrollIntoView({ behavior: 'smooth' });
}

function showAddCookieForm() {
  editingCookie = null;

  const domain = new URL(state.currentUrl).hostname;

  document.getElementById('edit-cookie-name').value = '';
  document.getElementById('edit-cookie-value').value = '';
  document.getElementById('edit-cookie-domain').value = domain;
  document.getElementById('edit-cookie-path').value = '/';
  document.getElementById('edit-cookie-secure').checked = true;
  document.getElementById('edit-cookie-httponly').checked = false;
  document.getElementById('edit-cookie-session').checked = true;
  document.getElementById('edit-cookie-samesite').value = 'lax';

  // Hide expiry picker by default
  const expiryGroup = document.getElementById('cookie-expiry-group');
  if (expiryGroup) expiryGroup.style.display = 'none';

  document.getElementById('edit-cookie-name').readOnly = false;
  document.getElementById('cookie-edit-form').style.display = 'block';
  document.getElementById('cookie-edit-form').scrollIntoView({ behavior: 'smooth' });
}

async function saveCookie() {
  // v3.0: Re-encode value if it was decoded on display
  let rawValue = document.getElementById('edit-cookie-value').value;
  // Only encode if the stored original was encoded (re-encode to match server expectation)
  const cookieData = {
    name: document.getElementById('edit-cookie-name').value,
    value: rawValue,
    domain: document.getElementById('edit-cookie-domain').value,
    path: document.getElementById('edit-cookie-path').value,
    secure: document.getElementById('edit-cookie-secure').checked,
    httpOnly: document.getElementById('edit-cookie-httponly').checked,
    sameSite: document.getElementById('edit-cookie-samesite').value,
    session: document.getElementById('edit-cookie-session').checked,
    url: state.currentUrl
  };

  const isSession = document.getElementById('edit-cookie-session').checked;
  if (!isSession) {
    const expiryInput = document.getElementById('edit-cookie-expiry');
    if (expiryInput && expiryInput.value) {
      // Convert datetime-local to timestamp
      const expiryDate = new Date(expiryInput.value);
      cookieData.expirationDate = Math.floor(expiryDate.getTime() / 1000);
    } else {
      // Fallback to 1 year if no date selected
      cookieData.expirationDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
    }
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'setCookie',
      cookie: cookieData
    });

    showToast('✅ Cookie saved!', 'success');
    cancelEdit();
    loadCookies();

  } catch (error) {
    console.error('Cookie save error:', error);
    showToast('❌ Failed to save cookie', 'error');
  }
}

function cancelEdit() {
  editingCookie = null;
  document.getElementById('cookie-edit-form').style.display = 'none';
}

async function deleteCookie(index) {
  const cookie = currentCookies[index];

  try {
    await chrome.runtime.sendMessage({
      action: 'deleteCookie',
      name: cookie.name,
      url: state.currentUrl
    });

    showToast('Cookie deleted', 'success');
    loadCookies();

  } catch (error) {
    console.error('Cookie delete error:', error);
    showToast('❌ Failed to delete cookie', 'error');
  }
}

async function deleteAllCookies() {
  if (!confirm('Delete all cookies for this site?')) return;

  try {
    await chrome.runtime.sendMessage({
      action: 'deleteAllCookies',
      url: state.currentUrl
    });

    showToast('All cookies deleted', 'success');
    loadCookies();

  } catch (error) {
    console.error('Cookie delete error:', error);
    showToast('❌ Failed to delete cookies', 'error');
  }
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

  // ── Phase 1: Try as a direct feed URL first ───────────────────────────────
  // If it already looks like an XML/feed path, skip HTML discovery
  const looksLikeFeed = /\.xml$|\/feed|rss|atom/i.test(inputUrl);

  let feedUrl = inputUrl;

  if (!looksLikeFeed) {
    // ── Phase 2: Auto-Discovery ─────────────────────────────────────────────
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

  // ── Phase 3: Save and load the resolved feed URL ──────────────────────────
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

  // Markdown Copier (button)
  const markdownBtn = document.getElementById('copy-markdown-btn');
  markdownBtn?.addEventListener('click', copyAsMarkdown);

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

async function copyAsMarkdown() {
  const title = state.currentTab.title;
  const url = state.currentUrl;
  const markdown = `[${title}](${url})`;

  await copyToClipboard(markdown);
  showToast('✅ Copied as Markdown!', 'success');
}

// ============================================================================
// MODULE 8: SETTINGS
// ============================================================================

// ============================================================================
// PRO FEATURES INIT (v3.0)
// ============================================================================

// UA Profiles
const UA_PROFILES = {
  'default': '',
  'chrome-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'firefox-mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  'safari-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'edge-win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
};

function initializeProFeatures() {
  // ── (Ad Blocker removed in v3.1) ─────────────────────────────────────────

  // ── Dark Mode Toggle ─────────────────────────────────────────────────────
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

  // ── Volume Booster Slider ────────────────────────────────────────────────
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
      const resp = await chrome.tabs.sendMessage(state.currentTab.id, { action: 'setVolume', level });
      if (resp && resp.count > 0) {
        showToast(`🔊 Volume set to ${level}% (${resp.count} element${resp.count > 1 ? 's' : ''})`, 'success');
      } else if (resp && !resp.success) {
        showToast('⚠️ ' + (resp.error || 'No media found on page'), 'warning');
      }
    } catch (_) {
      // Fallback: inject inline
      await chrome.scripting.executeScript({
        target: { tabId: state.currentTab.id },
        func: (gainValue) => {
          document.querySelectorAll('video, audio').forEach(el => {
            try {
              if (!el._wgAudioCtx) {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const src = ctx.createMediaElementSource(el);
                const gain = ctx.createGain();
                src.connect(gain);
                gain.connect(ctx.destination);
                el._wgGainNode = gain;
                el._wgAudioCtx = ctx;
              }
              el._wgGainNode.gain.value = gainValue;
            } catch (e) { }
          });
        },
        args: [level / 100]
      });
      showToast(`🔊 Volume set to ${level}%`, 'success');
    }
  });

  // ── History Cleaner ──────────────────────────────────────────────────────
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

  // ── Restore persisted pro feature states ─────────────────────────────────
  chrome.storage.local.get(['darkModeEnabled', 'popupBlockerEnabled', 'volumeLevel', 'selectedUA'], (r) => {
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
    if (r.selectedUA) {
      const sel = document.getElementById('ua-switcher');
      if (sel) sel.value = r.selectedUA;
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

  // ── UA Switcher ────────────────────────────────────────────────────────────
  const uaSelect = document.getElementById('ua-switcher');
  uaSelect?.addEventListener('change', async (e) => {
    const profileKey = e.target.value;
    const uaString = UA_PROFILES[profileKey] || '';
    await chrome.storage.local.set({ selectedUA: profileKey, customUA: uaString });
    await chrome.runtime.sendMessage({ action: 'setUserAgent', ua: uaString });
    if (isInjectableUrl(state.currentUrl)) {
      try { await chrome.tabs.sendMessage(state.currentTab.id, { action: 'setUA', ua: uaString }); } catch (_) { }
    }
    showToast(`🎭 UA → ${profileKey === 'default' ? 'Default' : profileKey}`, 'success');
    const maskToggle = document.getElementById('toggle-browser-mask');
    if (maskToggle) maskToggle.checked = false;
  });

  // ── Browser Mask Toggle ────────────────────────────────────────────────────
  const browserMaskToggle = document.getElementById('toggle-browser-mask');
  browserMaskToggle?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    if (!enabled) {
      await chrome.runtime.sendMessage({ action: 'setUserAgent', ua: 'default' });
      await chrome.storage.local.set({ selectedUA: 'default', customUA: '' });
      const uaSel = document.getElementById('ua-switcher');
      if (uaSel) uaSel.value = 'default';
      showToast('🎭 Browser Mask OFF — UA restored', 'info');
      return;
    }
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg/');
    const swapKey = isChrome ? 'firefox-mac' : 'chrome-win';
    const swapUA = UA_PROFILES[swapKey];
    await chrome.runtime.sendMessage({ action: 'setUserAgent', ua: swapUA });
    await chrome.storage.local.set({ selectedUA: swapKey, customUA: swapUA });
    if (isInjectableUrl(state.currentUrl)) {
      try { await chrome.tabs.sendMessage(state.currentTab.id, { action: 'setUA', ua: swapUA }); } catch (_) { }
    }
    const uaSel = document.getElementById('ua-switcher');
    if (uaSel) uaSel.value = swapKey;
    showToast(`🔄 Masking as ${swapKey}`, 'success');
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

// ── About version string update ───────────────────────────────────────────
// Version bumped to 3.0.0 in popup.html about section
