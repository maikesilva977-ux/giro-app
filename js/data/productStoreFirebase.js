// productStoreFirebase.js
// Camada de dados dos produtos, agora usando Firestore.
// Mantém a mesma "forma" do productStore.js (localStorage) para
// que as views não precisem ser reescritas.

import { db, auth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getCollectionRef() {
  // Cada usuário só acessa seus próprios produtos
  return collection(db, 'products');
}

async function getAll() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(getCollectionRef(), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function add(product) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const newProduct = {
    ownerId: uid,
    name: product.name,
    category: product.category || '',
    purchasePrice: Number(product.purchasePrice) || 0,
    salePrice: Number(product.salePrice) || 0,
    quantity: Number(product.quantity) || 0,
    monitorStock: Boolean(product.monitorStock),
    minStock: Number(product.minStock) || 0,
    notes: product.notes || '',
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(getCollectionRef(), newProduct);
  return { id: docRef.id, ...newProduct };
}

async function update(id, updatedFields) {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, updatedFields);
  return { id, ...updatedFields };
}

async function remove(id) {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
}

export const productStoreFirebase = {
  getAll,
  add,
  update,
  remove
};
