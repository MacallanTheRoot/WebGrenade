<div align="center">
  <a href="#en">🇺🇸 English</a> | <a href="#tr">🇹🇷 Türkçe</a>
</div>

<a name="en"></a>
# 💣 WebGrenade v2.0
### Professional Webmaster Utility Suite - Your Web Development Arsenal

![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge&logo=google-chrome)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge&logo=webcomponents)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Browser Support](https://img.shields.io/badge/browsers-chrome%20%7C%20firefox-blueviolet?style=for-the-badge)

---

## 🎯 The "Why": Professional Tooling for Power Users

Standard browser extensions offer one or two features - a video downloader here, a password manager there. **WebGrenade** is different. It's a complete tactical toolkit for web professionals, developers, and power users who need **instant access to 8+ essential utilities** without cluttering their workflow.

In the modern web environment, you need tools that work **fast**, stay **secure**, and respect your **privacy**. WebGrenade operates entirely **offline** - all data stays in localStorage, nothing leaves your browser. No tracking, no telemetry, no cloud dependencies.

---

## ⚡ Core Arsenal: 8 Professional Modules

WebGrenade delivers enterprise-grade functionality through a unified, vertical dashboard interface.

| Module | Technology | Professional Features |
| :--- | :--- | :--- |
| **📥 Media Center** | `RapidAPI Integration` | **YouTube Intelligence**: Auto-detect videos, preview thumbnails, download MP4/MP3 with quality selection (1080p/720p/360p). Supports API-based extraction with fallback mechanisms. |
| **🔗 Link Station** | `is.gd / TinyURL API` | **Smart URL Tools**: Instant shortening with multi-provider fallback, QR code generation (customizable), link history tracking, one-click clipboard operations. |
| **🎨 Color Studio** | `EyeDropper API` | **Designer Toolkit**: Screen color picker with hex/rgb conversion, color palette history (last 10), visual color grid for quick reference. |
| **🔐 Security Hub** | `Crypto.getRandomValues` | **Password Generator**: Cryptographically secure passwords (8-32 chars), customizable character sets (uppercase/lowercase/numbers/symbols), real-time strength meter (entropy-based). |
| **🍪 Cookie Manager** | `Chrome Cookies API` | **Professional Control**: Full CRUD operations, domain filtering, export/import (JSON), format beautifier, session/persistent management, secure/HttpOnly flags. |
| **📡 RSS Reader** | `CORS Proxy` | **Feed Aggregation**: Multi-source RSS reading, background fetching, chronological sorting, clean article previews with metadata. |
| **🛠️ Utilities** | `Content Scripts` | **Power Tools**: Right-click unlocker, 6-layer popup blocker (AI-powered detection), page cleaner, Picture-in-Picture mode, Markdown page copier, site whitelist management. |
| **⚙️ Settings** | `localStorage` | **Configuration Hub**: RapidAPI key management, advanced settings toggle, about section with GitHub integration. |

---

## 🎨 Professional Interface: Dark Mode Dashboard

WebGrenade features a **vertical sidebar navigation** inspired by modern IDEs and professional tools like VS Code, Figma, and Linear.

### 🖥️ Interface Highlights
- **Persistent Sidebar**: Quick-access module icons with tooltips
- **Module Content Area**: Smooth transitions, card-based layouts
- **Toast Notifications**: Non-intrusive success/error feedback
- **Modal Systems**: Professional dialogs for complex operations (Cookie Import, Whitelist)
- **Responsive Forms**: Real-time validation, smart input handling

### 🎯 UX Philosophy
1. **Instant Access**: All tools one click away
2. **Zero Context Switching**: Everything in one popup
3. **Visual Feedback**: Every action has clear confirmation
4. **Smart Defaults**: Most features work out-of-the-box

---

## 🔐 Privacy & Security: Zero-Trust Architecture

WebGrenade follows a **zero-trust data model**:

1. **No External Data Transmission**: All operations happen locally
2. **localStorage Only**: API keys, settings, history stored in browser
3. **No Tracking**: Zero analytics, no telemetry, no user profiling
4. **Content Security Policy**: Strict CSP prevents XSS attacks
5. **Input Sanitization**: All user data escaped via `escapeHtml()` before rendering

### 🛡️ Security Features
- **Cookie Encryption Awareness**: Supports HttpOnly/Secure flags
- **Safe XML Parsing**: Uses `DOMParser` for RSS feeds
- **CORS Protection**: Background script handles cross-origin requests
- **Permission Scoping**: Only requests necessary browser permissions

---

## 📦 Installation

### For Chrome/Edge (Chromium-based)

```bash
git clone https://github.com/MacallanTheRoot/webgrenade.git
cd webgrenade
```

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `webgrenade` folder

### For Firefox

Download the latest release: **webgrenade-firefox.zip**

1. Go to `about:addons`
2. Click gear icon → **Install Add-on From File**
3. Select `webgrenade-firefox.zip`

*(Or submit to Firefox Add-ons for auto-updates)*

---

## 🛠️ Configuration

### 1. API Key Setup (Optional - for Media Center)

WebGrenade uses RapidAPI for YouTube video information extraction.

**Get Your API Key**:
1. Visit [RapidAPI - YouTube API](https://rapidapi.com/)
2. Subscribe to a YouTube data API
3. Copy your `X-RapidAPI-Key`

**Configure in Extension**:
1. Open WebGrenade
2. Go to **Settings** module (⚙️ icon)
3. Paste API Key and Host
4. Click **Save Configuration**

### 2. Utilities Configuration

**Popup Blocker Whitelist**:
- Add trusted sites via **Trust Site** button
- Manage whitelist in Utilities module
- Per-domain blocking count tracking

**Custom Settings**:
- Toggle advanced features
- Configure PiP behavior
- Adjust popup sensitivity

---

## 📋 Feature Documentation

### Media Center (YouTube Download)
```javascript
// Features:
✅ Auto-detect current YouTube video
✅ Display thumbnail + title + URL
✅ Format selection: MP4 (video) or MP3 (audio)
✅ Quality options: 1080p, 720p, 360p
✅ Download history (last 5)
```

### Popup Blocker (6-Layer System)
```javascript
// Layer 1: Window API Override (blocks window.open, alert, confirm, prompt)
// Layer 2: Click Hijacking Prevention (detects suspicious link patterns)
// Layer 3: Smart Overlay Detection (5 rules: z-index, coverage, keywords, fixed elements, iframe)
// Layer 4: Aggressive DOM Scanner (debounced, targets overlays)
// Layer 5: MutationObserver (monitors DOM changes in real-time)
// Layer 6: Periodic Scanning (checks every 3s for persistent popups)
```

### Cookie Manager (Professional CRUD)
```javascript
// Operations:
✅ View all domain cookies with metadata
✅ Edit: Name, Value, Domain, Path, Secure, HttpOnly, SameSite
✅ Export to JSON (clipboard)
✅ Import from JSON (with validation)
✅ Format beautifier (JSON prettify / URL decode)
✅ Bulk delete
```

---

## ⚠️ Disclaimer

**WebGrenade** is designed for **legitimate web development and productivity** purposes. Users are responsible for complying with Terms of Service of websites and APIs they interact with. The developers are not liable for misuse.

- **RapidAPI Usage**: Respect rate limits and subscription terms
- **Cookie Management**: Modifying cookies may violate website policies
- **Content Scraping**: Ensure compliance with robots.txt and ToS

**Maintained by**: [MacallanTheRoot](https://github.com/MacallanTheRoot)

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Commit with clear messages (`git commit -m 'Add: CSS variable extractor'`)
4. Push to branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

Copyright © 2026 [MacallanTheRoot](https://github.com/MacallanTheRoot)

<br>
<br>
<br>

---

<a name="tr"></a>
# 💣 WebGrenade v2.0
### Profesyonel Web Yöneticisi Araç Seti - Web Geliştirme Cephaneliğiniz

![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge&logo=google-chrome)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge&logo=webcomponents)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Browser Support](https://img.shields.io/badge/browsers-chrome%20%7C%20firefox-blueviolet?style=for-the-badge)

---

## 🎯 Neden?: Profesyoneller İçin Güçlü Araçlar

Standart tarayıcı eklentileri bir veya iki özellik sunar - bir video indirici burada, bir şifre yöneticisi orada. **WebGrenade** farklıdır. İş akışınızı karmaşıklaştırmadan **8+ temel araca anında erişim** gerektiren web profesyonelleri, geliştiriciler ve ileri düzey kullanıcılar için eksiksiz bir taktik araç setidir.

Modern web ortamında, **hızlı** çalışan, **güvenli** kalan ve **gizliliğinize saygı duyan** araçlara ihtiyacınız var. WebGrenade tamamen **çevrimdışı** çalışır - tüm veriler localStorage'da kalır, tarayıcınızdan hiçbir şey çıkmaz. Takip yok, telemetri yok, bulut bağımlılığı yok.

---

## ⚡ Temel Cephanelik: 8 Profesyonel Modül

WebGrenade, birleşik, dikey kontrol paneli arayüzü üzerinden kurumsal düzeyde işlevsellik sunar.

| Modül | Teknoloji | Profesyonel Özellikler |
| :--- | :--- | :--- |
| **📥 Medya Merkezi** | `RapidAPI Entegrasyonu` | **YouTube İstihbaratı**: Videoları otomatik algılama, küçük resim önizleme, kalite seçimiyle (1080p/720p/360p) MP4/MP3 indirme. Yedek mekanizmalı API tabanlı çıkarma desteği. |
| **🔗 Link İstasyonu** | `is.gd / TinyURL API` | **Akıllı URL Araçları**: Çok sağlayıcılı yedeklemeyle anında kısaltma, QR kod üretimi (özelleştirilebilir), link geçmişi takibi, tek tıkla panoya kopyalama. |
| **🎨 Renk Stüdyosu** | `EyeDropper API` | **Tasarımcı Araç Seti**: Hex/rgb dönüşümlü ekran renk seçici, renk paleti geçmişi (son 10), hızlı başvuru için görsel renk ızgarası. |
| **🔐 Güvenlik Merkezi** | `Crypto.getRandomValues` | **Şifre Üretici**: Kriptografik güvenli şifreler (8-32 karakter), özelleştirilebilir karakter setleri (büyük/küçük harf/sayılar/semboller), gerçek zamanlı güç ölçer (entropi tabanlı). |
| **🍪 Çerez Yöneticisi** | `Chrome Cookies API` | **Profesyonel Kontrol**: Tam CRUD işlemleri, domain filtreleme, dışa/içe aktarma (JSON), format güzelleştirici, oturum/kalıcı yönetim, güvenli/HttpOnly bayrakları. |
| **📡 RSS Okuyucu** | `CORS Proxy` | **Feed Toplama**: Çok kaynaklı RSS okuma, arka plan getirme, kronolojik sıralama, metadata ile temiz makale önizlemeleri. |
| **🛠️ Yardımcı Araçlar** | `Content Scripts` | **Güç Araçları**: Sağ tık kilidi açma, 6 katmanlı popup engelleyici (AI destekli algılama), sayfa temizleyici, Resim-içinde-Resim modu, Markdown sayfa kopyalayıcı, site beyaz liste yönetimi. |
| **⚙️ Ayarlar** | `localStorage` | **Yapılandırma Merkezi**: RapidAPI key yönetimi, gelişmiş ayarlar geçişi, GitHub entegrasyonlu hakkında bölümü. |

---

## 🎨 Profesyonel Arayüz: Karanlık Mod Kontrol Paneli

WebGrenade, VS Code, Figma ve Linear gibi modern IDE'lerden ve profesyonel araçlardan ilham alan **dikey kenar çubuğu navigasyonu** içerir.

### 🖥️ Arayüz Öne Çıkanlar
- **Kalıcı Kenar Çubuğu**: Araç ipuçlarıyla hızlı erişim modül simgeleri
- **Modül İçerik Alanı**: Yumuşak geçişler, kart tabanlı düzenler
- **Bildirim Mesajları**: Müdahale etmeyen başarı/hata geri bildirimi
- **Modal Sistemler**: Karmaşık işlemler için profesyonel diyaloglar (Çerez İçe Aktarma, Beyaz Liste)
- **Duyarlı Formlar**: Gerçek zamanlı doğrulama, akıllı girdi işleme

### 🎯 UX Felsefesi
1. **Anında Erişim**: Tüm araçlar bir tık uzakta
2. **Sıfır Bağlam Değiştirme**: Her şey tek popup'ta
3. **Görsel Geri Bildirim**: Her eylemin net onayı var
4. **Akıllı Varsayılanlar**: Çoğu özellik kutudan çıkar çıkmaz çalışır

---

## 🔐 Gizlilik & Güvenlik: Sıfır-Güven Mimarisi

WebGrenade bir **sıfır-güven veri modeli** izler:

1. **Harici Veri İletimi Yok**: Tüm işlemler yerel olarak gerçekleşir
2. **Yalnızca localStorage**: API anahtarları, ayarlar, geçmiş tarayıcıda saklanır
3. **Takip Yok**: Sıfır analitik, telemetri yok, kullanıcı profilleme yok
4. **İçerik Güvenlik Politikası**: Katı CSP, XSS saldırılarını önler
5. **Girdi Sanitizasyonu**: Tüm kullanıcı verileri render edilmeden önce `escapeHtml()` ile temizlenir

### 🛡️ Güvenlik Özellikleri
- **Çerez Şifreleme Farkındalığı**: HttpOnly/Secure bayraklarını destekler
- **Güvenli XML Ayrıştırma**: RSS feedleri için `DOMParser` kullanır
- **CORS Koruması**: Arka plan betiği cross-origin isteklerini yönetir
- **İzin Kapsamı**: Yalnızca gerekli tarayıcı izinlerini ister

---

## 📦 Kurulum

### Chrome/Edge için (Chromium tabanlı)

```bash
git clone https://github.com/MacallanTheRoot/webgrenade.git
cd webgrenade
```

1. `chrome://extensions/` adresini açın
2. **Geliştirici Modunu** etkinleştirin
3. **Paketlenmemiş Yükle**'ye tıklayın
4. `webgrenade` klasörünü seçin

### Firefox için

Son sürümü indirin: **webgrenade-firefox.zip**

1. `about:addons` adresine gidin
2. Dişli simgesine tıklayın → **Dosyadan Eklenti Yükle**
3. `webgrenade-firefox.zip` dosyasını seçin

*(Veya otomatik güncellemeler için Firefox Eklentileri'ne gönderin)*

---

## 🛠️ Yapılandırma

### 1. API Anahtar Kurulumu (İsteğe Bağlı - Medya Merkezi için)

WebGrenade, YouTube video bilgi çıkarma için RapidAPI kullanır.

**API Anahtarınızı Alın**:
1. [RapidAPI - YouTube API](https://rapidapi.com/) adresini ziyaret edin
2. Bir YouTube veri API'sine abone olun
3. `X-RapidAPI-Key`'inizi kopyalayın

**Eklentide Yapılandırın**:
1. WebGrenade'i açın
2. **Ayarlar** modülüne gidin (⚙️ simgesi)
3. API Anahtarı ve Host'u yapıştırın
4. **Yapılandırmayı Kaydet**'e tıklayın

### 2. Yardımcı Araçlar Yapılandırması

**Popup Engelleyici Beyaz Listesi**:
- **Site'ye Güven** düğmesi ile güvenilen siteleri ekleyin
- Beyaz listeyi Yardımcı Araçlar modülünde yönetin
- Domain başına engelleme sayısı takibi

**Özel Ayarlar**:
- Gelişmiş özellikleri değiştirin
- PiP davranışını yapılandırın
- Popup hassasiyetini ayarlayın

---

## 📋 Özellik Dokümantasyonu

### Medya Merkezi (YouTube İndirme)
```javascript
// Özellikler:
✅ Mevcut YouTube videosunu otomatik algılama
✅ Küçük resim + başlık + URL gösterimi
✅ Format seçimi: MP4 (video) veya MP3 (ses)
✅ Kalite seçenekleri: 1080p, 720p, 360p
✅ İndirme geçmişi (son 5)
```

### Popup Engelleyici (6 Katmanlı Sistem)
```javascript
// Katman 1: Window API Override (window.open, alert, confirm, prompt'u engeller)
// Katman 2: Tıklama Hijacking Önleme (şüpheli link desenlerini tespit eder)
// Katman 3: Akıllı Overlay Algılama (5 kural: z-index, kaplama, anahtar kelimeler, fixed elemanlar, iframe)
// Katman 4: Agresif DOM Tarayıcı (debounced, overlay'leri hedefler)
// Katman 5: MutationObserver (DOM değişikliklerini gerçek zamanlı izler)
// Katman 6: Periyodik Tarama (kalıcı popup'lar için her 3s kontrol)
```

### Çerez Yöneticisi (Profesyonel CRUD)
```javascript
// İşlemler:
✅ Tüm domain çerezlerini metadata ile görüntüleme
✅ Düzenleme: Name, Value, Domain, Path, Secure, HttpOnly, SameSite
✅ JSON'a dışa aktarma (panoya)
✅ JSON'dan içe aktarma (doğrulama ile)
✅ Format güzelleştirici (JSON prettify / URL decode)
✅ Toplu silme
```

---

## ⚠️ Yasal Uyarı

**WebGrenade**, **meşru web geliştirme ve üretkenlik** amaçları için tasarlanmıştır. Kullanıcılar, etkileşime girdikleri web siteleri ve API'lerin Hizmet Şartları'na uymaktan sorumludur. Geliştiriciler kötüye kullanımdan sorumlu değildir.

- **RapidAPI Kullanımı**: Oran limitlerini ve abonelik şartlarını gözetin
- **Çerez Yönetimi**: Çerezleri değiştirmek web sitesi politikalarını ihlal edebilir
- **İçerik Scraping**: robots.txt ve ToS ile uyumluluğu sağlayın

**Geliştirici**: [MacallanTheRoot](https://github.com/MacallanTheRoot)

---

## 🤝 Katkıda Bulunma

Katkılar memnuniyetle karşılanır! Lütfen:
1. Repository'yi fork edin
2. Bir özellik dalı oluşturun (`git checkout -b feature/muhtesem-arac`)
3. Net mesajlarla commit yapın (`git commit -m 'Ekle: CSS değişken çıkarıcı'`)
4. Dala push yapın (`git push origin feature/muhtesem-arac`)
5. Bir Pull Request açın

---

## 📄 Lisans

MIT Lisansı - Detaylar için [LICENSE](LICENSE) dosyasına bakın

Telif Hakkı © 2026 [MacallanTheRoot](https://github.com/MacallanTheRoot)
