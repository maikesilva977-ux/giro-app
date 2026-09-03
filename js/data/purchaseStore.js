// purchaseStore.js
// Camada de dados das compras. Ao registrar uma compra, dentro de uma
// única transação atômica: cria a compra, atualiza estoque/custo médio
// do produto e debita o valor total do caixa (operacional).

import { db, auth } from './firebaseConfig.js';
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cashStore } from './cashStore.js';

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

  const totalCost = (unitPrice * quantity) + shipping + otherExpenses;

  const productRef = doc(db, 'products', purchase.productId);
  const purchaseRef = doc(collection(db, 'purchases'));

  return runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);

    if (!productSnap.exists()) {
      throw new Error('Produto não encontrado');
    }

    const product = productSnap.data();
    const currentStock = Number(product.quantity) || 0;
    const currentPurchasePrice = Number(product.purchasePrice) || 0;

    const cashState = await cashStore.readCashState(transaction, uid, 'purchase', purchaseRef.id);

    const currentTotalValue = currentStock * currentPurchasePrice;
    const newTotalValue = currentTotalValue + totalCost;
    const newStock = currentStock + quantity;
    const newAveragePurchasePrice = newStock > 0
      ? newTotalValue / newStock
      : (quantity > 0 ? totalCost / quantity : 0);

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

    transaction.set(purchaseRef, newPurchase);

    transaction.update(productRef, {
      quantity: newStock,
      purchasePrice: Number(newAveragePurchasePrice.toFixed(2))
    });

    cashStore.applyCashMovement(transaction, cashState, {
      uid,
      type: 'purchase',
      direction: 'debit',
      amount: totalCost,
      category: 'operational',
      sourceCollection: 'purchases',
      sourceId: purchaseRef.id,
      date: newPurchase.date
    });

    return { id: purchaseRef.id, ...newPurchase };
  });
}

export const purchaseStore = {
  getAll,
  add
};
