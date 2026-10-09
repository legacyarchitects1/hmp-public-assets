/* Caches the app shell so the course opens fast and works on weak signal.
   Narration and videos stream from the site (they are too big to pre-cache). */
var CACHE = 'stem-v2-fa70f6686f';
var SHELL = ['./', 'index.html', 'app.css?v=fa70f6686f', 'data.js?v=fa70f6686f', 'labs.js?v=fa70f6686f', 'builds.js?v=fa70f6686f', 'app.js?v=fa70f6686f',
  'img/hero.jpg', 'img/badge.png', 'img/icon-192.png', 'img/m1.jpg', 'img/m2.jpg', 'img/m3.jpg', 'img/m4.jpg', 'img/m5.jpg', 'img/m6.jpg', 'img/m7.jpg', 'img/m8.jpg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || /\.(mp3|mp4|zip)$/.test(u.pathname)) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(function () { return caches.match('index.html'); })); return; }
  e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } return r; }); }));
});
