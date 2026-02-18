/**
 * WebGrenade v2.0 - Vertical Dashboard
 * Advanced Module System with Persistent Storage
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
  if  (config.apiKey && config.apiHost) {
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
  
  if (downloadHistory.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No downloads yet</div>';
    return;
  }
  
  historyList.innerHTML = downloadHistory
    .slice(-5)
    .reverse()
    .map(item => `
      <div class="history-item">
        <div class="history-item-content">
          <div class="history-item-title">${escapeHtml(item.title)}</div>
          <div class="history-item-meta">${item.format.toUpperCase()} • ${item.quality} • ${formatDate(item.timestamp)}</div>
        </div>
      </div>
    `).join('');
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
  
  container.innerHTML = '';
  
  try {
    new QRCode(container, {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (error) {
    console.error('QR generation error:', error);
  }
}

function downloadQRCode() {
  const canvas = document.querySelector('#qr-container canvas');
  if (!canvas) {
    showToast('No QR code to download', 'error');
    return;
  }
  
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.png';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ QR code downloaded!', 'success');
  });
}

async function loadLinkHistory() {
  const { linkHistory = [] } = await chrome.storage.local.get('linkHistory');
  const historyList = document.getElementById('link-history-list');
  
  if (!historyList) return;
  
  if (linkHistory.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No shortened links yet</div>';
    return;
  }
  
  historyList.innerHTML = linkHistory
    .slice(-5)
    .reverse()
    .map((item, index) => `
      <div class="history-item">
        <div class="history-item-content">
          <div class="history-item-title">${escapeHtml(item.shortened)}</div>
          <div class="history-item-meta">${formatDate(item.timestamp)}</div>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-icon link-copy-btn" data-url="${escapeHtml(item.shortened)}" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="btn btn-icon btn-danger link-delete-btn" data-index="${linkHistory.length - 1 - index}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
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
  
  if (colorHistory.length === 0) {
    grid.innerHTML = '<div class="empty-state">No colors picked yet</div>';
    return;
  }
  
  grid.innerHTML = colorHistory
    .slice(-10)
    .reverse()
    .map(color => `
      <div class="color-history-item" 
           style="background-color: ${color};" 
           data-color="${color}"
           title="Click to copy ${color}">
      </div>
    `).join('');
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
  
  if (cookies.length === 0) {
    cookieList.innerHTML = '<div class="empty-state">No cookies found</div>';
    return;
  }
  
  cookieList.innerHTML = cookies.map((cookie, index) => `
    <div class="cookie-item">
      <div class="cookie-item-header">
        <div class="cookie-item-name">${escapeHtml(cookie.name)}</div>
        <div class="cookie-item-actions">
          <button class="btn btn-icon cookie-edit-btn" data-index="${index}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn btn-icon btn-danger cookie-delete-btn" data-index="${index}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="cookie-item-value">${escapeHtml(cookie.value)}</div>
      <div class="cookie-item-meta">
        ${cookie.domain} • ${cookie.path} 
        ${cookie.secure ? '• 🔒 Secure' : ''} 
        ${cookie.httpOnly ? '• 🚫 HttpOnly' : ''}
      </div>
    </div>
  `).join('');
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
  document.getElementById('edit-cookie-value').value = editingCookie.value;
  document.getElementById('edit-cookie-domain').value = editingCookie.domain;
  document.getElementById('edit-cookie-path').value = editingCookie.path;
  document.getElementById('edit-cookie-secure').checked = editingCookie.secure;
  document.getElementById('edit-cookie-httponly').checked = editingCookie.httpOnly;
  
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
  const cookieData = {
    name: document.getElementById('edit-cookie-name').value,
    value: document.getElementById('edit-cookie-value').value,
    domain: document.getElementById('edit-cookie-domain').value,
    path: document.getElementById('edit-cookie-path').value,
    secure: document.getElementById('edit-cookie-secure').checked,
    httpOnly: document.getElementById('edit-cookie-httponly').checked,
    sameSite: document.getElementById('edit-cookie-samesite').value,
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
  
  if (rssFeeds.length === 0) {
    feedSelect.innerHTML = '<option value="">No feeds saved</option>';
    return;
  }
  
  feedSelect.innerHTML = rssFeeds.map(feed => 
    `<option value="${feed.url}">${escapeHtml(feed.title || feed.url)}</option>`
  ).join('');
  
  // Load first feed
  if (rssFeeds.length > 0) {
    fetchRSSFeed(rssFeeds[0].url);
  }
}

async function addRSSFeed() {
  const urlInput = document.getElementById('rss-feed-url');
  const url = urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a feed URL', 'warning');
    return;
  }
  
  const { rssFeeds = [] } = await chrome.storage.local.get('rssFeeds');
  
  // Check if already exists
  if (rssFeeds.some(feed => feed.url === url)) {
    showToast('Feed already saved', 'warning');
    return;
  }
  
  rssFeeds.push({
    url: url,
    title: url,
    addedAt: Date.now()
  });
  
  await chrome.storage.local.set({ rssFeeds });
  
  urlInput.value = '';
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
  
  feedList.innerHTML = '<div class="empty-state">Loading feed...</div>';
  
  try {
    // Use background script to fetch (avoids CORS)
    const response = await chrome.runtime.sendMessage({
      action: 'fetchRSS',
      url: url
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    displayRSSItems(response.items);
    
  } catch (error) {
    console.error('RSS fetch error:', error);
    feedList.innerHTML = '<div class="empty-state">❌ Failed to load feed</div>';
    showToast('❌ Failed to load feed', 'error');
  }
}

function displayRSSItems(items) {
  const feedList = document.getElementById('rss-feed-list');
  
  if (!feedList) return;
  
  if (!items || items.length === 0) {
    feedList.innerHTML = '<div class="empty-state">No items in feed</div>';
    return;
  }
  
  feedList.innerHTML = items.slice(0, 20).map(item => `
    <div class="rss-item" data-link="${escapeHtml(item.link)}">
      <div class="rss-item-title">${escapeHtml(item.title)}</div>
      <div class="rss-item-description">${escapeHtml(item.description || '')}</div>
      <div class="rss-item-meta">${item.pubDate ? formatDate(new Date(item.pubDate).getTime()) : ''}</div>
    </div>
  `).join('');
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
  
  // Popup Killer
  const popupToggle = document.getElementById('toggle-popup-killer');
  popupToggle?.addEventListener('change', async (e) => {
    await toggleUtility('popupKiller', e.target.checked);
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
  const trustSiteBtn = document.getElementById('trust-site-btn');
  trustSiteBtn?.addEventListener('click', addCurrentSiteToWhitelist);
  
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
  
  if (whitelist.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No whitelisted sites</div>';
  } else {
    listContainer.innerHTML = whitelist.map(entry => `
      <div class="whitelist-item">
        <div class="whitelist-domain">${escapeHtml(entry.domain)}</div>
        <div class="whitelist-date">Added: ${new Date(entry.addedAt).toLocaleDateString()}</div>
        <button class="btn-icon whitelist-remove-btn" data-domain="${escapeHtml(entry.domain)}" title="Remove">
          🗑️
        </button>
      </div>
    `).join('');
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
  } catch (e) {}
  
  function saveCount() {
    try {
      localStorage.setItem('webgrenade_blocked_' + domain, blockedCount.toString());
    } catch (e) {}
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
  
  window.open = function(...args) {
    // Allow specific user-initiated opens (within 1 second of click)
    const timeSinceLastClick = Date.now() - (window._lastUserClick || 0);
    if (timeSinceLastClick < 1000 && args[0]) {
      // Check if it's a legit URL
      try {
        const url = new URL(args[0], window.location.href);
        if (url.hostname === window.location.hostname) {
          return originalOpen.apply(this, args);
        }
      } catch (e) {}
    }
    
    blockPopup('Blocked window.open()');
    return null;
  };
  
  window.alert = function(...args) {
    // Block all alerts except on user click
    const timeSinceLastClick = Date.now() - (window._lastUserClick || 0);
    if (timeSinceLastClick < 500) {
      return originalAlert.apply(this, args);
    }
    blockPopup('Blocked alert()');
  };
  
  window.confirm = function() {
    blockPopup('Blocked confirm()');
    return false;
  };
  
  window.prompt = function() {
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
