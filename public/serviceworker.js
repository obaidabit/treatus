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
// STEP: listen for push event, if it is a push event,
//       get the data from the event and show the notification

// STEP: When we get a notification from server we check if there is a data
//       then we convert this data to a JSON object
//       then we show the notification
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
// Listen for when a notification is clicked.
// Get all the open browser windows controlled by this service worker.
// Check if any window is already open and visible.
// If yes, open the notification url in that window and focus it.
// If no visible window found, open a new window with the notification url.
// Keep the service worker alive until the notification click is handled.

// STEP: when we click on the notificaiton we get all clients (browser tabs)
//       then we check if the notification has a url
//       if the notification don't have a url we stop (return)
//       if the notificaiton have a url then we check every client (tab)
//       if the client (tab) is visiable on the screen we open the url from the notificaiton
//       and we focus on it
//       if no client (tab) is visiable on the screen we open a new window.
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

// STEP: when the app is installing, then we go to the cache and we open the cache
//      (the cache have a name the name is in StaticCacheName)
//       after we open it, we add a list of URL to cache them.
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

//STEP : when the service worker is activated, we get all names of the caches (keys)
//       then we get all caches that have a key different from staticCacheName
//       then we delete different caches because they are old
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

// SETP: with Every Request that client make, check if it is in cache then return result from cache,
//       if not, fetch it from the web
// SETP: check if it is in pagesURLs, if yes, send message to all clients to reload page
// SETP: if request is not in cache and not in pagesURLs, return offline page

// STEP : when a request send, we check if the resutl is in the cache (caches.match),
//        after we check if the result in the cache we return it
//        if the result is not in the cash we send the request to the server (fetch(event.request))
//        when we get the result we check if the url is for a page
//        then we get all clients (browser tabs) and we send a reload message for all of them
//        if the request was not found we return offline
self.addEventListener("fetch", (event) => {
  console.log("Service worker fetching");
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      if (cacheRes) return cacheRes;
      else
        return fetch(event.request).catch((e) => {
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
        });
    })
  );
});
