/**
 * WebGrenade v3.2.0 — Content Script
 * Runs at document_start on all URLs.
 * Handles: Dark Mode, Volume Booster, Popup Blocker (CSP-safe via inject.js), User-Agent Override, Video Sniffer.
 * STRICT: No innerHTML anywhere. All DOM via createElement/textContent.
 */

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────────
    let popupBlockerActive = false;
    let mutationObserver = null;
    const audioContextMap = new WeakMap(); // video/audio el → { ctx, gainNode, source }

    // ── Popup Blocker Helpers (v3.2 — CSP-safe inject.js src injection) ─────────

    /**
     * Load inject.js into the MAIN WORLD by creating a <script src="..."> element.
     * Using src= (not textContent=) satisfies even strict CSPs because the
     * extension origin is implicitly trusted for its own web-accessible resources.
     * The element is self-removing after load so it leaves no permanent DOM trace.
     */
    function injectViaScriptSrc() {
        if (document.getElementById('wg-inject-script')) return; // idempotent
        const scriptEl = document.createElement('script');
        scriptEl.id = 'wg-inject-script';
        scriptEl.src = chrome.runtime.getURL('inject.js');
        scriptEl.onload = () => scriptEl.remove();
        (document.head || document.documentElement).appendChild(scriptEl);
    }

    /**
     * Signal inject.js to restore window.open and remove all its event listeners.
     */
    function disableViaEvent() {
        window.dispatchEvent(new Event('__wgDisablePopupBlocker'));
    }

    /**
     * MutationObserver that hides overlay modal elements (runs in isolated world).
     *
     * v3.2 (unchanged from v3.1):
     *   - z-index > 999, position:fixed only
     *   - Safe ARIA roles / tag exclusions to avoid breaking nav chrome
     */
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


    // ── Message Listener ───────────────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {

            // ── DARK MODE ────────────────────────────────────────────────────────
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

            // ── VOLUME BOOSTER ───────────────────────────────────────────────────
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
                            // Already connected — just update gain
                            audioContextMap.get(el).gainNode.gain.value = gainValue;
                        } else {
                            // First time: create AudioContext pipeline
                            const ctx = new (window.AudioContext || window.webkitAudioContext)();
                            const source = ctx.createMediaElementSource(el);
                            const gainNode = ctx.createGain();
                            gainNode.gain.value = gainValue;
                            source.connect(gainNode);
                            gainNode.connect(ctx.destination);
                            audioContextMap.set(el, { ctx, gainNode, source });
                        }
                    } catch (e) {
                        // Element might already be connected — gracefully skip
                        console.warn('WebGrenade VolumeBooster:', e.message);
                    }
                });

                sendResponse({ success: true, count: mediaEls.length });
                break;
            }

            // ── POPUP BLOCKER (v3.2 — CSP-safe via inject.js src) ─────────────────────
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
                disableViaEvent();      // tells inject.js to restore window.open + remove listeners
                if (mutationObserver) {
                    mutationObserver.disconnect();
                    mutationObserver = null;
                }
                sendResponse({ success: true });
                break;
            }

            // ── HTML5 VIDEO SNIFFER ───────────────────────────────────────────────────
            case 'sniffVideos': {
                const videoEls = Array.from(document.querySelectorAll('video'));
                const results = [];

                videoEls.forEach((el, idx) => {
                    // Collect candidate URLs: src attribute, currentSrc, and <source> children
                    const candidates = new Set();

                    if (el.src) candidates.add(el.src);
                    if (el.currentSrc) candidates.add(el.currentSrc);

                    el.querySelectorAll('source[src]').forEach(s => {
                        if (s.src) candidates.add(s.src);
                    });

                    // Filter: keep only non-blob, non-data, non-empty URLs that
                    // look like real media files or CDN streams
                    const mediaUrls = Array.from(candidates).filter(u => {
                        if (!u || u === window.location.href) return false;
                        if (/^blob:/i.test(u)) return false; // MSE streams — not directly downloadable
                        if (/^data:/i.test(u)) return false;
                        return true;
                    });

                    if (mediaUrls.length === 0) return; // nothing usable

                    // Build a human-readable label from nearby context
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

            // ── USER-AGENT OVERRIDE (client-side navigator spoof) ─────────────
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
                    // Can't truly "restore" navigator.userAgent once overridden in this session,
                    // but the DNR rule removal in background handles the HTTP header.
                    sendResponse({ success: true });
                }
                break;
            }

            default:
                break;
        }

        return true; // keep channel open for async responses
    });

    // ── Restore persisted states on page load ─────────────────────────────────
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

    // ── Popup Blocked Toast (v3.2.1) ──────────────────────────────────────────
    //
    // Called when inject.js (main world) posts a 'popup_blocked' message.
    // Builds interactive notification using only createElement/textContent/styles.
    // No innerHTML anywhere.

    function showPopupBlockedToast(url) {
        // ── Container ──────────────────────────────────────────────────────────
        const toast = document.createElement('div');
        toast.id = 'wg-popup-toast-' + Date.now();
        toast.style.cssText = [
            'position:fixed',
            'bottom:20px',
            'right:20px',
            'z-index:2147483647',
            'background:#0a0a0a',
            'border:1px solid #ff6b00',
            'border-radius:8px',
            'padding:16px',
            'box-shadow:0 4px 12px rgba(0,0,0,0.5)',
            'font-family:sans-serif',
            'display:flex',
            'flex-direction:column',
            'gap:10px',
            'width:300px',
            'box-sizing:border-box',
        ].join(';');

        // ── Heading ────────────────────────────────────────────────────────────
        const heading = document.createElement('div');
        heading.textContent = '\uD83D\uDCA3 WebGrenade blocked a popup.';
        heading.style.cssText = 'color:#ffffff;font-size:14px;font-weight:600;line-height:1.4;';
        toast.appendChild(heading);

        // ── URL preview ────────────────────────────────────────────────────────
        const urlEl = document.createElement('div');
        urlEl.textContent = url || '(no URL)';
        urlEl.style.cssText = 'color:#888888;font-size:12px;word-break:break-all;line-height:1.4;max-height:48px;overflow:hidden;';
        toast.appendChild(urlEl);

        // ── Buttons ────────────────────────────────────────────────────────────
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(autoTimer);
            toast.remove();
        }

        // Ignore button
        const ignoreBtn = document.createElement('button');
        ignoreBtn.textContent = 'Ignore';
        ignoreBtn.style.cssText = [
            'background:transparent',
            'color:#aaaaaa',
            'border:none',
            'cursor:pointer',
            'font-size:13px',
            'padding:6px 4px',
        ].join(';');
        ignoreBtn.addEventListener('click', dismiss);

        // Allow & Open button
        const allowBtn = document.createElement('button');
        allowBtn.textContent = 'Allow & Open';
        allowBtn.style.cssText = [
            'background:#ff6b00',
            'color:#000000',
            'border:none',
            'border-radius:4px',
            'padding:6px 12px',
            'cursor:pointer',
            'font-size:13px',
            'font-weight:bold',
        ].join(';');
        allowBtn.addEventListener('click', () => {
            if (url) {
                chrome.runtime.sendMessage({ action: 'open_allowed_popup', url });
            }
            dismiss();
        });

        btnRow.appendChild(ignoreBtn);
        btnRow.appendChild(allowBtn);
        toast.appendChild(btnRow);

        // Auto-dismiss after 10 s
        const autoTimer = setTimeout(dismiss, 10000);

        (document.body || document.documentElement).appendChild(toast);
    }

    // ── Listen for postMessages from inject.js (main world) ───────────────────
    // Validate source to avoid rogue pages triggering our toast.
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.source !== 'webgrenade') return;
        if (event.data.action !== 'popup_blocked') return;
        showPopupBlockedToast(event.data.url || '');
    });

})();
