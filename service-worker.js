// Service worker minimo: mette in cache l'app shell così l'app si apre
// e resta utilizzabile anche senza connessione. I dati (registrazioni)
// non passano da qui: sono gestiti da Firestore stesso, che include già
// cache locale persistente e coda di sincronizzazione automatica
// (src/lib/firebase.js, src/lib/store.js, src/lib/sync-status.js).

const CACHE_NAME = 'la-cava-haccp-v3';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  '../src/styles/main.css',
  '../src/main.js',
  '../src/lib/config.js',
  '../src/lib/firebase.js',
  '../src/lib/auth.js',
  '../src/lib/store.js',
  '../src/lib/sync-status.js',
  '../src/components/anomalia-modal.js',
  '../src/screens/login/login.js',
  '../src/screens/oggi/oggi.js',
  '../src/screens/controlli/index.js',
  '../src/screens/controlli/temperature.js',
  '../src/screens/controlli/registro.js',
  '../src/screens/pulizie/pulizie.js',
  '../src/screens/anomalie/anomalie.js',
  '../src/screens/altro/altro.js',
  '../src/screens/prodotti/prodotti.js',
  '../src/screens/ricevimento/ricevimento.js',
  '../src/screens/schede-haccp/schede-haccp.js',
  '../src/screens/storico/storico.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia: rete prima (per avere sempre l'ultima versione quando c'è
// connessione), con fallback alla cache quando la rete non risponde —
// così l'app resta apribile offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
