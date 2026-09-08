import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8g8CQ9z7EOfRj4CkUgscMquB7uXwIuGA",
  authDomain: "haccpcava.firebaseapp.com",
  projectId: "haccpcava",
  storageBucket: "haccpcava.firebasestorage.app",
  messagingSenderId: "569829408620",
  appId: "1:569829408620:web:d190af863d11b45644fd49"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, query, where, serverTimestamp };
