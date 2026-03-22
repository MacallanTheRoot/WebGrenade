/**
 * Main world injection script for advanced popup blocking.
 * Overrides window.open and other typical popup vectors.
 */

(function () {
    'use strict';

    // run once check
    if (window.__wgInjected) return;
    window.__wgInjected = true;

    // tracks if a user actually clicked something recently
    let _lastTrustedMs = 0;

    function onTrustedPointerdown() {
        _lastTrustedMs = Date.now();
    }
    document.addEventListener('pointerdown', onTrustedPointerdown, { capture: true, passive: true });

    function isTrustedContext() {
        return (Date.now() - _lastTrustedMs) < 1000;
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
            if (isTrustedContext()) {
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

        // intercept href assignment
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

    
    /* layer 3: block untrusted click events targeted at _blank */
    

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
        // ignore real clicks
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

    
    /* layer 4: catch ghost elements */
    
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

    
    /* teardown */
    
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

    console.log('[WG] Main world blocker injected');
})();
