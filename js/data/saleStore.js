// saleStore.js
// Camada de dados das vendas. Ao registrar, editar ou cancelar uma
// venda, o estoque e o caixa são ajustados de forma atômica.
//
// Cancelar NÃO apaga a venda: marca status "cancelled", devolve o
// estoque e estorna o valor no caixa. Editar é implementado como
// "cancelar a antiga + criar uma nova corrigida", preservando histórico.

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
    status: 'active', // default para vendas antigas, sem esse campo
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
  const saleRef = doc(collection(db, 'sales'));

  return runTransaction(db, async (transaction) => {
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
      status: 'active',
      createdAt: new Date().toISOString()
    };

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

// Cancela uma venda: devolve o estoque e estorna o valor no caixa.
// Não apaga o documento, só marca como cancelada (preserva histórico).
async function cancel(saleId, reason) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const saleRef = doc(db, 'sales', saleId);

  return runTransaction(db, async (transaction) => {
    const saleSnap = await transaction.get(saleRef);

    if (!saleSnap.exists()) {
      throw new Error('Venda não encontrada');
    }

    const sale = saleSnap.data();

    if (sale.status === 'cancelled') {
      throw new Error('Esta venda já foi cancelada');
    }

    const productRef = doc(db, 'products', sale.productId);
    const productSnap = await transaction.get(productRef);

    const reversalState = await cashStore.readReversalState(transaction, uid, 'sales', saleId);

    if (productSnap.exists()) {
      const product = productSnap.data();
      const currentStock = Number(product.quantity) || 0;
      transaction.update(productRef, {
        quantity: currentStock + Number(sale.quantity)
      });
    }

    cashStore.applyReversal(transaction, reversalState, {
      uid,
      amount: Number(sale.revenue) || 0,
      category: 'operational',
      sourceCollection: 'sales',
      sourceId: saleId,
      originalDirection: 'credit'
    });

    transaction.update(saleRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason || ''
    });
  });
}

// Edita uma venda: cancela a antiga e cria uma nova com os dados
// corrigidos. Preserva a venda original no histórico como cancelada.
async function edit(saleId, newData) {
  await cancel(saleId, 'Editada pelo usuário');
  return add(newData);
}

export const saleStore = {
  getAll,
  add,
  cancel,
  edit
};
