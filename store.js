// Helper generico per Firestore: ogni schermata usa queste poche funzioni
// invece di ripetere ovunque collection()/query()/getDocs().

import { db } from './firebase.js';
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

export { where, orderBy, limit };

export async function aggiungi(nomeCollezione, dati) {
  const ref = await addDoc(collection(db, nomeCollezione), dati);
  return ref.id;
}

export async function aggiorna(nomeCollezione, id, dati) {
  await updateDoc(doc(db, nomeCollezione, id), dati);
}

export async function leggiUno(nomeCollezione, id) {
  const snap = await getDoc(doc(db, nomeCollezione, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function leggiTutti(nomeCollezione, vincoli = []) {
  const q = query(collection(db, nomeCollezione), ...vincoli);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Converte in modo sicuro un campo data, sia che arrivi come Timestamp di
// Firestore (in lettura) sia che sia già un oggetto Date (subito dopo il
// salvataggio, prima di ricaricare dal server).
export function toData(valore) {
  if (!valore) return new Date();
  return typeof valore.toDate === 'function' ? valore.toDate() : new Date(valore);
}

export function inizioEFineGiorno(dataISO) {
  const inizio = new Date(`${dataISO}T00:00:00`);
  const fine = new Date(`${dataISO}T23:59:59.999`);
  return { inizio, fine };
}

export function oggiISO() {
  return new Date().toISOString().slice(0, 10);
}
