/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'islamic-v2';
const STATIC_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'İslami Yaşam Asistanı', body: 'Günlük bilgi kartı hazır!', icon: '/favicon.ico' };
  try { data = event.data.json(); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico', vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Aç' }]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const client = clients.find(c => c.url.includes(self.location.origin));
      if (client) { client.focus(); client.navigate(url); }
      else { self.clients.openWindow(url); }
    })
  );
});

// Daily reminder via periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-knowledge') {
    event.waitUntil(
      self.registration.showNotification('Günün Bilgisi', {
        body: 'Yeni bir İslami bilgi kartı seni bekliyor!',
        icon: '/favicon.ico', badge: '/favicon.ico',
        data: { url: '/' }
      })
    );
  }
});
