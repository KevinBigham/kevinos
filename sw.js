/* KevinOS service worker — offline shell, network-first so deploys stay fresh */
var CACHE = "kevinos-v0_49";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        if (r) return r;
        if (e.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});

/* Web Push (v0.14) — show the reminder the relay sent, and open the app on tap. */
self.addEventListener("push", function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = {}; }
  var opts = {
    body: data.body || "",
    tag: data.tag || "kevinos",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: { url: data.url || "./" }
  };
  e.waitUntil(self.registration.showNotification(data.title || "KevinOS", opts));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
      var dest = new URL(url, self.registration.scope).href;
      var home = new URL("./", self.registration.scope).href;
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i];
        if (dest !== home && "navigate" in c) {
          return c.navigate(dest).then(function (nc) { return nc && nc.focus ? nc.focus() : undefined; }).catch(function () { if ("focus" in c) return c.focus(); });
        }
        if ("focus" in c) { c.focus(); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
