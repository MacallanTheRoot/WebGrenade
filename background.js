/**
 * WebGrenade - Background Service Worker
 * Handles Context Menus, Cookies, and CORS Fetching
 */

// 1. Context Menus (Reverse Image Search)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "search-image-parent",
    title: "🔍 Search Image on...",
    contexts: ["image"]
  });

  const engines = [
    { id: "google", title: "Google Lens", url: "https://lens.google.com/uploadbyurl?url=" },
    { id: "bing", title: "Bing", url: "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=" },
    { id: "yandex", title: "Yandex", url: "https://yandex.com/images/search?rpt=imageview&url=" },
    { id: "tineye", title: "TinEye", url: "https://tineye.com/search?url=" }
  ];

  engines.forEach(engine => {
    chrome.contextMenus.create({
      parentId: "search-image-parent",
      id: engine.id,
      title: engine.title,
      contexts: ["image"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const engines = {
    google: "https://lens.google.com/uploadbyurl?url=",
    bing: "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=",
    yandex: "https://yandex.com/images/search?rpt=imageview&url=",
    tineye: "https://tineye.com/search?url="
  };

  if (engines[info.menuItemId] && info.srcUrl) {
    chrome.tabs.create({ url: engines[info.menuItemId] + encodeURIComponent(info.srcUrl) });
  }
});

// 2. Message Handling (Cookies & RSS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      sendResponse({ cookies: cookies });
    });
    return true; // Async response
  }

  if (request.action === 'setCookie') {
    const cookieDetails = {
      url: request.cookie.url,
      name: request.cookie.name,
      value: request.cookie.value,
      domain: request.cookie.domain,
      path: request.cookie.path,
      secure: request.cookie.secure,
      httpOnly: request.cookie.httpOnly,
      sameSite: request.cookie.sameSite,
      expirationDate: request.cookie.expirationDate
    };
    
    // Remove expiration if session cookie
    if (!cookieDetails.expirationDate) delete cookieDetails.expirationDate;

    chrome.cookies.set(cookieDetails, (cookie) => {
      if (cookie) {
        sendResponse({ success: true, cookie });
      } else {
        sendResponse({ success: false, error: chrome.runtime.lastError });
      }
    });
    return true;
  }

  if (request.action === 'deleteCookie') {
    chrome.cookies.remove({ url: request.url, name: request.name }, (details) => {
      sendResponse({ success: true, details });
    });
    return true;
  }

  if (request.action === 'deleteAllCookies') {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      cookies.forEach(cookie => {
        chrome.cookies.remove({ url: request.url, name: cookie.name });
      });
      sendResponse({ success: true, count: cookies.length });
    });
    return true;
  }

  if (request.action === 'fetchRSS') {
    fetch(request.url)
      .then(response => response.text())
      .then(str => {
        // Parse XML manually since DOMParser isn't fully available in SW
        // Simple regex extraction for demo purposes
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(str)) !== null) {
          const content = match[1];
          const titleMatch = content.match(/<title>(.*?)<\/title>/);
          const linkMatch = content.match(/<link>(.*?)<\/link>/);
          const descMatch = content.match(/<description>(.*?)<\/description>/);
          
          if (titleMatch && linkMatch) {
            items.push({
              title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
              link: linkMatch[1],
              description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : ''
            });
          }
        }
        sendResponse({ items: items });
      })
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});