// Funzioni generiche di accesso ai dati (Firestore), condivise da tutte
// le pagine dell'app. Non contengono logica di una singola sezione:
// ogni pagina passa il nome della collezione e i filtri che le servono.

import { db } from './firebase.js';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

export { where, orderBy };

// Data di oggi in formato 'YYYY-MM-DD', per raggruppare/filtrare le
// registrazioni giornaliere in modo leggibile.
export function oggiISO() {
  return new Date().toISOString().split('T')[0];
}

// Inizio (00:00:00.000) e fine (23:59:59.999) del giorno indicato,
// come oggetti Date — usati per i filtri range sui campi Timestamp
// (es. registrato_il >= inizio, registrato_il <= fine).
export function inizioEFineGiorno(dataISO) {
  const inizio = new Date(`${dataISO}T00:00:00`);
  const fine = new Date(`${dataISO}T23:59:59.999`);
  return { inizio, fine };
}

// Legge tutti i documenti di una collezione, applicando gli eventuali
// filtri/ordinamenti passati (costruiti con where()/orderBy() importati
// da questo stesso file). Ritorna un array di oggetti { id, ...dati }.
export async function leggiTutti(nomeCollezione, filtri = []) {
  const q = filtri.length ? query(collection(db, nomeCollezione), ...filtri) : collection(db, nomeCollezione);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Aggiunge un documento a una collezione. Se il documento non ha già un
// campo timestamp esplicito, aggiunge in automatico *_il come serverTimestamp
// solo se il chiamante lo richiede passando aggiungiTimestamp=true e il nome
// del campo (per rispettare i nomi diversi usati nello schema: registrato_il,
// aperto_il, creato_il...).
export async function aggiungi(nomeCollezione, dati, campoTimestamp = null) {
  const payload = { ...dati };
  if (campoTimestamp && !(campoTimestamp in payload)) {
    payload[campoTimestamp] = serverTimestamp();
  }
  return await addDoc(collection(db, nomeCollezione), payload);
}

// Aggiorna un documento esistente (es. chiudere una non conformità,
// approvare una scheda HACCP).
export async function aggiorna(nomeCollezione, id, modifiche) {
  return await updateDoc(doc(db, nomeCollezione, id), modifiche);
}

// Elimina un documento. Da usare solo dove lo schema/le regole di
// sicurezza lo permettono (non sulle registrazioni HACCP, che per norma
// non si cancellano — vedi firestore.rules).
export async function elimina(nomeCollezione, id) {
  return await deleteDoc(doc(db, nomeCollezione, id));
}
