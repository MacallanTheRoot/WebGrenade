/**
 * Main world injection script for advanced popup blocking.
 * Overrides window.open and other typical popup vectors.
 */

(function () {
    'use strict';

    // run once check
    if (window.__wgInjected) return;
    window.__wgInjected = true;

    const USER_ACTION_BYPASS_MS = 1800;
    const TEMP_WHITELIST_DEFAULT_MS = 120000;
    let _lastTrustedMs = 0;
    const _tempAllowMap = new Map();
    const _attachedShadowRoots = new Set();

    function markTrustedAction() {
        _lastTrustedMs = Date.now();
    }

    document.addEventListener('pointerdown', markTrustedAction, { capture: true, passive: true });
    document.addEventListener('touchstart', markTrustedAction, { capture: true, passive: true });
    document.addEventListener('keydown', markTrustedAction, { capture: true, passive: true });

    function isTrustedContext() {
        return (Date.now() - _lastTrustedMs) < USER_ACTION_BYPASS_MS;
    }

    function normalizeUrl(url) {
        try {
            return new URL(url, location.href);
        } catch (_) {
            return null;
        }
    }

    function pruneExpiredTempAllow() {
        const now = Date.now();
        for (const [key, expiresAt] of _tempAllowMap.entries()) {
            if (expiresAt <= now) _tempAllowMap.delete(key);
        }
    }

    function grantTemporaryAllow(rawUrl, ttlMs) {
        const target = normalizeUrl(rawUrl || location.href);
        if (!target) return;

        const duration = Number.isFinite(ttlMs) ? Math.max(1000, ttlMs) : TEMP_WHITELIST_DEFAULT_MS;
        const expiresAt = Date.now() + duration;
        const urlKey = 'url:' + target.href;
        const hostKey = 'host:' + target.hostname;

        _tempAllowMap.set(urlKey, Math.max(_tempAllowMap.get(urlKey) || 0, expiresAt));
        _tempAllowMap.set(hostKey, Math.max(_tempAllowMap.get(hostKey) || 0, expiresAt));
    }

    function isTemporarilyAllowed(rawUrl) {
        pruneExpiredTempAllow();
        const target = normalizeUrl(rawUrl);
        if (!target) return false;

        const now = Date.now();
        return (_tempAllowMap.get('url:' + target.href) || 0) > now ||
            (_tempAllowMap.get('host:' + target.hostname) || 0) > now;
    }

    function shouldAllow(rawUrl) {
        return isTrustedContext() || isTemporarilyAllowed(rawUrl);
    }

    // ipc to content.js
    function reportBlocked(url) {
        const safeUrl = String(url || '');
        window.postMessage({ source: 'webgrenade', action: 'popup_blocked',        url: safeUrl }, '*');
        window.postMessage({ source: 'webgrenade', action: 'increment_blocked_count' }, '*');
        console.log('[WebGrenade] Blocked popup:', safeUrl || '(no url)');
    }

    
    /* layer 1: proxy window.open */
    
    const _originalOpen = window.open;
    window.__wgOriginalOpen = _originalOpen;

    window.open = new Proxy(_originalOpen, {
        apply(target, thisArg, args) {
            if (shouldAllow(args[0])) {
                // allow if user just clicked
                return Reflect.apply(target, thisArg, args);
            }
            reportBlocked(args[0]);
            return null;
        }
    });

    
    /* layer 2: guard location redirects */
    
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
            if (!isCrossOrigin(url) || shouldAllow(url)) {
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

        // intercept href assignment
        try {
            const _locProto = Object.getPrototypeOf(location);
            const _hrefDescriptor = Object.getOwnPropertyDescriptor(_locProto, 'href');
            if (_hrefDescriptor && _hrefDescriptor.set) {
                const _originalHrefSet = _hrefDescriptor.set;
                Object.defineProperty(_locProto, 'href', {
                    get: _hrefDescriptor.get,
                    set(url) {
                        if (isCrossOrigin(url) && !shouldAllow(url)) {
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

    
    /* layer 3: block untrusted click events targeted at _blank */
    

    function getBlankTargetFromEvent(event) {
        const selector = 'a[target="_blank"][href], area[target="_blank"][href], form[target="_blank"][action]';
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];

        for (const node of path) {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.matches && node.matches(selector)) return node;
            if (node.closest) {
                const found = node.closest(selector);
                if (found) return found;
            }
        }

        const target = event.target;
        if (target && target.nodeType === Node.ELEMENT_NODE) {
            if (target.matches && target.matches(selector)) return target;
            if (target.closest) return target.closest(selector);
        }
        return null;
    }

    function blockingListener(event) {
        if (event.isTrusted || isTrustedContext()) return;
        const targetEl = getBlankTargetFromEvent(event);
        if (!targetEl) return;

        const blockedUrl = targetEl.href || targetEl.action || '';
        if (shouldAllow(blockedUrl)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        reportBlocked(blockedUrl);
    }

    function bindBlockers(target) {
        target.addEventListener('click', blockingListener, { capture: true, passive: false });
        target.addEventListener('auxclick', blockingListener, { capture: true, passive: false });
        target.addEventListener('submit', blockingListener, { capture: true, passive: false });
    }

    function unbindBlockers(target) {
        target.removeEventListener('click', blockingListener, { capture: true });
        target.removeEventListener('auxclick', blockingListener, { capture: true });
        target.removeEventListener('submit', blockingListener, { capture: true });
    }

    function registerShadowRoot(root) {
        if (!root || _attachedShadowRoots.has(root)) return;
        _attachedShadowRoots.add(root);
        bindBlockers(root);
    }

    function registerExistingShadowRoots() {
        const all = document.querySelectorAll('*');
        for (const el of all) {
            if (el.shadowRoot) registerShadowRoot(el.shadowRoot);
        }
    }

    bindBlockers(document);
    registerExistingShadowRoots();

    const _originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = new Proxy(_originalAttachShadow, {
        apply(target, thisArg, args) {
            const root = Reflect.apply(target, thisArg, args);
            registerShadowRoot(root);
            return root;
        }
    });

    
    /* layer 4: catch ghost elements */
    
    const _anchorClick = HTMLAnchorElement.prototype.click;
    const _formSubmit  = HTMLFormElement.prototype.submit;

    HTMLAnchorElement.prototype.click = function wgAnchorClick() {
        if (
            !document.contains(this) &&                         // detached "ghost" element
            (this.target || '').toLowerCase() === '_blank'      // aiming at new tab
        ) {
            if (shouldAllow(this.href || '')) {
                return _anchorClick.apply(this, arguments);
            }
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
            if (shouldAllow(this.action || '')) {
                return _formSubmit.apply(this, arguments);
            }
            reportBlocked(this.action || '');
            return;
        }
        return _formSubmit.apply(this, arguments);
    };

    window.addEventListener('__wgTempAllowPopup', (event) => {
        const detail = event.detail || {};
        grantTemporaryAllow(detail.url || location.href, detail.ttlMs);
    });

    
    /* teardown */
    
    window.addEventListener('__wgDisablePopupBlocker', () => {
        // Restore window.open
        window.open = window.__wgOriginalOpen || _originalOpen;

        // Restore anchor and form prototypes
        HTMLAnchorElement.prototype.click = _anchorClick;
        HTMLFormElement.prototype.submit  = _formSubmit;

        // Remove capture listeners
        document.removeEventListener('pointerdown', markTrustedAction, { capture: true });
        document.removeEventListener('touchstart', markTrustedAction, { capture: true });
        document.removeEventListener('keydown', markTrustedAction, { capture: true });
        unbindBlockers(document);
        for (const root of _attachedShadowRoots) {
            unbindBlockers(root);
        }
        _attachedShadowRoots.clear();
        Element.prototype.attachShadow = _originalAttachShadow;
        _tempAllowMap.clear();

        window.__wgInjected = false;
        window.__wgOriginalOpen = undefined;
        console.log('[WebGrenade] Popup blocker disabled.');
    });

    console.log('[WG] Main world blocker injected');
})();
