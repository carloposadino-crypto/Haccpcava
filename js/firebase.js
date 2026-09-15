import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sessione persistente sul dispositivo: non richiede il login ad ogni
// apertura dell'app (utile su un tablet/telefono condiviso in cucina).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Impossibile impostare la persistenza della sessione:', err);
});

export {
  db, auth,
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
  query, where, orderBy, serverTimestamp,
};
