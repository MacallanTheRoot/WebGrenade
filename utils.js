/**
 * Utility Functions for MediaGrab & LinkShare Pro
 * Modular helpers for YouTube parsing, QR generation, clipboard, and UI
 */

console.log('🟡 UTILS.JS LOADED');

/* ===========================
   YouTube URL Detection & Parsing
   =========================== */

/**
 * Check if a URL is from YouTube
 * @param {string} url - The URL to check
 * @returns {boolean} - True if YouTube URL
 */
function isYouTubeUrl(url) {
  if (!url) return false;
  const youtubePattern = /^https?:\/\/(www\.|m\.)?youtube\.com\/|^https?:\/\/youtu\.be\//;
  return youtubePattern.test(url);
}

/**
 * Extract video ID from various YouTube URL formats
 * Supports: watch?v=, shorts/, embed/, youtu.be/
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
function extractVideoId(url) {
  if (!url) return null;
  
  try {
    // Standard watch?v= format
    let match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) return match[1];
    
    // Shorts or embed format: /shorts/VIDEO_ID or /embed/VIDEO_ID
    match = url.match(/\/(shorts|embed)\/([^?&/]+)/);
    if (match && match[2]) return match[2];
    
    // Shortened youtu.be format
    match = url.match(/youtu\.be\/([^?&/]+)/);
    if (match && match[1]) return match[1];
    
    return null;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

/**
 * Build full YouTube watch URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Full YouTube URL
 */
function buildYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/* ===========================
   File Size Estimation
   =========================== */

/**
 * Estimate file size based on format and quality
 * Note: These are approximate values for typical YouTube videos
 * @param {string} format - 'mp4' or 'mp3'
 * @param {string} quality - '1080p', '720p', '360p'
 * @returns {string} - Human-readable size estimate
 */
function estimateFileSize(format, quality) {
  const sizeTable = {
    mp4: {
      '1080p': '~150 MB',
      '720p': '~80 MB',
      '360p': '~40 MB'
    },
    mp3: {
      '1080p': '~8 MB',  // Audio quality doesn't depend on video quality
      '720p': '~8 MB',
      '360p': '~8 MB'
    }
  };
  
  return sizeTable[format]?.[quality] || '~Unknown';
}

/* ===========================
   QR Code Generation
   =========================== */

/**
 * Generate QR code using qrcode.js library
 * Creates a QR code in the specified container
 * @param {string} containerId - ID of the DOM element to render QR code
 * @param {string} text - Text/URL to encode
 * @param {Object} options - QR code options
 * @returns {boolean} - Success status
 */
function generateQRCode(containerId, text, options = {}) {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return false;
    }
    
    // Clear existing QR code
    container.textContent = '';
    
    // Default options
    const qrOptions = {
      text: text || 'https://example.com',
      width: options.width || 200,
      height: options.height || 200,
      colorDark: options.colorDark || '#000000',
      colorLight: options.colorLight || '#ffffff',
      correctLevel: QRCode.CorrectLevel.H  // High error correction
    };
    
    // Generate QR code
    new QRCode(container, qrOptions);
    
    return true;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    // Show fallback message
    const container = document.getElementById(containerId);
    if (container) {
      container.textContent = '';
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: #737373; font-size: 13px; text-align: center; padding: 20px;';
      const line1 = document.createTextNode('QR Code generation failed.');
      const br = document.createElement('br');
      const line2 = document.createTextNode('Please check console for details.');
      errorDiv.appendChild(line1);
      errorDiv.appendChild(br);
      errorDiv.appendChild(line2);
      container.appendChild(errorDiv);
    }
    return false;
  }
}

/* ===========================
   Clipboard Operations
   =========================== */

/**
 * Copy text to clipboard using modern Clipboard API
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
  try {
    if (!navigator.clipboard) {
      // Fallback for browsers without Clipboard API
      return fallbackCopyToClipboard(text);
    }
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard write failed:', error);
    // Try fallback method
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback clipboard copy method using execCommand
 * @param {string} text - Text to copy
 * @returns {boolean} - Success status
 */
function fallbackCopyToClipboard(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error);
    return false;
  }
}

/* ===========================
   Toast Notifications
   =========================== */

/**
 * Show toast notification with auto-hide
 * @param {string} message - Message to display
 * @param {number} duration - Display duration in ms (default: 2000)
 * @param {string} type - Toast type: 'success', 'error', 'info' (default: 'success')
 */
function showToast(message, duration = 2000, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }
  
  // Update content and style
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  // Apply type-specific styling
  if (type === 'error') {
    toast.style.borderColor = '#ef4444';
    toast.style.color = '#ef4444';
  } else if (type === 'info') {
    toast.style.borderColor = '#3b82f6';
    toast.style.color = '#3b82f6';
  } else {
    toast.style.borderColor = '#22c55e';
    toast.style.color = '#22c55e';
  }
  
  // Auto-hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* ===========================
   Status Message Display
   =========================== */

/**
 * Show status message in a specific section
 * @param {string} elementId - ID of status message element
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'loading', 'error', 'success', 'info'
 */
function showStatus(elementId, message, type = 'info') {
  const statusElement = document.getElementById(elementId);
  if (!statusElement) {
    console.warn(`Status element '${elementId}' not found`);
    return;
  }
  
  statusElement.textContent = message;
  statusElement.className = `status-message visible ${type}`;
}

/**
 * Hide status message
 * @param {string} elementId - ID of status message element
 */
function hideStatus(elementId) {
  const statusElement = document.getElementById(elementId);
  if (statusElement) {
    statusElement.className = 'status-message';
  }
}

/* ===========================
   URL Validation & Formatting
   =========================== */

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Truncate URL for display
 * @param {string} url - URL to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} - Truncated URL
 */
function truncateUrl(url, maxLength = 50) {
  if (!url || url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

/**
 * Format URL by removing protocol and trailing slash
 * @param {string} url - URL to format
 * @returns {string} - Formatted URL
 */
function formatUrlDisplay(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/* ===========================
   Local Storage Helpers
   =========================== */

/**
 * Save data to chrome.storage.local
 * @param {Object} data - Key-value pairs to save
 * @returns {Promise<void>}
 */
async function saveToStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load data from chrome.storage.local
 * @param {string|string[]|null} keys - Key(s) to load, or null for all
 * @returns {Promise<Object>}
 */
async function loadFromStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

/* ===========================
   DOM Utilities
   =========================== */

/**
 * Toggle element visibility
 * @param {string} elementId - Element ID
 * @param {boolean} show - True to show, false to hide
 */
function toggleElement(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = show ? 'block' : 'none';
  }
}

/**
 * Add loading state to button
 * @param {string} buttonId - Button element ID
 * @param {boolean} loading - True to show loading, false to remove
 * @param {string} originalText - Original button text (optional)
 */
function setButtonLoading(buttonId, loading, originalText = '') {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = '';
    
    // Create SVG spinner
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'btn-icon');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.animation = 'spin 0.8s linear infinite';
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '4');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('opacity', '0.25');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2 A10 10 0 0 1 22 12');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('fill', 'none');
    
    svg.appendChild(circle);
    svg.appendChild(path);
    button.appendChild(svg);
    button.appendChild(document.createTextNode(' Loading...'));
  } else {
    button.disabled = false;
    button.textContent = originalText || button.dataset.originalText || 'Continue';
  }
}

/* ===========================
   Debugging Helpers
   =========================== */

/**
 * Log with timestamp (for debugging)
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Export for potential module usage (future-proofing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isYouTubeUrl,
    extractVideoId,
    buildYouTubeUrl,
    estimateFileSize,
    generateQRCode,
    copyToClipboard,
    showToast,
    showStatus,
    hideStatus,
    isValidUrl,
    truncateUrl,
    formatUrlDisplay,
    saveToStorage,
    loadFromStorage,
    toggleElement,
    setButtonLoading,
    debugLog
  };
}
