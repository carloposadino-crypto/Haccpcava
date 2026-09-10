import { db } from './firebase.js';
import { collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

export async function addRegistro(data) {
  return await addDoc(collection(db, 'registro'), data);
}

export async function getRegistro() {
  const querySnapshot = await getDocs(collection(db, 'registro'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addTemperatura(data) {
  return await addDoc(collection(db, 'temperature'), data);
}

export async function getTemperature() {
  const querySnapshot = await getDocs(collection(db, 'temperature'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
