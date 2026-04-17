/**
 * WebGrenade volume bridge (main world).
 * Captures AudioContext output connections and routes them through a master gain.
 */

(function () {
  'use strict';

  if (window.__wgVolumeBridgeInstalled) return;
  window.__wgVolumeBridgeInstalled = true;

  const contextSet = new Set();
  const gainMap = new WeakMap();
  let masterGainLevel = 1.0;

  function clampLevel(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1.0;
    return Math.max(0, Math.min(5, n));
  }

  function ensureMasterGain(ctx) {
    if (!ctx || gainMap.has(ctx)) return;

    try {
      const gain = ctx.createGain();
      gain.gain.value = masterGainLevel;
      gain.connect(ctx.destination);
      gainMap.set(ctx, gain);
      contextSet.add(ctx);
    } catch (_) {
      // Ignore contexts we cannot patch.
    }
  }

  function setMasterGain(level) {
    masterGainLevel = clampLevel(level);

    contextSet.forEach((ctx) => {
      const gain = gainMap.get(ctx);
      if (!gain) return;

      try {
        gain.gain.value = masterGainLevel;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch (_) {}
    });
  }

  function patchAudioNodeConnect() {
    if (AudioNode.prototype.__wgOriginalConnect) return;

    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.__wgOriginalConnect = originalConnect;

    AudioNode.prototype.connect = function (...args) {
      try {
        const destination = args[0];
        const ctx = this && this.context;
        if (ctx && destination && gainMap.has(ctx)) {
          const masterGain = gainMap.get(ctx);
          if (destination === ctx.destination && this !== masterGain) {
            args[0] = masterGain;
          }
        }
      } catch (_) {}

      return originalConnect.apply(this, args);
    };
  }

  function wrapAudioContextConstructor(name) {
    const Original = window[name];
    if (typeof Original !== 'function') return;
    if (Original.__wgWrappedCtor) return;

    const Wrapped = function (...args) {
      const ctx = new Original(...args);
      ensureMasterGain(ctx);
      return ctx;
    };

    Wrapped.prototype = Original.prototype;
    Object.setPrototypeOf(Wrapped, Original);
    Wrapped.__wgWrappedCtor = true;

    try {
      Object.defineProperty(Wrapped, 'name', { value: Original.name });
    } catch (_) {}

    window[name] = Wrapped;
  }

  patchAudioNodeConnect();
  wrapAudioContextConstructor('AudioContext');
  wrapAudioContextConstructor('webkitAudioContext');

  window.addEventListener('__wgSetMasterVolume', (event) => {
    setMasterGain(event && event.detail ? event.detail.level : 1.0);
  });
})();
