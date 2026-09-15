// Cache minima: solo la "cornice" statica dell'app. I moduli JS non sono
// precaricati di proposito, così ogni aggiornamento del codice arriva
// subito invece di restare bloccato su una versione vecchia in cache.
const CACHE_NAME = 'haccpcava-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
