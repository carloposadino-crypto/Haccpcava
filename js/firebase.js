import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sostituisci con le tue credenziali Firebase se diverse
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "haccpcava.firebaseapp.com",
  projectId: "haccpcava",
  storageBucket: "haccpcava.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
};
