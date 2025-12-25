const CACHE_NAME = 'nyilatkozat-v1';
const FILES_TO_CACHE = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
