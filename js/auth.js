// Autenticazione e profilo utente.
// Sessione persistente: browserLocalPersistence (impostata in firebase.js)
// mantiene l'accesso sul dispositivo — non serve reinserire le credenziali
// ogni volta che si riapre l'app.

import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut as fbSignOut,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

export function getSession() {
  return new Promise((resolve) => {
    const smetti = onAuthStateChanged(auth, (user) => {
      smetti();
      resolve(user);
    });
  });
}

export async function signInWithPassword(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Il profilo (nome, ruolo) è nel documento profili/{uid} — va creato a
// mano la prima volta (vedi README), l'app non crea utenti da sola.
export async function getProfilo(uid) {
  const snap = await getDoc(doc(db, 'profili', uid));
  if (!snap.exists()) throw new Error('profilo non trovato');
  return { id: uid, ...snap.data() };
}
