# 💣 WebGrenade v4.0.0

The ultimate webmaster, bug bounty, and power-user utility suite. **WebGrenade** is a rigorous Manifest V3 (MV3) browser extension built natively with Vanilla JS and Zero `innerHTML` usage, engineered to perfectly comply with both Mozilla AMO (Firefox) and Chrome Web Store (CWS) strict architectural layouts.

![WebGrenade Banner](https://via.placeholder.com/800x200.png?text=WebGrenade+v4.0.0+-+The+Ultimate+Browser+Toolkit)

---

## 🌟 What's New in v4.0.0?

The **v4.0.0** update represents a colossal architectural leap, introducing strict Service Worker routing for CORS resolutions, custom boundary polyfills, and a completely modular UI upgrade. 

### 🎵 Genius Lyrics Finder
Instantly scrape and display metadata from YouTube, Spotify, and SoundCloud interfaces, extracting and loading the precise Genius.com Lyrics payload.
- **Architectural Triumph:** Full CORS and CSP isolation natively resolved by routing 100% of API `fetch()` behaviors strictly through the Background Script. 

### 🪄 Fake Input Filler
A game-changer for QA Testers and Frontend Developers. Instantly and automatically populate massive HTML forms with realistic, synthetic data inputs.
- **Seamless Integrations:** Accessible inside the **Utilities** module *or* via a frictionless native **Right-Click Context Menu** (`🪄 Fill with fake data`) on any editable element.
- **Reactive Safe:** Dispatching native bouncing `input` and `change` Event objects ensures complete compatibility across modern React, Vue, and Angular frameworks.

### 📐 Draggable & Resizable UI Dashboard
We fully unlocked the strict UI limitations placed on Chromium standard extension popups. 
- Integrated a customized bottom-anchor resizer that allows you to drag the popup window height all the way to its **600px** absolute rendering cap, permanently remembered in your `chrome.storage.local`.

---

## ⚙️ Core Modules & Capabilities

### 🎥 Media Center & Volume Booster
- Download video, audio, and thumbnail parameters straight from Media Sites.
- Leverage the **Volume Booster** to overdrive audio streams using dynamic `AudioContext` injections completely integrated into Firefox & Chrome scopes seamlessly.

### 🛡️ Security Hub & Popup Blocker
- Advanced Schomery-style architecture capable of tracking implicit user trusts.
- Evaluates isolated world clicks, blocking malicious `window.open`, cross-domain `location.assign` injections, and aggressive overlay configurations.

### 🎨 Color Studio (EyeDropper Polyfill)
- Extracts rich Hexadecimal and RGB values with visual magnifiers.
- Employs an internal Polyfill renderer to enable `<canvas>` based EyeDropper interfaces on Mozilla Firefox (which lacks the native web `EyeDropper` standard API).

### 🍪 Cookie & History Manager
- Export, clear, and overwrite standard configurations in standard formats effortlessly securely without CORS restrictions. 

---

## 🏗️ 100% Cross-Browser Architecture

**WebGrenade** is structured under severe Mozilla AMO structural and logic conditions:
- **Zero `innerHTML` Usage:** Every DOM node is individually created natively via `document.createElement()` and appended securely.
- **Independent Execution Contexts:** Total separation of the Main Execution World (Inject Scripts), Background Contexts (Service Workers), and Extension Pages (`popup.html`).
- **Background Event Routing:** All Fetching logic escapes Chrome/Firefox CSP restrictions structurally without modifying unsafe browser rules.

---

## 💻 Installation

### Google Chrome
1. Head to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right.
3. Click **Load unpacked** and select the `WebGrenade` directory.

### Mozilla Firefox
1. Head to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` inside the `WebGrenade` directory.

---

## 🤝 Contribution Guidelines

We accept Pull Requests! Keep the code Vanilla JS. No React/Vue dependencies allowed. Obey the zero `innerHTML` policy tightly to keep Mozilla AMO review bots happy.
