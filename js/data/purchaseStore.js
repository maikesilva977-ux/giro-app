// purchaseStore.js
// Camada de dados das compras, usando Firestore.
// Sempre que uma compra é registrada, o estoque do produto aumenta
// e o custo médio do produto é recalculado.

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

function getPurchasesCollectionRef() {
  return collection(db, 'purchases');
}

async function getAll() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(getPurchasesCollectionRef(), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function add(purchase) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const quantity = Number(purchase.quantity) || 0;
  const unitPrice = Number(purchase.unitPrice) || 0;
  const shipping = Number(purchase.shipping) || 0;
  const otherExpenses = Number(purchase.otherExpenses) || 0;

  if (quantity <= 0) {
    throw new Error('Quantidade deve ser maior que zero');
  }

  // Custo total desta compra (incluindo frete e outras despesas)
  const totalCost = (unitPrice * quantity) + shipping + otherExpenses;
  // Custo por unidade desta compra específica (para calcular a média depois)
  const effectiveUnitCost = totalCost / quantity;

  // Busca o produto para atualizar estoque e custo médio
  const productRef = doc(db, 'products', purchase.productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    throw new Error('Produto não encontrado');
  }

  const product = productSnap.data();
  const currentStock = Number(product.quantity) || 0;
  const currentPurchasePrice = Number(product.purchasePrice) || 0;

  // Custo médio ponderado:
  // (estoque atual x custo atual + nova quantidade x custo desta compra) / novo total
  const currentTotalValue = currentStock * currentPurchasePrice;
  const newTotalValue = currentTotalValue + totalCost;
  const newStock = currentStock + quantity;
  const newAveragePurchasePrice = newStock > 0 ? newTotalValue / newStock : effectiveUnitCost;

  const newPurchase = {
    ownerId: uid,
    productId: purchase.productId,
    productName: product.name,
    quantity,
    unitPrice,
    shipping,
    otherExpenses,
    totalCost,
    supplier: purchase.supplier || '',
    date: purchase.date || new Date().toISOString(),
    notes: purchase.notes || '',
    createdAt: new Date().toISOString()
  };

  // Salva a compra
  const docRef = await addDoc(getPurchasesCollectionRef(), newPurchase);

  // Atualiza o produto: novo estoque e novo custo médio
  await updateDoc(productRef, {
    quantity: newStock,
    purchasePrice: Number(newAveragePurchasePrice.toFixed(2))
  });

  return { id: docRef.id, ...newPurchase };
}

export const purchaseStore = {
  getAll,
  add
};
