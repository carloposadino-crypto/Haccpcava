// Inizializzazione Firebase, caricato dal CDN ufficiale (gstatic) — nessun
// passaggio di build, coerente con il resto del progetto. Se in futuro
// vuoi una versione più recente dell'SDK, sostituisci il numero di versione
// qui sotto con quello indicato su firebase.google.com/docs/web/setup.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);

// Persistenza offline: le letture restano disponibili senza rete e le
// scritture fatte offline vengono messe in coda dall'SDK stesso e inviate
// da sole appena torna la connessione — non serve gestirlo a mano.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
