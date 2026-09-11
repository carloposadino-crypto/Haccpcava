import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazioni dirette del progetto Firebase
const firebaseConfig = {
  apiKey: "INSERISCI_QUI_LA_TUA_API_KEY",
  authDomain: "haccpcava.firebaseapp.com",
  projectId: "haccpcava",
  storageBucket: "haccpcava.appspot.com",
  messagingSenderId: "INSERISCI_QUI_SENDER_ID",
  appId: "INSERISCI_QUI_APP_ID"
};

// Inizializzazione di Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esportiamo il database e le funzioni utili per le altre sezioni dell'app
export { db, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp };