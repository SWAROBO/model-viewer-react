const CACHE_NAME = 'ply-model-cache-v1'; // Updated cache name for clarity
const SPLAT_FILE_EXTENSION = '.ply'; // Changed to .ply based on user feedback

self.addEventListener('install', (event) => {
    // Perform install steps - e.g., pre-caching static assets if any
    // For this task, we'll focus on runtime caching of .ply files
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
    // Clean up old caches if necessary
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of uncontrolled clients
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only cache requests for .splat files from the same origin or specific origins if needed
    // For simplicity, this example caches .splat files from any origin.
    // You might want to restrict this to your model server's origin.
    if (url.pathname.endsWith(SPLAT_FILE_EXTENSION)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.ok) {
                            // Clone the response because it's a stream and can only be consumed once.
                            const responseToCache = networkResponse.clone();
                            cache.put(event.request, responseToCache);
                        }
                        return networkResponse;
                    }).catch(error => {
                        // Optionally handle fetch errors, e.g., by returning a fallback response
                        // For now, just rethrow to let the browser handle it
                        throw error;
                    });
                });
            })
        );
    } else {
        // For non-splat files, just fetch from network (or implement other caching strategies)
        event.respondWith(fetch(event.request));
    }
});
