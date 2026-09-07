import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const firebaseConfig = {
  authDomain: "haccpcava.firebaseapp.com",
  projectId: "haccpcava",
  storageBucket: "haccpcava.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
