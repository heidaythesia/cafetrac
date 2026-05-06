importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log(`[SW] Workbox is loaded 🎉`);

  const { backgroundSync } = workbox;
  const { registerRoute } = workbox.routing;
  const { NetworkOnly, CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;

  // 1. Background Sync for offline mutations
  const bgSyncPlugin = new backgroundSync.BackgroundSyncPlugin('cafetrack-queue', {
    maxRetentionTime: 24 * 60, // Retry for up to 24 Hours
    onSync: async ({queue}) => {
      console.log('[SW] Background sync triggered');
      await queue.replayRequests();
      // Optional: notify clients via postMessage that sync completed
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ type: 'SYNC_COMPLETED' });
      }
    }
  });

  // Apply Background Sync to all mutating API requests
  const apiMutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  apiMutationMethods.forEach((method) => {
    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/v1/'),
      new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
      method
    );
  });

  // 2. Cache API GET requests for offline read capabilities
  registerRoute(
    ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/v1/'),
    new NetworkFirst({
      cacheName: 'cafetrack-api-cache',
      networkTimeoutSeconds: 5, // Increased for mobile hotspot stability
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    })
  );

  // 3. Cache static assets (CSS, JS, Fonts)
  registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'font',
    new StaleWhileRevalidate({
      cacheName: 'cafetrack-static-resources',
    })
  );

  // 4. Cache images
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'cafetrack-images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );
} else {
  console.log(`[SW] Workbox didn't load 😬`);
}

// ---------------------------------------------
// Existing Push Notification Logic
// ---------------------------------------------
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-72.svg',
      data: { url: data.link || '/' },
      actions: [{ action: 'open', title: 'View' }]
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
