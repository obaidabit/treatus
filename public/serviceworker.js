const staticCacheName = "site-static-v0.9";

const urlsToCache = [
  "js/main.js",
  "js/navbar.js",
  "css/main.css",
  "css/report.css",
  "img/depositphotos_137014128-stock-illustration-user-profile-icon.jpg",
  "img/favicon.ico",
  "img/icon-192x192.png",
  "img/icon-512x512.png",
  "img/logo.svg",
  "img/logo_h.svg",
  "img/logo_h_light.svg",
  "img/logo_light.svg",
  "/img/background.png",
  "bootstrap/css/bootstrap.css",
  "bootstrap/js/jquery-3.6.1.min.js",
  "bootstrap/js/popper.min.js",
  "bootstrap/js/bootstrap.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css",
  "/offline",
  "/img/offline.png",
];

const pagesURLs = [
  "/patients/",
  "/doctors/",
  "/appointments/",
  "/medicines/",
  "/diseases/",
  "/potions/",
  "/potion_logs/",
];

self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      badge: "img/icon-512x512.png",
      icon: "img/icon-512x512.png",
      data: {
        url: data.url,
      },
    });
  } else {
    console.log("This push event has no data.");
  }
});

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(
    clients.matchAll().then((clientsArr) => {
      if (!event.notification.data.url) return;
      for (let i = 0; i < clientsArr.length; i++) {
        let client = clientsArr[i];
        if (client.visibilityState === "visible") {
          client.navigate(event.notification.data.url);
          return client.focus();
        }
      }

      return clients.openWindow(event.notification.data.url);
    })
  );
});

self.addEventListener("install", (event) => {
  console.log("Service worker installed");

  event.waitUntil(
    caches
      .open(staticCacheName)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch(console.error)
  );
});
self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  console.log("Service worker fetching");
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(event.request).catch((e) => {
          const match = event.request.url.match(/\/(\w+)\//);
          console.log(match);
          if (match && pagesURLs.includes(match[0])) {
            self.clients.matchAll().then(function (clients) {
              clients.forEach(function (client) {
                client.postMessage({ type: "reload" });
              });
            });
          } else {
            return caches.match("/offline");
          }
        })
      );
    })
  );
});
