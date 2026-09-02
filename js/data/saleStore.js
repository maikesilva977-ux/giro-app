// saleStore.js
// Camada de dados das vendas, usando Firestore.
// Sempre que uma venda é registrada, o estoque do produto
// correspondente é reduzido automaticamente.

import { db, auth } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getSalesCollectionRef() {
  return collection(db, 'sales');
}

async function getAll() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(getSalesCollectionRef(), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function add(sale) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const quantity = Number(sale.quantity) || 0;
  const salePrice = Number(sale.salePrice) || 0;

  // Busca o produto para saber o preço de compra (custo) e o estoque atual
  const productRef = doc(db, 'products', sale.productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    throw new Error('Produto não encontrado');
  }

  const product = productSnap.data();
  const purchasePrice = Number(product.purchasePrice) || 0;
  const currentStock = Number(product.quantity) || 0;

  if (quantity > currentStock) {
    throw new Error('Quantidade maior que o estoque disponível');
  }

  const revenue = salePrice * quantity;
  const cost = purchasePrice * quantity;
  const profit = revenue - cost;

  const newSale = {
    ownerId: uid,
    productId: sale.productId,
    productName: product.name,
    quantity,
    salePrice,
    paymentMethod: sale.paymentMethod || 'outro',
    date: sale.date || new Date().toISOString(),
    notes: sale.notes || '',
    revenue,
    cost,
    profit,
    createdAt: new Date().toISOString()
  };

  // Salva a venda
  const docRef = await addDoc(getSalesCollectionRef(), newSale);

  // Atualiza o estoque do produto
  await updateDoc(productRef, {
    quantity: currentStock - quantity
  });

  return { id: docRef.id, ...newSale };
}

export const saleStore = {
  getAll,
  add
};
