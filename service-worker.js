// service-worker.js
// Permite que o GIRO funcione como PWA instalável.
// Cache simples do "app shell" (arquivos base), para abrir mais rápido.
// Dados do Firestore continuam sempre vindo da internet (não são cacheados aqui).

const CACHE_NAME = 'giro-cache-v1';
const APP_SHELL = [
  './index.html',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Só intercepta pedidos do próprio app (não do Firebase/Google)
  if (!event.request.url.includes(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
