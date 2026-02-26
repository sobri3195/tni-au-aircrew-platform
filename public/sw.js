self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('aircrew-v1').then((cache) => cache.addAll(['/', '/index.html'])));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (event.request.method === 'GET') {
            const copy = response.clone();
            caches.open('aircrew-v1').then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
