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

## 🚫 Advanced Popup Blocker (v3.2.1)

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
├── style.css           # Orange/Black dashboard theme
└── icons/              # Extension icons (16, 48, 128px)
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

## 🚫 Gelişmiş Popup Engelleyici (v3.2.1)

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

## 📋 Değişiklik Günlüğü

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
