<div align="center">
  <a href="#en">🇺🇸 English</a> | <a href="#tr">🇹🇷 Türkçe</a>
</div>

<a name="en"></a>
# 💣 WebGrenade v3.2.1
### Ultimate Browser Utility Suite — Your Web Development Arsenal

![Version](https://img.shields.io/badge/version-3.2.1-orange?style=for-the-badge&logo=google-chrome)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge&logo=webcomponents)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Browser Support](https://img.shields.io/badge/browsers-chrome%20%7C%20firefox-blueviolet?style=for-the-badge)

---

## 🎯 What is WebGrenade?

Standard browser extensions offer one or two features. **WebGrenade** is different — a complete tactical toolkit for web professionals, developers, and power users who need **instant access to 8+ essential utilities** without cluttering their workflow.

WebGrenade operates entirely **offline-first**. All data stays in `chrome.storage`, nothing leaves your browser. No tracking, no telemetry, no cloud dependencies.

---

## ⚡ Core Arsenal: 8 Professional Modules

| Module | Technology | Features |
| :--- | :--- | :--- |
| **📥 Media Center** | `RapidAPI` + `HTML5 Video Sniffer` | YouTube video download (MP4/MP3, 1080p–360p) + auto-detect native `<video>` elements on any page with direct Open/Download buttons |
| **🔗 Link Station** | `is.gd / TinyURL API` | URL shortening with multi-provider fallback, QR code generation, link history |
| **🎨 Color Studio** | `EyeDropper API` | Screen color picker, hex/RGB output, palette history (last 10), **📋 Copy Palette** (exports all colors as comma-separated hex) |
| **🔐 Security Hub** | `Crypto.getRandomValues` | Cryptographically secure password generator (8–32 chars), strength meter |
| **🍪 Cookie Manager** | `Chrome Cookies API` | Full CRUD, domain filtering, JSON export/import, bulk delete |
| **📡 RSS Reader** | `Background Fetch` | Multi-source RSS+Atom reading with **auto-discovery** — paste any site URL and WebGrenade finds the feed automatically |
| **🛠️ Utilities** | `Content Scripts` + `inject.js` | **Advanced Popup Blocker** (schomery-style, CSP-safe), Dark Mode, Volume Booster (0–300%), User-Agent Switcher, History Cleaner |
| **⚙️ Settings** | `chrome.storage` | RapidAPI key management, about section |

---

## � Detailed Module Guides

### 📥 Module 1: Media Center

**Purpose**: Download YouTube videos and detect native HTML5 videos on any webpage.

**Features**:
- **YouTube Downloader** (Requires RapidAPI key):
  - Multiple format support: MP4 (1080p, 720p, 480p, 360p) and MP3 (audio-only)
  - Real-time video thumbnail and metadata display
  - Download history tracking (last 5 downloads)
  - Direct download links open in new tabs
  
- **HTML5 Video Sniffer** (Works on any site, no API required):
  - Auto-scans current page for native `<video>` elements
  - Filters out non-downloadable `blob:` URLs (MSE streams)
  - Displays video sources with human-readable labels from `aria-label` or nearby headings
  - Direct "Open" and "Download" buttons for each detected video
  - Supports multiple source URLs per video element

- **Volume Booster** (🔊):
  - Integrated slider control (0–300%) in Media Center
  - Amplifies audio beyond browser's default 100% limit
  - Uses Web Audio API gain node for real-time amplification
  - Works on all `<video>` and `<audio>` elements on current page
  - No distortion up to 200%, slight clipping possible at 300%
  - Slider persists per-tab until page refresh

**How to Use**:
1. Navigate to a YouTube video or any page with `<video>` elements
2. Open WebGrenade → **Media** tab
3. For YouTube: Video info loads automatically (API key required in Settings)
4. For native videos: "📺 Found on Page" section appears if videos are detected
5. Adjust **Volume Booster** slider (default: 100%) for audio amplification
6. Select format/quality → Click **Download**

**Technical Details**:
- Uses RapidAPI YouTube Data API for metadata extraction
- Content script scans DOM for `document.querySelectorAll('video')`
- Extracts `src` attributes and `<source>` child elements
- Downloads via `chrome.tabs.create` for direct browser handling

---

### 🔗 Module 2: Link Station

**Purpose**: Shorten URLs, generate QR codes, and manage link history.

**Features**:
- **URL Shortening**:
  - Multi-provider support: `is.gd` and `TinyURL`
  - Automatic fallback if primary service fails
  - Works with current tab URL or pasted links
  
- **QR Code Generator**:
  - Generates 200×200px QR codes for any URL
  - Uses secure API-based generation (QR Server API)
  - Download as PNG with one click
  - Real-time QR update when shortening URLs
  
- **Link History**:
  - Stores last 5 shortened links with timestamps
  - One-click copy to clipboard
  - Individual delete or bulk clear history
  - Displays original → shortened URL mapping

**How to Use**:
1. Open WebGrenade → **Link** tab
2. Current page URL is auto-detected
3. Select shortener provider (is.gd / TinyURL)
4. Click **Shorten URL** → Shortened link appears with QR code
5. Click **Copy** or **Download QR** buttons
6. View history below for recent links

**Technical Details**:
- Uses public shortener APIs (no authentication required)
- QR codes generated via `https://api.qrserver.com/v1/create-qr-code/`
- History stored in `chrome.storage.local.linkHistory` (max 100 items)
- Clipboard access via `navigator.clipboard.writeText()`

---

### 🎨 Module 3: Color Studio

**Purpose**: Pick colors from any webpage and build color palettes.

**Features**:
- **EyeDropper Tool**:
  - Native browser EyeDropper API (Chrome 95+)
  - Click anywhere on screen to pick pixel color
  - Instant hex and RGB conversion
  - Auto-copy to clipboard on pick
  
- **Palette Management**:
  - Stores last 10 picked colors
  - Visual color grid with click-to-copy
  - **Copy Palette** button exports all colors as comma-separated hex list
  - Prevents duplicate colors in history
  
- **Color Conversion**:
  - Displays both Hex (`#FF5733`) and RGB (`rgb(255, 87, 51)`) formats
  - Live color preview box
  - One-click copy for each format

**How to Use**:
1. Open WebGrenade → **Color** tab
2. Click **Pick Color** button
3. Screen darkens → Click anywhere to capture color
4. Color appears in preview + history grid
5. Click any color swatch to copy hex value
6. Click **📋 Copy Palette** to export all saved colors

**Browser Support**:
- Requires EyeDropper API (Chrome/Edge 95+, not available in Firefox)
- Button shows "❌ EyeDropper not supported" if unavailable

**Technical Details**:
- Uses `new EyeDropper().open()` → returns `{ sRGBHex }`
- Hex to RGB conversion: `parseInt(hex.slice(1,3), 16)` for R, G, B
- History stored in `chrome.storage.local.colorHistory`
- Palette export creates CSV string: `#ff5733, #33c3ff, #8bc34a`

---

### 🔐 Module 4: Security Hub

**Purpose**: Generate cryptographically secure passwords with customizable rules.

**Features**:
- **Password Generator**:
  - Length: 8–32 characters (adjustable slider)
  - Character sets: Uppercase, Lowercase, Numbers, Symbols
  - Uses `crypto.getRandomValues()` for true randomness (not `Math.random()`)
  - Real-time regeneration when options change
  
- **Strength Meter**:
  - Entropy-based calculation: `log₂(charset^length)`
  - 4 levels: Weak (<40 bits), Fair (40-60), Good (60-80), Strong (80+)
  - Visual progress bar with color coding
  - Updates instantly as you adjust settings

**How to Use**:
1. Open WebGrenade → **Security** tab
2. Adjust password length slider (default: 16)
3. Check/uncheck character type checkboxes
4. Password auto-generates on every change
5. Click **Copy Password** → Automatically copies to clipboard

**Password Strength Guide**:
- **Weak** (Red, <40 bits): Crackable in minutes, avoid for important accounts
- **Fair** (Orange, 40-60): Basic protection, use for low-risk sites
- **Good** (Yellow, 60-80): Strong enough for most accounts
- **Strong** (Green, 80+): Military-grade, recommended for banking/email

**Technical Details**:
- Entropy formula: `length × Math.log2(charsetSize)`
- Example: 16-char password with 94-char set = 105 bits entropy
- Uses `Uint32Array` for unbiased random selection
- No password is ever sent to a server or saved to disk

---

### 🍪 Module 5: Cookie Manager

**Purpose**: Full control over browser cookies with advanced editing and import/export.

**Features**:
- **Cookie CRUD**:
  - View all cookies for current domain
  - Add new cookies with custom values
  - Edit existing cookies (name, value, domain, path, flags)
  - Delete individual or all cookies at once
  
- **Advanced Editing**:
  - Session vs. Persistent cookies (expiry date picker)
  - Security flags: Secure, HttpOnly, SameSite (Strict/Lax/None)
  - Multi-line value editor with **Format** button
  - Auto-decodes URL-encoded values for easy reading
  
- **Import/Export**:
  - Export all cookies as JSON to clipboard
  - Import cookies from JSON (batch add)
  - Preserves all cookie attributes during transfer
  - Error handling for malformed JSON
  
- **Search & Filter**:
  - Real-time search by cookie name or domain
  - Displays domain, path, and security flags
  - Color-coded secure/HttpOnly indicators

**How to Use**:
1. Open WebGrenade → **Cookies** tab
2. All cookies for current domain load automatically
3. **To edit**: Click edit icon → Modify fields → Save
4. **To export**: Click **Export** → JSON copied to clipboard
5. **To import**: Click **Import** → Paste JSON → Confirm

**Cookie Format Example** (JSON export):
```json
[
  {
    "name": "session_id",
    "value": "abc123xyz",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "lax",
    "expirationDate": 1735689600
  }
]
```

**Technical Details**:
- Uses `chrome.cookies` API via background script message passing
- Supports cross-origin cookie access with proper permissions
- SameSite options: `strict` (same-site only), `lax` (GET cross-site), `no_restriction` (all)
- Format button tries JSON prettify first, then URL decoding

---

### 📡 Module 6: RSS Reader

**Purpose**: Subscribe to RSS/Atom feeds with automatic feed discovery.

**Features**:
- **Auto-Discovery**:
  - Paste any website URL (e.g., `https://example.com`)
  - WebGrenade fetches HTML and finds `<link rel="alternate">` feed tags
  - Automatically adds the correct feed URL
  - Works with RSS 2.0, RSS 1.0, and Atom feeds
  
- **Multi-Feed Management**:
  - Add unlimited feeds (stored locally)
  - Dropdown selector to switch between feeds
  - Delete feeds individually
  - Manual feed URL input also supported
  
- **Feed Reader**:
  - Displays up to 20 most recent items
  - Shows title, description, and publish date
  - Click any item to open article in new tab
  - Handles both RSS `<item>` and Atom `<entry>` formats
  
- **Refresh & Persistence**:
  - Manual refresh button to update current feed
  - Feeds synced to `chrome.storage.local`
  - No feed update timers (on-demand only)

**How to Use**:
1. Open WebGrenade → **RSS** tab
2. Paste a website URL or direct feed URL in input field
3. Click **Add Feed**
4. If website URL:
   - "🔍 Searching for RSS feed…" appears
   - Feed auto-detected and added (or error if none found)
5. Select feed from dropdown → Articles load below
6. Click any article title to read in new tab

**Supported Feed Types**:
- RSS 2.0 (`<rss version="2.0">`)
- RSS 1.0 (`<rdf:RDF>`)
- Atom 1.0 (`<feed xmlns="http://www.w3.org/2005/Atom">`)

**Technical Details**:
- Background script fetches HTML/XML to bypass CORS
- Uses `DOMParser` in popup context to parse XML
- Feed discovery looks for `<link type="application/rss+xml">` or `type="application/atom+xml"`
- Resolves relative feed URLs to absolute with `new URL(href, pageURL)`

---

### 🛠️ Module 7: Utilities

**Purpose**: Collection of power-user tools for enhanced browsing control.

**Features**:

1. **Advanced Popup Blocker** (v3.2+):
   - Schomery-inspired 5-layer architecture (see separate section above)
   - Blocks `window.open()`, scripted clicks, and ghost anchors
   - Auto-hides consent/newsletter modals
   - Interactive toast with "Ignore" / "Allow & Open" buttons
   - Site whitelist support
   - Per-domain blocked popup counter
   
2. **Dark Mode** (via content script toggle):
   - CSS filter inversion: `filter: invert(1) hue-rotate(180deg)`
   - Smart exclusions: Images/videos remain normal with counter-invert
   - Toggle on/off for current tab
   - Persists across tab refreshes

3. **User-Agent Switcher**:
   - Changes browser UA string via declarativeNetRequest
   - Presets: Chrome (Windows/Mac/Linux), Firefox, Safari, Mobile
   - Affects all tabs after switching
   - Useful for testing responsive designs or bypassing UA filters

5. **History Cleaner**:
   - Bulk delete browsing history with time range selector
   - Options: Last hour, 24 hours, 7 days, 30 days, All time
   - Uses `chrome.history.deleteRange()` and `deleteAll()`
   - One-click confirmation prompt

6. **Right-Click Unlocker**:
   - Bypasses `event.preventDefault()` on context menu
   - Restores copy/paste/inspect functionality on restricted sites
   - Requires page reload for full effect

7. **PiP Mode**:
   - Activates Picture-in-Picture for first `<video>` on page
   - One-click button in Utilities
   - Floats video on top of all windows

8. **Markdown Copier**:
   - Copies current page title and URL as Markdown link: `[Title](URL)`
   - Instant clipboard copy
   - Useful for documentation writers

> **Note**: Volume Booster (🔊) is located in the **Media Center** module, not in Utilities.

**How to Use**:
1. Open WebGrenade → **Utilities** tab
2. Toggle switches for Popup Blocker, Dark Mode, etc.
3. Some features require page reload (Right-Click Unlocker)
4. Popup Blocker shows blocked count badge for current domain
5. Click **Whitelist Site** to exclude current site from popup blocking

**Whitelist Feature**:
- Add current domain to whitelist → Popup blocker automatically disabled
- View/manage whitelist via **View Whitelist** button
- Remove sites individually with 🗑️ button

**Technical Details**:
- Toggle states saved to `chrome.storage.local.utilityStates`
- Content script injection via `chrome.tabs.sendMessage` or `chrome.scripting.executeScript`
- Blocked count stored in page's `localStorage` as `webgrenade_blocked_<domain>`
- Cannot inject on `chrome://`, `edge://`, `about:` pages (shows warning)

---

### ⚙️ Module 8: Settings

**Purpose**: Configure API keys and view extension info.

**Features**:
- **RapidAPI Configuration**:
  - Input fields for `X-RapidAPI-Key` and API Host
  - Required for YouTube video downloads in Media Center
  - Credentials stored securely in `chrome.storage.local`
  - Visual confirmation when saved successfully
  
- **User-Agent Switcher**:
  - Dropdown with 5 UA presets: Chrome (Win/Mac/Linux), Firefox, Safari, Edge, Mobile
  - Changes browser identification via declarativeNetRequest API
  - Affects all tabs and survives extension reload
  - Useful for testing responsive designs or bypassing UA filters
  
- **Browser Mask** (🔄 Auto-Swap):
  - Toggle to automatically swap your User-Agent
  - If using Chrome → switches to Firefox UA
  - If using Firefox → switches to Chrome UA
  - One-click anonymity without manual selection
  - Disabling restores original browser UA
  
- **About Section**:
  - Extension version (v3.2.1)
  - Developer credit (MacallanTheRoot)
  - GitHub repository link
  - MIT License notice

**How to Set Up YouTube API**:
1. Visit [RapidAPI.com](https://rapidapi.com/)
2. Sign up for free account
3. Subscribe to a YouTube Data API (e.g., "YouTube v3" or similar)
4. Copy your `X-RapidAPI-Key` from dashboard
5. Copy the API Host (e.g., `youtube-v31.p.rapidapi.com`)
6. Open WebGrenade → **Settings** → Paste both values → **Save**

**Storage**:
```json
{
  "apiConfig": {
    "key": "your-rapidapi-key-here",
    "host": "youtube-v31.p.rapidapi.com",
    "configured": true
  }
}
```

**Privacy Note**:
- API keys never leave your browser
- All requests go directly from your machine to RapidAPI
- No WebGrenade backend servers involved

---

## �🚫 Advanced Popup Blocker (v3.2.1)

The popup blocker is the flagship feature of v3.2.x. It uses a **CSP-safe, Schomery-inspired multi-layer architecture**:

```
Layer 1 — window.open Proxy (main world)
   Intercepts all window.open() calls via a Proxy trap.

Layer 2 — Capture-phase click/submit listener (main world)
   Blocks untrusted (isTrusted === false) events targeting _blank anchors.
   Catches script-generated fake clicks that bypass Layer 1.

Layer 3 — Ghost anchor guard (main world)
   Overrides HTMLAnchorElement.prototype.click and HTMLFormElement.prototype.submit.
   Blocks detached DOM elements that navigate to _blank without ever being rendered.

Layer 4 — MutationObserver overlay hider (isolated world)
   Automatically hides high-z-index fixed-position consent/subscription modals.

Layer 5 — Interactive Toast notification (isolated world)
   When any popup is blocked, a themed toast appears in the bottom-right corner
   with the blocked URL and two buttons: "Ignore" and "Allow & Open".
```

**Why `inject.js`?** Inline `script.textContent` injection is blocked by strict CSPs on sites like GitHub and Twitter. Loading via `chrome.runtime.getURL('inject.js')` (`src=`) is always allowed because the extension origin is trusted regardless of the page's CSP.

---

## 📺 HTML5 Video Sniffer (v3.2)

When you open the **Media** tab on any page, WebGrenade automatically scans for native `<video>` elements. If found, a "📺 Found on Page" section appears with direct **Open** and **Download** buttons — no API key required.

- Filters out `blob:` MSE streams (non-downloadable)
- Builds human-readable labels from `aria-label`, nearby headings, or index
- Works on any site with embedded video (news sites, documentation, portfolios)

---

## 🔐 Security Architecture

| Principle | Implementation |
| :--- | :--- |
| No `innerHTML` anywhere | All DOM built with `createElement` + `textContent` |
| CSP-safe injection | `inject.js` loaded via `script.src` — never inline code |
| Message validation | `window.postMessage` listener checks `source === 'webgrenade'` before acting |
| Zero external telemetry | All state in `chrome.storage.local` only |
| Strict CSP on extension pages | `script-src 'self'; object-src 'self'` |

---

## 📦 Installation

### Chrome / Edge (Chromium)

```bash
git clone https://github.com/MacallanTheRoot/webgrenade.git
```

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load Unpacked** → select the `webgrenade/` folder

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` inside the `webgrenade/` folder

---

## 🗂 Project Structure

```
webgrenade/
├── manifest.json       # MV3 manifest (Chrome + Firefox)
├── background.js       # Service worker: context menus, fetch proxy, UA switcher, history cleaner
├── content.js          # Isolated-world content script: dark mode, volume booster, popup toast, video sniffer
├── inject.js           # Main-world script (CSP-safe src= injection): popup blocker core
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic: all 8 modules
├── utils.js            # Utility functions: YouTube parsing, QR generation, clipboard helpers
├── style.css           # Orange/Black dashboard theme
└── icons/              # Extension icons (16, 48, 128px)
```

---

## 🏗️ Module Architecture

### 📄 background.js
**Type**: Service Worker (Background Script)  
**Lines**: ~228  
**Responsibilities**:
- **Context Menus**: Right-click image search on 6 engines (Google Lens, Bing, Yandex, TinEye, Baidu, Sogou)
- **Dynamic Rules (DNR)**: User-Agent switching via declarativeNetRequest API
- **Cookie API Bridge**: Provides cross-origin cookie access for Cookie Manager
- **RSS Fetch Proxy**: Background fetching for RSS Reader with auto-discovery
- **History Cleaner**: Bulk chrome.history deletion with time range filtering
- **Message Routing**: Handles inter-component communication from popup/content scripts

**Key Features**:
- Cross-browser compatible (Chrome MV3 & Firefox MV3)
- No telemetry or external connections except user-initiated API calls
- Persistent service worker with event-driven architecture

---

### 📄 content.js
**Type**: Content Script (Isolated World)  
**Lines**: ~375  
**Injection**: `document_start` on all URLs  
**Responsibilities**:
- **Dark Mode**: CSS filter inversion with smart exclusions (images, videos preserved)
- **Volume Booster**: Web Audio API gain node (0-300% amplification) for `<video>` and `<audio>`
- **Popup Blocker Integration**: Injects `inject.js` into main world via CSP-safe `<script src>` method
- **Interactive Toast Notifications**: Bottom-right themed alerts with "Ignore" / "Allow & Open" buttons
- **MutationObserver**: Auto-hides consent/newsletter modals based on z-index and keyword detection
- **HTML5 Video Sniffer**: Scans DOM for native `<video>` elements, extracts `src` attributes (excluding `blob:` MSE streams)

**Architecture**:
```
content.js (isolated world)
    ├── injectViaScriptSrc()       → Loads inject.js securely
    ├── startOverlayObserver()     → Modal hiding with MutationObserver
    ├── createPopupToast()         → Interactive blocked popup UI
    └── WeakMap audioContextMap    → Video element to Web Audio context mapping
```

**Security**:
- Zero `innerHTML` usage (all DOM via `createElement` + `textContent`)
- Validates `window.postMessage` with `source === 'webgrenade'` check
- CSP-compliant injection strategy (no inline scripts)

---

### 📄 inject.js
**Type**: Main World Script  
**Lines**: ~141  
**Injection**: Via `chrome.runtime.getURL()` from content.js  
**Purpose**: Advanced popup blocker using schomery-inspired multi-layer interception

**Architecture**:
```
Layer 1: window.open Proxy
    └── Intercepts ALL window.open() calls → returns null

Layer 2: Capture-phase Event Listener
    └── Blocks untrusted (isTrusted === false) click/auxclick/submit on target="_blank"

Layer 3: Prototype Override
    └── Hijacks HTMLAnchorElement.prototype.click()
    └── Hijacks HTMLFormElement.prototype.submit()
```

**Why Main World?**
- Popups originate from page scripts, not extension context
- Proxy must wrap the *actual* window.open that page JS sees
- Isolated world (content.js) cannot intercept page-level window.open

**Why `<script src>` not inline?**
- Strict CSPs (GitHub, Twitter, etc.) block `script.textContent` injection
- Extension origins (`chrome-extension://`) bypass CSP for `src=` attributes
- Self-removing script element leaves no permanent DOM trace

**Communication**:
```javascript
window.postMessage({
  source: 'webgrenade',
  action: 'popup_blocked',
  url: blockedUrl
}, '*');
```

---

### 📄 popup.js
**Type**: Extension Popup Interface  
**Lines**: ~2808  
**Responsibilities**:
- **Vertical Dashboard**: 8 module tabs with state persistence
- **Media Center**: YouTube downloader (RapidAPI) + HTML5 video sniffer UI
- **Link Station**: URL shortener (is.gd/TinyURL) + QR generator + history
- **Color Studio**: EyeDropper API + palette history + bulk copy
- **Security Hub**: Password generator (Crypto.getRandomValues) + strength meter
- **Cookie Manager**: Full CRUD UI for chrome.cookies with JSON export/import
- **RSS Reader**: Multi-feed reader with auto-discovery input
- **Utilities**: Toggle switches for all content.js features + history cleaner
- **Settings**: API key configuration + about section

**State Management**:
```javascript
state = {
  currentUrl: '',
  currentTab: null,
  activeModule: 'media',
  videoData: null,
  apiConfig: { key, host, configured }
}
```

**Storage**:
- `chrome.storage.local`: API keys, module preferences, history data
- `chrome.storage.sync`: Cross-device settings (cookies, RSS feeds)

---

### 📄 utils.js
**Type**: Shared Utility Library  
**Lines**: ~465  
**Responsibilities**:
- **YouTube Helpers**:
  - `isYouTubeUrl(url)`: Regex validation
  - `extractVideoId(url)`: Supports watch, shorts, embed, youtu.be formats
- **QR Code Generation**: Canvas-based QR encoding with error correction
- **Clipboard Operations**: Secure `navigator.clipboard` fallback with `document.execCommand`
- **DOM Helpers**: Safe element creation, event delegation patterns
- **URL Validation**: Protocol checking, domain extraction
- **Format Conversion**: Timestamp to human-readable duration

**Example Functions**:
```javascript
extractVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')  // → 'dQw4w9WgXcQ'
extractVideoId('https://youtu.be/dQw4w9WgXcQ')            // → 'dQw4w9WgXcQ'
extractVideoId('https://youtube.com/shorts/abc123')       // → 'abc123'
```

---

## 🛠️ Configuration

### Media Center (YouTube)

WebGrenade uses RapidAPI for YouTube video extraction.

1. Visit [RapidAPI](https://rapidapi.com/) and subscribe to a YouTube data API
2. Open WebGrenade → **Settings** (⚙️)
3. Paste your `X-RapidAPI-Key` and API Host
4. Click **Save Configuration**

The HTML5 Video Sniffer works on **any** site with no API key.

### RSS Auto-Discovery

In the RSS Reader, paste either:
- A direct feed URL (`https://example.com/feed.xml`) — added immediately
- A site URL (`https://example.com`) — WebGrenade fetches the HTML and finds the `<link rel="alternate">` tag automatically

---

## 📋 Changelog

### v3.2.1
- Interactive popup-blocked toast (bottom-right, themed, 10s auto-dismiss)
- "Allow & Open" routes blocked URL through `chrome.tabs.create` to bypass the override

### v3.2.0
- `inject.js` — CSP-safe popup blocker replacing inline script injection
- HTML5 Video Sniffer in Media Center
- Color Palette Export (📋 Copy button)

### v3.1.0
- RSS Auto-Discovery (auto-finds feed from any site URL)
- Popup blocker main-world injection (v3.1 baseline)

### v3.0.0
- Full vertical dashboard rewrite
- Ad Blocker removed
- Cookie Manager, RSS Reader, UA Switcher added

---

## ⚠️ Disclaimer

WebGrenade is designed for **legitimate web development and productivity** purposes. Users are responsible for complying with the Terms of Service of websites and APIs they interact with.

**Maintained by**: [MacallanTheRoot](https://github.com/MacallanTheRoot)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-tool`)
3. Commit with clear messages (`git commit -m 'Add: CSS variable extractor'`)
4. Push to branch (`git push origin feature/my-tool`)
5. Open a Pull Request

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

Copyright © 2026 [MacallanTheRoot](https://github.com/MacallanTheRoot)

<br><br>

---

<a name="tr"></a>
# 💣 WebGrenade v3.2.1
### Ultimate Tarayıcı Araç Seti — Web Geliştirme Cephaneliğiniz

![Version](https://img.shields.io/badge/version-3.2.1-orange?style=for-the-badge&logo=google-chrome)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge&logo=webcomponents)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Browser Support](https://img.shields.io/badge/browsers-chrome%20%7C%20firefox-blueviolet?style=for-the-badge)

---

## 🎯 WebGrenade Nedir?

Standart tarayıcı eklentileri bir ya da iki özellik sunar. **WebGrenade** farklıdır — iş akışınızı karmaşıklaştırmadan **8+ temel araca anında erişim** gerektiren web profesyonelleri, geliştiriciler ve ileri düzey kullanıcılar için eksiksiz bir taktik araç setidir.

WebGrenade tamamen **çevrimdışı-öncelikli** çalışır. Tüm veriler `chrome.storage`'da kalır, tarayıcınızdan hiçbir şey çıkmaz. Takip yok, telemetri yok, bulut bağımlılığı yok.

---

## ⚡ Temel Cephanelik: 8 Profesyonel Modül

| Modül | Teknoloji | Özellikler |
| :--- | :--- | :--- |
| **📥 Medya Merkezi** | `RapidAPI` + `HTML5 Video Sniffer` | YouTube video indirme (MP4/MP3, 1080p–360p) + herhangi bir sayfadaki yerel `<video>` öğelerini Aç/İndir düğmeleriyle otomatik algılama |
| **🔗 Link İstasyonu** | `is.gd / TinyURL API` | Çok sağlayıcılı URL kısaltma, QR kod üretimi, link geçmişi |
| **🎨 Renk Stüdyosu** | `EyeDropper API` | Ekran renk seçici, hex/RGB çıktısı, palet geçmişi (son 10), **📋 Palet Kopyala** (tüm renkleri virgülle ayrılmış hex olarak dışa aktarır) |
| **🔐 Güvenlik Merkezi** | `Crypto.getRandomValues` | Kriptografik güvenli şifre üretici (8–32 karakter), güç ölçer |
| **🍪 Çerez Yöneticisi** | `Chrome Cookies API` | Tam CRUD, domain filtreleme, JSON dışa/içe aktarma, toplu silme |
| **📡 RSS Okuyucu** | `Background Fetch` | **Otomatik keşif** ile çok kaynaklı RSS+Atom okuma — herhangi bir site URL'si yapıştırın, WebGrenade feed'i otomatik bulur |
| **🛠️ Yardımcı Araçlar** | `Content Scripts` + `inject.js` | **Gelişmiş Popup Engelleyici** (schomery tarzı, CSP güvenli), Karanlık Mod, Ses Güçlendirici (0–300%), Kullanıcı Ajanı Değiştirici, Geçmiş Temizleyici |
| **⚙️ Ayarlar** | `chrome.storage` | RapidAPI anahtar yönetimi, hakkında bölümü |

---

## � Detaylı Modül Rehberi

### 📥 Modül 1: Medya Merkezi

**Amaç**: YouTube videolarını indirin ve herhangi bir web sayfasındaki yerel HTML5 videolarını tespit edin.

**Özellikler**:
- **YouTube İndirici** (RapidAPI anahtarı gerektirir):
  - Çoklu format desteği: MP4 (1080p, 720p, 480p, 360p) ve MP3 (sadece ses)
  - Gerçek zamanlı video küçük resmi ve meta veri gösterimi
  - İndirme geçmişi takibi (son 5 indirme)
  - Doğrudan indirme bağlantıları yeni sekmede açılır
  
- **HTML5 Video Sniffer** (Herhangi bir sitede çalışır, API gerekmez):
  - Geçerli sayfadaki yerel `<video>` öğelerini otomatik tarar
  - İndirilemez `blob:` URL'lerini filtreler (MSE akışları)
  - `aria-label` veya yakındaki başlıklardan okunabilir etiketlerle video kaynaklarını gösterir
  - Her tespit edilen video için doğrudan "Aç" ve "İndir" düğmeleri
  - Video öğesi başına birden fazla kaynak URL'sini destekler

- **Ses Güçlendirici** (🔊):
  - Medya Merkezi'nde entegre kaydırıcı kontrolü (0–300%)
  - Tarayıcının varsayılan %100 limitinin ötesinde sesi güçlendirir
  - Gerçek zamanlı amplifikasyon için Web Audio API gain node kullanır
  - Geçerli sayfadaki tüm `<video>` ve `<audio>` öğelerinde çalışır
  - %200'e kadar bozulma yok, %300'de hafif kırpma mümkün
  - Kaydırıcı sayfa yenilemesine kadar sekme başına kalıcıdır

**Nasıl Kullanılır**:
1. YouTube videosuna veya `<video>` öğeleri olan bir sayfaya gidin
2. WebGrenade'i açın → **Medya** sekmesi
3. YouTube için: Video bilgisi otomatik yüklenir (Ayarlar'da API anahtarı gerekir)
4. Yerel videolar için: Videolar tespit edilirse "📺 Sayfada Bulundu" bölümü görünür
5. Ses amplifikasyonu için **Ses Güçlendirici** kaydırıcısını ayarlayın (varsayılan: %100)
6. Format/kalite seçin → **İndir**'e tıklayın

**Teknik Detaylar**:
- Meta veri çıkarımı için RapidAPI YouTube Veri API'sini kullanır
- Content script DOM'u `document.querySelectorAll('video')` ile tarar
- `src` niteliklerini ve `<source>` alt öğelerini çıkarır
- Doğrudan tarayıcı yönetimi için `chrome.tabs.create` ile indirir

---

### 🔗 Modül 2: Link İstasyonu

**Amaç**: URL'leri kısaltın, QR kodları oluşturun ve link geçmişini yönetin.

**Özellikler**:
- **URL Kısaltma**:
  - Çoklu sağlayıcı desteği: `is.gd` ve `TinyURL`
  - Birincil hizmet başarısız olursa otomatik yedek
  - Geçerli sekme URL'si veya yapıştırılan linklerle çalışır
  
- **QR Kod Üretici**:
  - Herhangi bir URL için 200×200px QR kodları oluşturur
  - Güvenli API tabanlı üretim kullanır (QR Server API)
  - Tek tıkla PNG olarak indirin
  - URL'ler kısaltılırken gerçek zamanlı QR güncellemesi
  
- **Link Geçmişi**:
  - Zaman damgalı son 5 kısaltılmış linki saklar
  - Panoya tek tıkla kopyalama
  - Tekil silme veya geçmişi toplu temizleme
  - Orijinal → kısaltılmış URL eşleştirmesini gösterir

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **Link** sekmesi
2. Geçerli sayfa URL'si otomatik algılanır
3. Kısaltıcı sağlayıcısını seçin (is.gd / TinyURL)
4. **URL'yi Kısalt**'a tıklayın → Kısaltılmış link QR koduyla birlikte görünür
5. **Kopyala** veya **QR İndir** düğmelerine tıklayın
6. Son linkler için aşağıdaki geçmişi görüntüleyin

**Teknik Detaylar**:
- Genel kısaltıcı API'lerini kullanır (kimlik doğrulama gerekmez)
- QR kodları `https://api.qrserver.com/v1/create-qr-code/` ile üretilir
- Geçmiş `chrome.storage.local.linkHistory`'de saklanır (maks 100 öğe)
- `navigator.clipboard.writeText()` ile panoya erişim

---

### 🎨 Modül 3: Renk Stüdyosu

**Amaç**: Herhangi bir web sayfasından renk seçin ve renk paletleri oluşturun.

**Özellikler**:
- **EyeDropper Aracı**:
  - Yerel tarayıcı EyeDropper API (Chrome 95+)
  - Piksel rengi seçmek için ekranın herhangi bir yerine tıklayın
  - Anında hex ve RGB dönüşümü
  - Seçimde otomatik panoya kopyalama
  
- **Palet Yönetimi**:
  - Son 10 seçilen rengi saklar
  - Tıkla-kopyala özellikli görsel renk ızgarası
  - **Palet Kopyala** düğmesi tüm renkleri virgülle ayrılmış hex listesi olarak dışa aktarır
  - Geçmişte yinelenen renkleri önler
  
- **Renk Dönüşümü**:
  - Hem Hex (`#FF5733`) hem de RGB (`rgb(255, 87, 51)`) formatlarını gösterir
  - Canlı renk önizleme kutusu
  - Her format için tek tıkla kopyalama

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **Renk** sekmesi
2. **Renk Seç** düğmesine tıklayın
3. Ekran kararır → Rengi yakalamak için herhangi bir yere tıklayın
4. Renk önizleme + geçmiş ızgarasında görünür
5. Hex değerini kopyalamak için herhangi bir renk örneğine tıklayın
6. Tüm kaydedilen renkleri dışa aktarmak için **📋 Palet Kopyala**'ya tıklayın

**Tarayıcı Desteği**:
- EyeDropper API gerektirir (Chrome/Edge 95+, Firefox'ta mevcut değil)
- Mevcut değilse düğme "❌ EyeDropper desteklenmiyor" gösterir

**Teknik Detaylar**:
- `new EyeDropper().open()` kullanır → `{ sRGBHex }` döndürür
- Hex'ten RGB dönüşümü: R, G, B için `parseInt(hex.slice(1,3), 16)`
- Geçmiş `chrome.storage.local.colorHistory`'de saklanır
- Palet dışa aktarma CSV dizesi oluşturur: `#ff5733, #33c3ff, #8bc34a`

---

### 🔐 Modül 4: Güvenlik Merkezi

**Amaç**: Özelleştirilebilir kurallarla kriptografik güvenli şifreler oluşturun.

**Özellikler**:
- **Şifre Üretici**:
  - Uzunluk: 8–32 karakter (ayarlanabilir kaydırıcı)
  - Karakter kümeleri: Büyük harf, Küçük harf, Sayılar, Semboller
  - Gerçek rastgelelik için `crypto.getRandomValues()` kullanır (`Math.random()` değil)
  - Seçenekler değiştiğinde gerçek zamanlı yeniden üretim
  
- **Güç Ölçer**:
  - Entropi tabanlı hesaplama: `log₂(charset^length)`
  - 4 seviye: Zayıf (<40 bit), Orta (40-60), İyi (60-80), Güçlü (80+)
  - Renk kodlamalı görsel ilerleme çubuğu
  - Ayarları düzeltirken anında güncellenir

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **Güvenlik** sekmesi
2. Şifre uzunluğu kaydırıcısını ayarlayın (varsayılan: 16)
3. Karakter türü onay kutularını işaretleyin/kaldırın
4. Her değişiklikte şifre otomatik üretilir
5. **Şifreyi Kopyala**'ya tıklayın → Otomatik olarak panoya kopyalar

**Şifre Gücü Rehberi**:
- **Zayıf** (Kırmızı, <40 bit): Dakikalar içinde kırılabilir, önemli hesaplarda kullanmayın
- **Orta** (Turuncu, 40-60): Temel koruma, düşük riskli siteler için kullanın
- **İyi** (Sarı, 60-80): Çoğu hesap için yeterince güçlü
- **Güçlü** (Yeşil, 80+): Askeri düzey, bankacılık/e-posta için önerilir

**Teknik Detaylar**:
- Entropi formülü: `length × Math.log2(charsetSize)`
- Örnek: 94 karakter kümesiyle 16 karakterlik şifre = 105 bit entropi
- Tarafsız rastgele seçim için `Uint32Array` kullanır
- Hiçbir şifre asla bir sunucuya gönderilmez veya diske kaydedilmez

---

### 🍪 Modül 5: Çerez Yöneticisi

**Amaç**: Gelişmiş düzenleme ve içe/dışa aktarma ile tarayıcı çerezleri üzerinde tam kontrol.

**Özellikler**:
- **Çerez CRUD**:
  - Geçerli domain için tüm çerezleri görüntüleyin
  - Özel değerlerle yeni çerezler ekleyin
  - Mevcut çerezleri düzenleyin (ad, değer, domain, yol, bayraklar)
  - Tekil veya tüm çerezleri tek seferde silin
  
- **Gelişmiş Düzenleme**:
  - Oturum vs. Kalıcı çerezler (son kullanma tarihi seçici)
  - Güvenlik bayrakları: Secure, HttpOnly, SameSite (Strict/Lax/None)
  - **Format** düğmeli çok satırlı değer düzenleyici
  - Kolay okuma için URL kodlu değerleri otomatik çözer
  
- **İçe/Dışa Aktarma**:
  - Tüm çerezleri panoya JSON olarak dışa aktarın
  - JSON'dan çerezleri içe aktarın (toplu ekleme)
  - Transfer sırasında tüm çerez niteliklerini korur
  - Hatalı biçimlendirilmiş JSON için hata işleme
  
- **Arama & Filtre**:
  - Çerez adı veya domain'e göre gerçek zamanlı arama
  - Domain, yol ve güvenlik bayraklarını gösterir
  - Renk kodlu secure/HttpOnly göstergeleri

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **Çerezler** sekmesi
2. Geçerli domain için tüm çerezler otomatik yüklenir
3. **Düzenlemek için**: Düzenle simgesine tıklayın → Alanları değiştirin → Kaydet
4. **Dışa aktarmak için**: **Dışa Aktar**'a tıklayın → JSON panoya kopyalanır
5. **İçe aktarmak için**: **İçe Aktar**'a tıklayın → JSON yapıştırın → Onayla

**Çerez Format Örneği** (JSON dışa aktarma):
```json
[
  {
    "name": "session_id",
    "value": "abc123xyz",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "lax",
    "expirationDate": 1735689600
  }
]
```

**Teknik Detaylar**:
- Arka plan script mesaj geçişi ile `chrome.cookies` API'sini kullanır
- Uygun izinlerle çapraz kaynak çerez erişimini destekler
- SameSite seçenekleri: `strict` (sadece aynı site), `lax` (GET çapraz site), `no_restriction` (tümü)
- Format düğmesi önce JSON güzelleştirmeyi, sonra URL çözmeyi dener

---

### 📡 Modül 6: RSS Okuyucu

**Amaç**: Otomatik feed keşfi ile RSS/Atom feed'lerine abone olun.

**Özellikler**:
- **Otomatik Keşif**:
  - Herhangi bir web sitesi URL'si yapıştırın (ör. `https://example.com`)
  - WebGrenade HTML'yi getirir ve `<link rel="alternate">` feed etiketlerini bulur
  - Doğru feed URL'sini otomatik ekler
  - RSS 2.0, RSS 1.0 ve Atom feed'leriyle çalışır
  
- **Çoklu Feed Yönetimi**:
  - Sınırsız feed ekleyin (yerel olarak saklanır)
  - Feed'ler arasında geçiş yapmak için açılır seçici
  - Feed'leri tek tek silin
  - Manuel feed URL girişi de desteklenir
  
- **Feed Okuyucu**:
  - En son 20 öğeyi görüntüler
  - Başlığı, açıklamayı ve yayın tarihini gösterir
  - Makaleyi yeni sekmede açmak için herhangi bir öğeye tıklayın
  - Hem RSS `<item>` hem de Atom `<entry>` formatlarını işler
  
- **Yenileme & Kalıcılık**:
  - Geçerli feed'i güncellemek için manuel yenileme düğmesi
  - Feed'ler `chrome.storage.local`'e senkronize edilir
  - Feed güncelleme zamanlayıcısı yok (yalnızca isteğe bağlı)

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **RSS** sekmesi
2. Giriş alanına bir web sitesi URL'si veya doğrudan feed URL'si yapıştırın
3. **Feed Ekle**'ye tıklayın
4. Web sitesi URL'si ise:
   - "🔍 RSS feed aranıyor…" görünür
   - Feed otomatik algılanır ve eklenir (veya bulunamazsa hata)
5. Açılır menüden feed seçin → Makaleler aşağıda yüklenir
6. Yeni sekmede okumak için herhangi bir makale başlığına tıklayın

**Desteklenen Feed Türleri**:
- RSS 2.0 (`<rss version="2.0">`)
- RSS 1.0 (`<rdf:RDF>`)
- Atom 1.0 (`<feed xmlns="http://www.w3.org/2005/Atom">`)

**Teknik Detaylar**:
- CORS'u atlamak için arka plan scripti HTML/XML getirir
- XML ayrıştırmak için popup bağlamında `DOMParser` kullanır
- Feed keşfi `<link type="application/rss+xml">` veya `type="application/atom+xml"` arar
- `new URL(href, pageURL)` ile göreceli feed URL'lerini mutlak URL'ye çözümler

---

### 🛠️ Modül 7: Yardımcı Araçlar

**Amaç**: Gelişmiş tarama kontrolü için kullanıcı araçları koleksiyonu.

**Özellikler**:

1. **Gelişmiş Popup Engelleyici** (v3.2+):
   - Schomery'den ilham alan 5 katmanlı mimari (yukarıdaki ayrı bölüme bakın)
   - `window.open()`, komut dosyalı tıklamalar ve hayalet bağlantıları engeller
   - Onay/bülten modallarını otomatik gizler
   - "Yoksay" / "İzin Ver & Aç" düğmeleriyle interaktif toast
   - Site beyaz liste desteği
   - Domain başına engellenen popup sayacı
   
2. **Karanlık Mod** (content script geçişi ile):
   - CSS filtre inversiyonu: `filter: invert(1) hue-rotate(180deg)`
   - Akıllı istisnalar: Resimler/videolar karşı tersine çevirme ile normal kalır
   - Geçerli sekme için aç/kapat
   - Sekme yenilemeleri arasında kalıcı
   
3. **Kullanıcı Ajanı Değiştirici**:
   - declarativeNetRequest ile tarayıcı UA dizesini değiştirir
   - Hazır ayarlar: Chrome (Windows/Mac/Linux), Firefox, Safari, Mobil
   - Değiştirdikten sonra tüm sekmeleri etkiler
   - Duyarlı tasarımları test etmek veya UA filtrelerini atlamak için yararlı

3. **Kullanıcı Ajanı Değiştirici**:
   - declarativeNetRequest ile tarayıcı UA dizesini değiştirir
   - Hazır ayarlar: Chrome (Windows/Mac/Linux), Firefox, Safari, Mobil
   - Değiştirdikten sonra tüm sekmeleri etkiler
   - Duyarlı tasarımları test etmek veya UA filtrelerini atlamak için yararlı

4. **Geçmiş Temizleyici**:
   - Zaman aralığı seçici ile toplu tarama geçmişi silme
   - Seçenekler: Son saat, 24 saat, 7 gün, 30 gün, Tüm zamanlar
   - `chrome.history.deleteRange()` ve `deleteAll()` kullanır
   - Tek tıkla onay istemi

5. **Sağ Tık Kilidi Açıcı**:
   - Bağlam menüsünde `event.preventDefault()` atlar
   - Kısıtlı sitelerde kopyala/yapıştır/incele işlevselliğini geri yükler
   - Tam etki için sayfa yenileme gerektirir

6. **PiP Modu**:
   - Sayfadaki ilk `<video>` için Picture-in-Picture etkinleştirir
   - Yardımcı Araçlar'da tek tıkla düğme
   - Videoyu tüm pencerelerin üstünde yüzdürür

7. **Markdown Kopyalayıcı**:
   - Geçerli sayfa başlığını ve URL'sini Markdown linki olarak kopyalar: `[Başlık](URL)`
   - Anında panoya kopyalama
   - Dokümantasyon yazarları için faydalı

> **Not**: Ses Güçlendirici (🔊) özelliği **Medya Merkezi** modülünde bulunur (Yardımcı Araçlar'da değil).

**Nasıl Kullanılır**:
1. WebGrenade'i açın → **Yardımcı Araçlar** sekmesi
2. Popup Engelleyici, Karanlık Mod vb. için geçiş anahtarları
3. Bazı özellikler sayfa yenilemesi gerektirir (Sağ Tık Kilidi Açıcı)
4. Popup Engelleyici geçerli domain için engellenen sayım rozetini gösterir
5. Geçerli siteyi popup engellemeden hariç tutmak için **Siteyi Beyaz Listeye Ekle**'ye tıklayın

**Beyaz Liste Özelliği**:
- Geçerli domain'i beyaz listeye ekle → Popup engelleyici otomatik devre dışı
- **Beyaz Listeyi Göster** düğmesi ile beyaz listeyi görüntüle/yönet
- 🗑️ düğmesiyle siteleri tek tek kaldırın

**Teknik Detaylar**:
- Geçiş durumları `chrome.storage.local.utilityStates`'e kaydedilir
- `chrome.tabs.sendMessage` veya `chrome.scripting.executeScript` ile content script enjeksiyonu
- Engellenen sayım sayfanın `localStorage`'ında `webgrenade_blocked_<domain>` olarak saklanır
- `chrome://`, `edge://`, `about:` sayfalarına enjekte edilemez (uyarı gösterir)

---

### ⚙️ Modül 8: Ayarlar

**Amaç**: API anahtarlarını yapılandırın ve eklenti bilgilerini görüntüleyin.

**Özellikler**:
- **RapidAPI Yapılandırması**:
  - `X-RapidAPI-Key` ve API Host için giriş alanları
  - Medya Merkezi'nde YouTube video indirmeleri için gerekli
  - Kimlik bilgileri `chrome.storage.local`'de güvenli şekilde saklanır
  - Başarıyla kaydedildiğinde görsel onay
  
- **Kullanıcı Ajanı Değiştirici**:
  - 5 UA hazır ayarı olan açılır menü: Chrome (Win/Mac/Linux), Firefox, Safari, Edge, Mobil
  - declarativeNetRequest API ile tarayıcı kimliğini değiştirir
  - Tüm sekmeleri etkiler ve eklenti yeniden yüklemeyi atlatır
  - Duyarlı tasarımları test etmek veya UA filtrelerini atlamak için yararlı
  
- **Tarayıcı Maskesi** (🔄 Otomatik Değişim):
  - Kullanıcı Ajanınızı otomatik değiştirmek için geçiş
  - Chrome kullanıyorsanız → Firefox UA'ya geçer
  - Firefox kullanıyorsanız → Chrome UA'ya geçer
  - Manuel seçim olmadan tek tıkla anonimlik
  - Devre dışı bırakma orijinal tarayıcı UA'yı geri yükler
  
- **Hakkında Bölümü**:
  - Eklenti sürümü (v3.2.1)
  - Geliştirici kredisi (MacallanTheRoot)
  - GitHub repository linki
  - MIT Lisans bildirimi

**YouTube API'yi Nasıl Kurarım**:
1. [RapidAPI.com](https://rapidapi.com/) adresini ziyaret edin
2. Ücretsiz hesap için kaydolun
3. Bir YouTube Veri API'sine abone olun (ör. "YouTube v3" veya benzeri)
4. Kontrol panelinden `X-RapidAPI-Key`'inizi kopyalayın
5. API Host'unu kopyalayın (ör. `youtube-v31.p.rapidapi.com`)
6. WebGrenade'i açın → **Ayarlar** → Her iki değeri yapıştırın → **Kaydet**

**Depolama**:
```json
{
  "apiConfig": {
    "key": "buraya-rapidapi-anahtariniz",
    "host": "youtube-v31.p.rapidapi.com",
    "configured": true
  }
}
```

**Gizlilik Notu**:
- API anahtarları asla tarayıcınızdan çıkmaz
- Tüm istekler doğrudan makinenizden RapidAPI'ye gider
- WebGrenade arka plan sunucuları dahil değildir

---

## �🚫 Gelişmiş Popup Engelleyici (v3.2.1)

Popup engelleyici, v3.2.x'in amiral gemisi özelliğidir. **CSP güvenli, Schomery'den ilham alan çok katmanlı bir mimari** kullanır:

```
Katman 1 — window.open Proxy (ana dünya)
   Tüm window.open() çağrılarını Proxy trap ile yakalar.

Katman 2 — Capture-phase click/submit dinleyici (ana dünya)
   _blank bağlantıları hedefleyen güvenilmez (isTrusted === false) olayları engeller.
   Katman 1'i atlayan sahte script tıklamalarını yakalar.

Katman 3 — Hayalet bağlantı koruması (ana dünya)
   HTMLAnchorElement.prototype.click ve HTMLFormElement.prototype.submit'i override eder.
   Hiç render edilmeden _blank'e giden ayrılmış DOM öğelerini engeller.

Katman 4 — MutationObserver overlay gizleyici (izole dünya)
   Yüksek z-index'li sabit konumlu onay/abonelik modallarını otomatik gizler.

Katman 5 — İnteraktif Toast bildirimi (izole dünya)
   Herhangi bir popup engellendiğinde, sağ alt köşede engellenen URL ve
   "Yoksay" ile "İzin Ver & Aç" düğmeleriyle temalı bir toast görünür.
```

**Neden `inject.js`?** Satır içi `script.textContent` enjeksiyonu, GitHub ve Twitter gibi sitelerde katı CSP'ler tarafından engellenir. `chrome.runtime.getURL('inject.js')` ile `src=` üzerinden yükleme, uzantı kaynağı her zaman güvenilir kabul edildiğinden daima izin verilir.

---

## 📦 Kurulum

### Chrome / Edge (Chromium)

```bash
git clone https://github.com/MacallanTheRoot/webgrenade.git
```

1. `chrome://extensions/` adresini açın
2. **Geliştirici Modunu** etkinleştirin
3. **Paketlenmemiş Yükle** → `webgrenade/` klasörünü seçin

### Firefox

1. `about:debugging#/runtime/this-firefox` adresine gidin
2. **Geçici Eklenti Yükle**'ye tıklayın
3. `webgrenade/` içindeki `manifest.json`'ı seçin

---

## � Proje Yapısı

```
webgrenade/
├── manifest.json       # MV3 manifest (Chrome + Firefox)
├── background.js       # Service worker: bağlam menüleri, fetch proxy, UA değiştirici, geçmiş temizleyici
├── content.js          # İzole-dünya content script: karanlık mod, ses güçlendirici, popup toast, video sniffer
├── inject.js           # Ana-dünya script (CSP güvenli src= enjeksiyonu): popup engelleyici çekirdek
├── popup.html          # Eklenti popup UI
├── popup.js            # Popup mantığı: tüm 8 modül
├── utils.js            # Yardımcı fonksiyonlar: YouTube ayrıştırma, QR üretimi, pano yardımcıları
├── style.css           # Turuncu/Siyah dashboard teması
└── icons/              # Eklenti ikonları (16, 48, 128px)
```

---

## 🏗️ Modül Mimarisi

### 📄 background.js
**Tip**: Service Worker (Arka Plan Scripti)  
**Satır Sayısı**: ~228  
**Sorumluluklar**:
- **Bağlam Menüleri**: 6 motorda sağ-tık görsel arama (Google Lens, Bing, Yandex, TinEye, Baidu, Sogou)
- **Dinamik Kurallar (DNR)**: declarativeNetRequest API ile Kullanıcı Ajanı değiştirme
- **Cookie API Köprüsü**: Çerez Yöneticisi için çapraz-kaynak çerez erişimi sağlar
- **RSS Fetch Proxy**: RSS Okuyucu için otomatik keşifli arka plan çekme
- **Geçmiş Temizleyici**: Zaman aralığı filtrelemeli toplu chrome.history silme
- **Mesaj Yönlendirme**: Popup/content scriptlerinden bileşenler arası iletişimi yönetir

**Ana Özellikler**:
- Tarayıcılar arası uyumlu (Chrome MV3 & Firefox MV3)
- Kullanıcı tarafından başlatılan API çağrıları dışında telemetri veya dış bağlantı yok
- Olay odaklı mimari ile kalıcı service worker

---

### 📄 content.js
**Tip**: Content Script (İzole Dünya)  
**Satır Sayısı**: ~375  
**Enjeksiyon**: Tüm URL'lerde `document_start`  
**Sorumluluklar**:
- **Karanlık Mod**: Akıllı istisnalarla CSS filtre inversiyonu (resimler, videolar korunur)
- **Ses Güçlendirici**: `<video>` ve `<audio>` için Web Audio API gain node (0-300% amplifikasyon)
- **Popup Engelleyici Entegrasyonu**: CSP güvenli `<script src>` yöntemiyle `inject.js`'yi ana dünyaya enjekte eder
- **İnteraktif Toast Bildirimleri**: "Yoksay" / "İzin Ver & Aç" düğmeleriyle sağ alt temalı uyarılar
- **MutationObserver**: Z-index ve anahtar kelime algılamasına dayalı onay/bülten modallarını otomatik gizler
- **HTML5 Video Sniffer**: Yerel `<video>` öğeleri için DOM tarar, `src` özniteliklerini çıkarır (`blob:` MSE akışları hariç)

**Mimari**:
```
content.js (izole dünya)
    ├── injectViaScriptSrc()       → inject.js'yi güvenli yükler
    ├── startOverlayObserver()     → MutationObserver ile modal gizleme
    ├── createPopupToast()         → İnteraktif engellenmiş popup UI
    └── WeakMap audioContextMap    → Video öğesinden Web Audio context eşleştirmesi
```

**Güvenlik**:
- Sıfır `innerHTML` kullanımı (tüm DOM `createElement` + `textContent` ile)
- `source === 'webgrenade'` kontrolü ile `window.postMessage` doğrular
- CSP uyumlu enjeksiyon stratejisi (satır içi script yok)

---

### 📄 inject.js
**Tip**: Ana Dünya Scripti  
**Satır Sayısı**: ~141  
**Enjeksiyon**: content.js'den `chrome.runtime.getURL()` ile  
**Amaç**: Schomery'den ilham alan çok katmanlı engelleme kullanan gelişmiş popup engelleyici

**Mimari**:
```
Katman 1: window.open Proxy
    └── TÜM window.open() çağrılarını yakalar → null döndürür

Katman 2: Capture-phase Event Listener
    └── target="_blank" üzerinde güvenilmez (isTrusted === false) click/auxclick/submit'i engeller

Katman 3: Prototype Override
    └── HTMLAnchorElement.prototype.click()'i ele geçirir
    └── HTMLFormElement.prototype.submit()'i ele geçirir
```

**Neden Ana Dünya?**
- Popup'lar sayfa scriptlerinden kaynaklanır, eklenti bağlamından değil
- Proxy, sayfa JS'nin gördüğü *gerçek* window.open'ı sarmallamalıdır
- İzole dünya (content.js) sayfa düzeyindeki window.open'ı engelleyemez

**Neden `<script src>` satır içi değil?**
- Katı CSP'ler (GitHub, Twitter, vb.) `script.textContent` enjeksiyonunu engeller
- Eklenti kaynakları (`chrome-extension://`) `src=` öznitelikleri için CSP'yi atlar
- Kendini silen script öğesi kalıcı DOM izi bırakmaz

**İletişim**:
```javascript
window.postMessage({
  source: 'webgrenade',
  action: 'popup_blocked',
  url: engellenmiş URL
}, '*');
```

---

### 📄 popup.js
**Tip**: Eklenti Popup Arayüzü  
**Satır Sayısı**: ~2808  
**Sorumluluklar**:
- **Dikey Dashboard**: Durum kalıcılığı olan 8 modül sekmesi
- **Medya Merkezi**: YouTube indirici (RapidAPI) + HTML5 video sniffer UI
- **Link İstasyonu**: URL kısaltıcı (is.gd/TinyURL) + QR üretici + geçmiş
- **Renk Stüdyosu**: EyeDropper API + palet geçmişi + toplu kopyalama
- **Güvenlik Merkezi**: Şifre üretici (Crypto.getRandomValues) + güç ölçer
- **Çerez Yöneticisi**: JSON dışa/içe aktarma ile chrome.cookies için tam CRUD UI
- **RSS Okuyucu**: Otomatik keşif girişi ile çok beslemeli okuyucu
- **Yardımcı Araçlar**: Tüm content.js özellikleri için geçiş anahtarları + geçmiş temizleyici
- **Ayarlar**: API anahtar yapılandırması + hakkında bölümü

**Durum Yönetimi**:
```javascript
state = {
  currentUrl: '',
  currentTab: null,
  activeModule: 'media',
  videoData: null,
  apiConfig: { key, host, configured }
}
```

**Depolama**:
- `chrome.storage.local`: API anahtarları, modül tercihleri, geçmiş verileri
- `chrome.storage.sync`: Cihazlar arası ayarlar (çerezler, RSS beslemeleri)

---

### 📄 utils.js
**Tip**: Paylaşılan Yardımcı Kütüphane  
**Satır Sayısı**: ~465  
**Sorumluluklar**:
- **YouTube Yardımcıları**:
  - `isYouTubeUrl(url)`: Regex doğrulaması
  - `extractVideoId(url)`: watch, shorts, embed, youtu.be formatlarını destekler
- **QR Kod Üretimi**: Hata düzeltmeli canvas tabanlı QR kodlama
- **Pano İşlemleri**: `document.execCommand` yedeklemeli güvenli `navigator.clipboard`
- **DOM Yardımcıları**: Güvenli öğe oluşturma, olay delegasyon kalıpları
- **URL Doğrulama**: Protokol kontrolü, domain çıkarma
- **Format Dönüşümü**: Zaman damgasını okunabilir süreye çevirme

**Örnek Fonksiyonlar**:
```javascript
extractVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')  // → 'dQw4w9WgXcQ'
extractVideoId('https://youtu.be/dQw4w9WgXcQ')            // → 'dQw4w9WgXcQ'
extractVideoId('https://youtube.com/shorts/abc123')       // → 'abc123'
```

---

## �📋 Değişiklik Günlüğü

### v3.2.1
- İnteraktif popup engelleme toast'u (sağ alt, temalı, 10 sn otomatik kapanma)
- "İzin Ver & Aç" engellenen URL'yi `chrome.tabs.create` ile açar

### v3.2.0
- `inject.js` — satır içi script enjeksiyonunu değiştiren CSP güvenli popup engelleyici
- Medya Merkezi'nde HTML5 Video Sniffer
- Renk Paleti Dışa Aktarma (📋 Kopyala düğmesi)

### v3.1.0
- RSS Otomatik Keşif
- Popup engelleyici ana dünya enjeksiyonu

### v3.0.0
- Tam dikey dashboard yeniden yazımı
- Reklam Engelleyici kaldırıldı
- Çerez Yöneticisi, RSS Okuyucu, UA Değiştirici eklendi

---

## ⚠️ Yasal Uyarı

**WebGrenade**, **meşru web geliştirme ve üretkenlik** amaçları için tasarlanmıştır. Kullanıcılar, etkileşime girdikleri web siteleri ve API'lerin Hizmet Şartları'na uymaktan sorumludur.

**Geliştirici**: [MacallanTheRoot](https://github.com/MacallanTheRoot)

---

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Bir özellik dalı oluşturun (`git checkout -b feature/muhtesem-arac`)
3. Net mesajlarla commit yapın (`git commit -m 'Ekle: CSS değişken çıkarıcı'`)
4. Dala push yapın (`git push origin feature/muhtesem-arac`)
5. Bir Pull Request açın

---

## 📄 Lisans

MIT Lisansı — Detaylar için [LICENSE](LICENSE) dosyasına bakın.

Telif Hakkı © 2026 [MacallanTheRoot](https://github.com/MacallanTheRoot)
