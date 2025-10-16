// Service Worker para precarga de rutas
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Rutas principales a precachear
const PRECACHE_ROUTES = [
  '/dashboard',
  '/produccion',
  '/mantenimiento',
  '/incidentes',
  '/observaciones',
  '/configuracion/usuarios',
  '/configuraciones-maestras'
];

// Precachear rutas principales
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    if (PRECACHE_ROUTES.includes(url.pathname)) {
      event.respondWith(
        caches.match(event.request).then(response => {
          return response || fetch(event.request);
        })
      );
    }
  }
});