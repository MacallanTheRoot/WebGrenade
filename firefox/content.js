/**
 * WebGrenade v3.2.1 — Content Script
 * Runs at document_start on all URLs.
 * Handles: Dark Mode, Volume Booster (+ Firefox AudioContext fix), Popup Blocker
 *          (CSP-safe via inject.js), User-Agent Override, Video Sniffer,
 *          Genius Lyrics metadata detection, EyeDropper polyfill (Firefox).
 * STRICT: No innerHTML anywhere. All DOM via createElement/textContent.
 */

(function () {
    'use strict';

    // globals
    let popupBlockerActive = false;
    let mutationObserver = null;
    const audioContextMap = new WeakMap(); // maps media els to audio graphs

    // eyedropper state
    let eyedropperKeyHandler = null;

    // popup blocker injection logic

    // injects main-world script via src to bypass csp
// guards with data attribute to prevent double init
    function injectViaScriptSrc() {
        // Guard: mark documentElement so we don't inject twice
        if (document.documentElement && document.documentElement.dataset.wgInjected === '1') return;

        function _doInject() {
            if (document.documentElement.dataset.wgInjected === '1') return;
            document.documentElement.dataset.wgInjected = '1';

            const s = document.createElement('script');
            s.src = chrome.runtime.getURL('inject.js');
            s.onload = () => s.remove();
            s.onerror = () => {
                // src-load failed (should never happen for a web_accessible_resource)
                // Reset the guard so a retry is possible
                delete document.documentElement.dataset.wgInjected;
                s.remove();
            };
            // prepend() ensures execution BEFORE existing child scripts
            document.documentElement.prepend(s);
        }

        if (document.documentElement) {
            _doInject();
        } else {
            // document_start edge case: documentElement not yet created
            const obs = new MutationObserver(() => {
                if (document.documentElement) {
                    obs.disconnect();
                    _doInject();
                }
            });
            obs.observe(document, { childList: true });
        }
    }

    /**
     * Signal inject.js to restore window.open and remove all its event listeners.
     */
    function disableViaEvent() {
        window.dispatchEvent(new Event('__wgDisablePopupBlocker'));
        // Also clear the injection guard so re-enable works on the same page load
        if (document.documentElement) {
            delete document.documentElement.dataset.wgInjected;
        }
    }

    // naive modal hider based on z-index and keywords
    function startOverlayObserver() {
        if (mutationObserver) return;

        const overlayKeywords = /subscribe|newsletter|sign.?up|notification|cookie.?consent|gdpr|accept.?all|manage.?preferences/i;
        const safeRoles = new Set(['navigation', 'banner', 'contentinfo', 'menubar', 'menu', 'toolbar']);
        const safeTags = new Set(['NAV', 'HEADER', 'FOOTER', 'ASIDE']);

        mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    try {
                        if (safeTags.has(node.tagName)) return;
                        const role = (node.getAttribute('role') || '').toLowerCase();
                        if (safeRoles.has(role)) return;

                        const cs = window.getComputedStyle(node);
                        const zIndex = parseInt(cs.zIndex, 10);
                        if (cs.position !== 'fixed' || !(zIndex > 999)) return;

                        const text = (node.textContent || '').slice(0, 1000);
                        if (!overlayKeywords.test(text)) return;

                        node.style.setProperty('display', 'none', 'important');
                        console.log('[WebGrenade] Overlay modal hidden —', node.tagName, zIndex);
                    } catch (_) { }
                });
            });
        });

        const target = document.body || document.documentElement;
        if (target) mutationObserver.observe(target, { childList: true, subtree: true });
    }

    // Firefox doesn\'t support EyeDropper API yet, so we have to draw a screenshot onto a canvas and pick the pixel.

    function stopEyedropperPolyfill() {
        const c = document.getElementById('wg-eyedropper-canvas');
        if (c) c.remove();
        const t = document.getElementById('wg-eyedropper-tooltip');
        if (t) t.remove();
        if (eyedropperKeyHandler) {
            document.removeEventListener('keydown', eyedropperKeyHandler, { capture: true });
            eyedropperKeyHandler = null;
        }
    }

    function startEyedropperPolyfill() {
        // Cleanup any previous instance first
        stopEyedropperPolyfill();

        // Ask background.js for a PNG screenshot of the visible tab area
        chrome.runtime.sendMessage({ action: 'captureTab' }, (response) => {
            if (!response || response.error || !response.dataUrl) {
                chrome.runtime.sendMessage({
                    action: 'eyedropperResult',
                    color: null,
                    error: response ? response.error : 'No response from background'
                });
                return;
            }

            const img = new Image();
            img.onload = () => {
                // Build full-viewport canvas overlay
                const canvas = document.createElement('canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                canvas.style.cssText = [
                    'position:fixed',
                    'top:0',
                    'left:0',
                    'width:100vw',
                    'height:100vh',
                    'z-index:2147483646',
                    'cursor:crosshair',
                    'image-rendering:pixelated',
                ].join(';');
                canvas.id = 'wg-eyedropper-canvas';

                const ctx2d = canvas.getContext('2d');
                ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Floating hex tooltip
                const tooltip = document.createElement('div');
                tooltip.id = 'wg-eyedropper-tooltip';
                tooltip.style.cssText = [
                    'position:fixed',
                    'z-index:2147483647',
                    'background:#0a0a0a',
                    'border:1px solid #ff6b00',
                    'border-radius:6px',
                    'padding:4px 10px',
                    'font-family:monospace',
                    'font-size:12px',
                    'color:#fff',
                    'pointer-events:none',
                    'display:none',
                    'white-space:nowrap',
                ].join(';');

                function getPixelHex(x, y) {
                    const px = ctx2d.getImageData(x, y, 1, 1).data;
                    return '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('');
                }

                // Update tooltip color on mouse move
                canvas.addEventListener('mousemove', (e) => {
                    const hex = getPixelHex(e.clientX, e.clientY);
                    tooltip.textContent = hex;
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.clientX + 16) + 'px';
                    tooltip.style.top = (e.clientY + 16) + 'px';
                });

                // Click: pick color, clean up, return result to popup
                canvas.addEventListener('click', (e) => {
                    const hex = getPixelHex(e.clientX, e.clientY);
                    stopEyedropperPolyfill();
                    chrome.runtime.sendMessage({ action: 'eyedropperResult', color: hex });
                });

                // Escape: cancel picker
                eyedropperKeyHandler = (e) => {
                    if (e.key === 'Escape') {
                        stopEyedropperPolyfill();
                        chrome.runtime.sendMessage({ action: 'eyedropperResult', color: null });
                    }
                };
                document.addEventListener('keydown', eyedropperKeyHandler, { capture: true, once: true });

                document.documentElement.appendChild(canvas);
                document.documentElement.appendChild(tooltip);
            };

            img.onerror = () => {
                chrome.runtime.sendMessage({ action: 'eyedropperResult', color: null, error: 'Image load failed' });
            };

            img.src = response.dataUrl;
        });
    }

    // msg router
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {

            
            case 'enableDarkMode': {
                let el = document.getElementById('wg-dark-mode');
                if (!el) {
                    el = document.createElement('style');
                    el.id = 'wg-dark-mode';
                    el.textContent = [
                        'html { filter: invert(1) hue-rotate(180deg) !important; }',
                        'img, video, picture, canvas, svg, iframe { filter: invert(1) hue-rotate(180deg) !important; }'
                    ].join('\n');
                    (document.head || document.documentElement).appendChild(el);
                }
                sendResponse({ success: true });
                break;
            }

            case 'disableDarkMode': {
                const el = document.getElementById('wg-dark-mode');
                if (el) el.remove();
                sendResponse({ success: true });
                break;
            }

            
            // Firefox audio ctx bug: requires immediate resume
            case 'setVolume': {
                const gainValue = Math.max(0, Math.min(5, (request.level || 100) / 100));
                const mediaEls = Array.from(document.querySelectorAll('video, audio'));

                if (mediaEls.length === 0) {
                    sendResponse({ success: false, error: 'No media elements found on page' });
                    break;
                }

                mediaEls.forEach(el => {
                    try {
                        if (audioContextMap.has(el)) {
                            const entry = audioContextMap.get(el);
                            entry.gainNode.gain.value = gainValue;
                            // hack for firefox suspended ctx
                            if (entry.ctx.state === 'suspended') {
                                entry.ctx.resume().catch(err =>
                                    console.warn('[WebGrenade] ctx.resume():', err.message));
                            }
                        } else {
                            // first run: setup audio graph
                            const AudioCtx = window.AudioContext || window.webkitAudioContext;
                            const ctx = new AudioCtx();
                            const source = ctx.createMediaElementSource(el);
                            const gainNode = ctx.createGain();
                            gainNode.gain.value = gainValue;
                            source.connect(gainNode);
                            gainNode.connect(ctx.destination);
                            audioContextMap.set(el, { ctx, gainNode, source });

                            // ── Firefox fix: resume suspended context immediately ──
                            ctx.resume().catch(err =>
                                console.warn('[WebGrenade] ctx.resume():', err.message));
                        }
                    } catch (e) {
                        console.warn('[WebGrenade] VolumeBooster:', e.message);
                    }
                });

                sendResponse({ success: true, count: mediaEls.length });
                break;
            }

            // resets gain without destroying the graph
            case 'resetVolume': {
                const mediaEls = Array.from(document.querySelectorAll('video, audio'));
                mediaEls.forEach(el => {
                    if (audioContextMap.has(el)) {
                        audioContextMap.get(el).gainNode.gain.value = 1.0;
                    }
                });
                sendResponse({ success: true });
                break;
            }

            
            case 'enablePopupBlocker': {
                if (popupBlockerActive) { sendResponse({ success: true }); break; }
                popupBlockerActive = true;
                injectViaScriptSrc();   // loads inject.js into main world (CSP-safe)
                startOverlayObserver(); // runs in isolated world (CSS visibility)
                sendResponse({ success: true });
                break;
            }

            case 'disablePopupBlocker': {
                popupBlockerActive = false;
                disableViaEvent(); // signal inject.js to cleanup
                if (mutationObserver) {
                    mutationObserver.disconnect();
                    mutationObserver = null;
                }
                sendResponse({ success: true });
                break;
            }

            // video element sniffer
            case 'sniffVideos': {
                const videoEls = Array.from(document.querySelectorAll('video'));
                const results = [];

                videoEls.forEach((el, idx) => {
                    const candidates = new Set();
                    if (el.src) candidates.add(el.src);
                    if (el.currentSrc) candidates.add(el.currentSrc);
                    el.querySelectorAll('source[src]').forEach(s => { if (s.src) candidates.add(s.src); });

                    const mediaUrls = Array.from(candidates).filter(u => {
                        if (!u || u === window.location.href) return false;
                        if (/^blob:/i.test(u) || /^data:/i.test(u)) return false;
                        return true;
                    });

                    if (mediaUrls.length === 0) return;

                    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title') || '';
                    const nearTitle = el.closest('[data-title]')?.dataset.title ||
                        el.closest('article,section,figure')?.querySelector('h1,h2,h3,h4,figcaption')?.textContent ||
                        '';
                    const label = (ariaLabel || nearTitle || ('Video ' + (idx + 1))).trim().slice(0, 80);
                    results.push({ label, urls: mediaUrls });
                });

                sendResponse({ videos: results });
                break;
            }

            // naive client UA spoof
            case 'setUA': {
                if (request.ua && request.ua !== 'default') {
                    try {
                        Object.defineProperty(navigator, 'userAgent', {
                            get: () => request.ua,
                            configurable: true
                        });
                        sendResponse({ success: true });
                    } catch (e) {
                        sendResponse({ success: false, error: e.message });
                    }
                } else {
                    sendResponse({ success: true });
                }
                break;
            }

            // scrapes song info from the current page
            case 'getMediaMeta': {
                let artist = '';
                let title = '';

                // 1. Media Session API — the most reliable source (music sites set this)
                try {
                    const meta = navigator.mediaSession && navigator.mediaSession.metadata;
                    if (meta) {
                        artist = meta.artist || '';
                        title = meta.title || '';
                    }
                } catch (_) { }

                // 2. YouTube-specific DOM (watch page)
                if (!title) {
                    const ytEl = document.querySelector(
                        'h1.ytd-watch-metadata yt-formatted-string,' +
                        'ytd-watch-flexy h1 .ytd-watch-metadata'
                    );
                    if (ytEl) title = ytEl.textContent.trim();
                }

                // 3. OpenGraph / Twitter card meta tags
                if (!title) {
                    const ogEl = document.querySelector(
                        'meta[property="og:title"], meta[name="twitter:title"]'
                    );
                    if (ogEl) title = (ogEl.getAttribute('content') || '').trim();
                }

                // 4. Page <title> — strip " — SiteName" suffix patterns
                if (!title) {
                    title = document.title.replace(/\s[—\-|·•]\s.+$/, '').trim();
                }

                // 5. Artist fallback: og:site_name
                if (!artist) {
                    const siteEl = document.querySelector('meta[property="og:site_name"]');
                    if (siteEl) artist = (siteEl.getAttribute('content') || '').trim();
                }

                sendResponse({ artist: artist.slice(0, 200), title: title.slice(0, 200) });
                break;
            }

            
            case 'startEyedropperPolyfill': {
                startEyedropperPolyfill();
                sendResponse({ success: true });
                break;
            }

            case 'stopEyedropperPolyfill': {
                stopEyedropperPolyfill();
                sendResponse({ success: true });
                break;
            }

            
            case 'fillFakeData': {
                let filledCount = 0;
                try {
                    const rStr = () => Math.random().toString(36).substring(2, 8);
                    const rNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                    const rItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
                    
                    const f_firsts = ["John", "Emma", "Michael", "Sophia", "David", "Olivia", "James", "Isabella", "William", "Lucas", "Mia", "Amelia"];
                    const f_lasts  = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"];
                    
                    const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
                    
                    const textInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="radio"]):not([type="checkbox"])');
                    
                    textInputs.forEach(el => {
                        if (!isVisible(el) || el.readOnly || el.disabled) return;
                        let val = "";
                        const t = el.type.toLowerCase();
                        const n = (el.name || el.id || '').toLowerCase();
                        
                        if (t === 'email' || n.includes('email')) {
                            val = `test.${rStr()}@example.com`;
                        } else if (t === 'password' || n.includes('pass')) {
                            val = `Str0ngP@ss${rNum(100,999)}!`;
                        } else if (t === 'tel' || n.includes('phone') || n.includes('tel') || n.includes('mobile')) {
                            val = `555${rNum(1000000, 9999999)}`;
                        } else if (t === 'number' || n.includes('age') || n.includes('amount') || n.includes('price')) {
                            let min = parseFloat(el.getAttribute('min'));
                            let max = parseFloat(el.getAttribute('max'));
                            if (isNaN(min)) min = 0;
                            if (isNaN(max)) max = 1000;
                            if (max < min) max = min + 100;
                            val = String(rNum(Math.max(min,0), max));
                        } else if (t === 'url' || n.includes('website') || n.includes('url') || n.includes('link')) {
                            val = `https://www.${rStr()}.com`;
                        } else if (n.includes('first') && n.includes('name')) {
                            val = rItem(f_firsts);
                        } else if (n.includes('last') && n.includes('name')) {
                            val = rItem(f_lasts);
                        } else if (n.includes('name') || n.includes('user')) {
                            val = `${rItem(f_firsts)} ${rItem(f_lasts)}`;
                        } else if (t === 'date') {
                            val = `20${rNum(10,25)}-${String(rNum(1,12)).padStart(2,'0')}-${String(rNum(1,28)).padStart(2,'0')}`;
                        } else if (t === 'color') {
                            val = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                        } else {
                            val = `SampleData_${rStr()}`;
                        }
                        // Assign and dispatch
                        el.value = val;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    });
                    
                    document.querySelectorAll('textarea').forEach(el => {
                        if (!isVisible(el) || el.readOnly || el.disabled) return;
                        el.value = `Auto-generated test comment.\nRandom ID: ${rStr()}-${rNum(1000,9999)}`;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    });
                    
                    document.querySelectorAll('select').forEach(el => {
                        if (!isVisible(el) || el.disabled) return;
                        const options = Array.from(el.options).filter(o => !o.disabled && o.value);
                        if (options.length > 0) {
                            el.selectedIndex = options[rNum(0, options.length - 1)].index;
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            filledCount++;
                        }
                    });
                    
                    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => {
                        if (!isVisible(el) || el.disabled) return;
                        if (el.type === 'checkbox') {
                            el.checked = Math.random() > 0.5;
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            filledCount++;
                        } else if (el.type === 'radio') {
                            if (Math.random() > 0.5) {
                                el.checked = true;
                                el.dispatchEvent(new Event('change', { bubbles: true }));
                                filledCount++;
                            }
                        }
                    });
                    
                    sendResponse({ success: true, count: filledCount });
                } catch(e) {
                    sendResponse({ success: false, error: e.message });
                }
                break;
            }

            default:
                break;
        }

        return true; // keep channel open for async responses
    });

    // boot state from local storage
    try {
        chrome.storage.local.get(
            ['darkModeEnabled', 'popupBlockerEnabled', 'customUA'],
            (result) => {
                if (result.darkModeEnabled) {
                    let el = document.getElementById('wg-dark-mode');
                    if (!el) {
                        el = document.createElement('style');
                        el.id = 'wg-dark-mode';
                        el.textContent = [
                            'html { filter: invert(1) hue-rotate(180deg) !important; }',
                            'img, video, picture, canvas, svg, iframe { filter: invert(1) hue-rotate(180deg) !important; }'
                        ].join('\n');
                        (document.head || document.documentElement).appendChild(el);
                    }
                }

                if (result.popupBlockerEnabled) {
                    popupBlockerActive = true;
                    injectViaScriptSrc();   // CSP-safe main-world injection
                    startOverlayObserver(); // isolated-world CSS overlay blocker
                }

                if (result.customUA && result.customUA !== 'default') {
                    try {
                        Object.defineProperty(navigator, 'userAgent', {
                            get: () => result.customUA,
                            configurable: true
                        });
                    } catch (_) { }
                }
            }
        );
    } catch (_) {
        // Storage not available (e.g., incognito without permission)
    }

    // interactive toast for blocked popups

    function showPopupBlockedToast(url) {
        const toast = document.createElement('div');
        toast.id = 'wg-popup-toast-' + Date.now();
        toast.style.cssText = [
            'position:fixed', 'bottom:20px', 'right:20px',
            'z-index:2147483647', 'background:#0a0a0a',
            'border:1px solid #ff6b00', 'border-radius:8px',
            'padding:16px', 'box-shadow:0 4px 12px rgba(0,0,0,0.5)',
            'font-family:sans-serif', 'display:flex', 'flex-direction:column',
            'gap:10px', 'width:300px', 'box-sizing:border-box',
        ].join(';');

        const heading = document.createElement('div');
        heading.textContent = '\uD83D\uDCA3 WebGrenade blocked a popup.';
        heading.style.cssText = 'color:#ffffff;font-size:14px;font-weight:600;line-height:1.4;';
        toast.appendChild(heading);

        const urlEl = document.createElement('div');
        urlEl.textContent = url || '(no URL)';
        urlEl.style.cssText = 'color:#888;font-size:12px;word-break:break-all;line-height:1.4;max-height:48px;overflow:hidden;';
        toast.appendChild(urlEl);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(autoTimer);
            toast.remove();
        }

        const ignoreBtn = document.createElement('button');
        ignoreBtn.textContent = 'Ignore';
        ignoreBtn.style.cssText = 'background:transparent;color:#aaa;border:none;cursor:pointer;font-size:13px;padding:6px 4px;';
        ignoreBtn.addEventListener('click', dismiss);

        const allowBtn = document.createElement('button');
        allowBtn.textContent = 'Allow & Open';
        allowBtn.style.cssText = [
            'background:#ff6b00', 'color:#000', 'border:none',
            'border-radius:4px', 'padding:6px 12px',
            'cursor:pointer', 'font-size:13px', 'font-weight:bold',
        ].join(';');
        allowBtn.addEventListener('click', () => {
            if (url) chrome.runtime.sendMessage({ action: 'open_allowed_popup', url });
            dismiss();
        });

        btnRow.appendChild(ignoreBtn);
        btnRow.appendChild(allowBtn);
        toast.appendChild(btnRow);

        const autoTimer = setTimeout(dismiss, 10000);
        (document.body || document.documentElement).appendChild(toast);
    }

    // relay messages from main world inject.js to isolated world
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.source !== 'webgrenade') return;

        // Show toast when a popup is intercepted
        if (event.data.action === 'popup_blocked') {
            showPopupBlockedToast(event.data.url || '');
        }

        // Relay blocked-count increment to background (chrome.storage path)
        // inject.js (main world) cannot access chrome.storage directly.
        if (event.data.action === 'increment_blocked_count') {
            chrome.runtime.sendMessage({
                action: 'incrementBlockedCount',
                domain: window.location.hostname
            }).catch(() => { /* background may be sleeping — silently ignore */ });
        }
    });

})();
