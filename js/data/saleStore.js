// saleStore.js
// Camada de dados das vendas. Ao registrar uma venda, dentro de uma
// única transação atômica: cria a venda, atualiza o estoque do produto
// e credita o valor recebido no caixa (operacional).

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

  if (quantity <= 0) {
    throw new Error('Quantidade deve ser maior que zero');
  }

  const productRef = doc(db, 'products', sale.productId);
  const saleRef = doc(collection(db, 'sales')); // gera o ID antes de entrar na transação

  return runTransaction(db, async (transaction) => {
    // --- LEITURAS (sempre antes de qualquer escrita, exigência do Firestore) ---
    const productSnap = await transaction.get(productRef);

    if (!productSnap.exists()) {
      throw new Error('Produto não encontrado');
    }

    const product = productSnap.data();
    const purchasePrice = Number(product.purchasePrice) || 0;
    const currentStock = Number(product.quantity) || 0;

    if (quantity > currentStock) {
      throw new Error('Quantidade maior que o estoque disponível');
    }

    const cashState = await cashStore.readCashState(transaction, uid, 'sale', saleRef.id);

    // --- CÁLCULOS ---
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

    // --- ESCRITAS ---
    transaction.set(saleRef, newSale);

    transaction.update(productRef, {
      quantity: currentStock - quantity
    });

    cashStore.applyCashMovement(transaction, cashState, {
      uid,
      type: 'sale',
      direction: 'credit',
      amount: revenue,
      category: 'operational',
      sourceCollection: 'sales',
      sourceId: saleRef.id,
      date: newSale.date
    });

    return { id: saleRef.id, ...newSale };
  });
}

export const saleStore = {
  getAll,
  add
};
