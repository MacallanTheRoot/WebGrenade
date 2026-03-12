/**
 * WebGrenade v3.2.1 — inject.js
 *
 * Runs in the MAIN WORLD (loaded via <script src="chrome-extension://..."> from content.js).
 * CSP-safe: the browser validates the src URL against the extension origin, not the page CSP.
 *
 * Schomery-inspired advanced popup blocker — four interception layers:
 *   1. Proxy window.open          — blocks untrusted calls
 *   2. location.assign / .replace / .href setter — blocks redirect-style popups
 *   3. Capture-phase pointerdown  — tracks trusted user interactions (used by layers 1–2)
 *   4. Capture-phase click / auxclick / submit — blocks untrusted _blank events
 *   5. Prototype wraps            — catches ghost anchor .click() and form .submit()
 *
 * On every block:
 *   – Posts { source:'webgrenade', action:'popup_blocked', url } → content.js shows toast
 *   – Posts { source:'webgrenade', action:'increment_blocked_count' } → content.js → background
 *
 * Disable via: window.dispatchEvent(new Event('__wgDisablePopupBlocker'))
 *
 * STRICT: No innerHTML anywhere.
 */

(function () {
    'use strict';

    // ── Guard: only install once ───────────────────────────────────────────────
    if (window.__wgInjected) return;
    window.__wgInjected = true;

    // ── Trusted-event tracker ─────────────────────────────────────────────────
    // A real user interaction (pointerdown) sets a timestamp.
    // window.open / location changes are allowed only within a 1 s window after one.
    let _lastTrustedMs = 0;

    function onTrustedPointerdown() {
        _lastTrustedMs = Date.now();
    }
    document.addEventListener('pointerdown', onTrustedPointerdown, { capture: true, passive: true });

    function isTrustedContext() {
        return (Date.now() - _lastTrustedMs) < 1000;
    }

    // ── Shared: post block message to content script ──────────────────────────
    function reportBlocked(url) {
        const safeUrl = String(url || '');
        window.postMessage({ source: 'webgrenade', action: 'popup_blocked',        url: safeUrl }, '*');
        window.postMessage({ source: 'webgrenade', action: 'increment_blocked_count' }, '*');
        console.log('[WebGrenade] Blocked popup:', safeUrl || '(no url)');
    }

    // ========================================================================
    // LAYER 1 — Proxy window.open
    // ========================================================================
    const _originalOpen = window.open;
    window.__wgOriginalOpen = _originalOpen;

    window.open = new Proxy(_originalOpen, {
        apply(target, thisArg, args) {
            if (isTrustedContext()) {
                // User-initiated open within the grace window — allow through
                return Reflect.apply(target, thisArg, args);
            }
            reportBlocked(args[0]);
            return null;
        }
    });

    // ========================================================================
    // LAYER 2 — location.assign / location.replace / location.href setter
    // Catches redirect-style popups: window.location = 'ads.example.com'
    // Only intercepts cross-origin targets opened without user interaction.
    // ========================================================================
    (function patchLocation() {
        const _assign  = location.assign.bind(location);
        const _replace = location.replace.bind(location);

        function isCrossOrigin(url) {
            try {
                const target = new URL(url, location.href);
                return target.origin !== location.origin;
            } catch (_) {
                return false;
            }
        }

        function guardedNavigate(url, original) {
            if (!isCrossOrigin(url) || isTrustedContext()) {
                return original(url);
            }
            reportBlocked(url);
        }

        // Wrap location.assign
        try {
            location.assign = function wgAssign(url) {
                return guardedNavigate(url, _assign);
            };
        } catch (_) { /* location.assign may be non-writable on some pages */ }

        // Wrap location.replace
        try {
            location.replace = function wgReplace(url) {
                return guardedNavigate(url, _replace);
            };
        } catch (_) { }

        // Intercept location.href assignment (only for cross-origin untrusted sets)
        try {
            const _locProto = Object.getPrototypeOf(location);
            const _hrefDescriptor = Object.getOwnPropertyDescriptor(_locProto, 'href');
            if (_hrefDescriptor && _hrefDescriptor.set) {
                const _originalHrefSet = _hrefDescriptor.set;
                Object.defineProperty(_locProto, 'href', {
                    get: _hrefDescriptor.get,
                    set(url) {
                        if (isCrossOrigin(url) && !isTrustedContext()) {
                            reportBlocked(url);
                            return;
                        }
                        _originalHrefSet.call(this, url);
                    },
                    configurable: true,
                    enumerable: _hrefDescriptor.enumerable
                });
            }
        } catch (_) { /* May fail on some Firefox security zones — silently skip */ }
    })();

    // ========================================================================
    // LAYER 3 — Capture-phase event listener (click / auxclick / submit)
    // Blocks UNTRUSTED (script-generated) events that target _blank links/forms.
    // isTrusted === false means the event was dispatched by JS, not actual input.
    // ========================================================================

    function isBlankTarget(el) {
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'A' || tag === 'AREA' || tag === 'FORM') {
            return (el.target || '').toLowerCase() === '_blank';
        }
        // Walk up for parent anchor
        const anchor = el.closest('a[target="_blank"], area[target="_blank"]');
        return !!anchor;
    }

    function blockingListener(event) {
        // Only intercept script-generated (untrusted) events aimed at new tabs
        if (event.isTrusted) return;
        if (!isBlankTarget(event.target)) return;

        const anchor = event.target.closest('a[href], area[href]') || event.target;
        const blockedUrl = anchor.href || anchor.action || '';

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        reportBlocked(blockedUrl);
    }

    document.addEventListener('click',    blockingListener, { capture: true, passive: false });
    document.addEventListener('auxclick', blockingListener, { capture: true, passive: false });
    document.addEventListener('submit',   blockingListener, { capture: true, passive: false });

    // ========================================================================
    // LAYER 4 — Prototype wraps for ghost anchor .click() and form .submit()
    // Catches the pattern:
    //   const a = document.createElement('a');
    //   a.href = 'https://ads.example.com'; a.target = '_blank'; a.click();
    // These elements are never attached to the DOM (no DOMContentLoaded, no event).
    // ========================================================================
    const _anchorClick = HTMLAnchorElement.prototype.click;
    const _formSubmit  = HTMLFormElement.prototype.submit;

    HTMLAnchorElement.prototype.click = function wgAnchorClick() {
        if (
            !document.contains(this) &&                         // detached "ghost" element
            (this.target || '').toLowerCase() === '_blank'      // aiming at new tab
        ) {
            reportBlocked(this.href || '');
            return;
        }
        return _anchorClick.apply(this, arguments);
    };

    HTMLFormElement.prototype.submit = function wgFormSubmit() {
        if (
            !document.contains(this) &&
            (this.target || '').toLowerCase() === '_blank'
        ) {
            reportBlocked(this.action || '');
            return;
        }
        return _formSubmit.apply(this, arguments);
    };

    // ========================================================================
    // DISABLE — restore everything when content.js fires the disable event
    // ========================================================================
    window.addEventListener('__wgDisablePopupBlocker', () => {
        // Restore window.open
        window.open = window.__wgOriginalOpen || _originalOpen;

        // Restore anchor and form prototypes
        HTMLAnchorElement.prototype.click = _anchorClick;
        HTMLFormElement.prototype.submit  = _formSubmit;

        // Remove capture listeners
        document.removeEventListener('pointerdown', onTrustedPointerdown, { capture: true });
        document.removeEventListener('click',    blockingListener, { capture: true });
        document.removeEventListener('auxclick', blockingListener, { capture: true });
        document.removeEventListener('submit',   blockingListener, { capture: true });

        window.__wgInjected = false;
        window.__wgOriginalOpen = undefined;
        console.log('[WebGrenade] Popup blocker disabled.');
    });

    console.log('[WebGrenade] inject.js v3.2.1 — schomery-style popup blocker active.');
})();
