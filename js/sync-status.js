// Stato di sincronizzazione: non serve una coda scritta a mano come con
// Supabase – Firestore mette da solo in coda le scritture fatte offline e
// le invia appena torna la rete. waitForPendingWrites() è la funzione
// nativa che risolve esattamente quando tutte le scritture in sospeso sono
// state confermate dal server: la usiamo per pilotare il badge 🟠/🟢.

import { db } from './firebase.js';
import { waitForPendingWrites } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const listeners = [];

export function onSyncStatusChange(callback) {
  listeners.push(callback);
}

function notifica(stato) {
  listeners.forEach(cb => cb(stato));
}

// Da chiamare dopo ogni scrittura (aggiungi/aggiorna) per aggiornare il badge.
export function segnalaScrittura() {
  notifica(navigator.onLine ? 'in_corso' : 'in_sospeso');
  waitForPendingWrites(db).then(() => notifica('sincronizzato'));
}

window.addEventListener('online', () => {
  notifica('in_corso');
  waitForPendingWrites(db).then(() => notifica('sincronizzato'));
});

window.addEventListener('offline', () => notifica('in_sospeso'));

// Stato iniziale ragionevole all'avvio dell'app.
notifica(navigator.onLine ? 'sincronizzato' : 'in_sospeso');
