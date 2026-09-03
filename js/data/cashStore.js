// cashStore.js
// Camada de dados do Caixa. Mantém o saldo agregado (cashBalances)
// e o histórico de movimentações (cashTransactions).
//
// As funções readCashState/applyCashMovement devem ser chamadas DENTRO
// de uma runTransaction já aberta pelo saleStore/purchaseStore.
//
// getBalance é uma leitura simples, usada só para exibir na tela.
// transfer move dinheiro entre categorias, sem alterar o total do caixa.

import { db, auth } from './firebaseConfig.js';
import {
  doc,
  getDoc,
  collection,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getBalanceRef(uid) {
  return doc(db, 'cashBalances', uid);
}

function getTransactionRef(type, sourceId) {
  return doc(db, 'cashTransactions', `${type}_${sourceId}`);
}

function emptyBalance(uid) {
  return {
    ownerId: uid,
    total: 0,
    operational: 0,
    reinvestment: 0,
    reserve: 0,
    netSalaryReserved: 0,
    withdrawn: 0,
    updatedAt: new Date().toISOString()
  };
}

async function readCashState(transaction, uid, type, sourceId) {
  const balanceRef = getBalanceRef(uid);
  const txRef = getTransactionRef(type, sourceId);

  const balanceSnap = await transaction.get(balanceRef);
  const txSnap = await transaction.get(txRef);

  return { balanceRef, txRef, balanceSnap, txSnap };
}

function applyCashMovement(transaction, cashState, {
  uid, type, direction, amount, category, sourceCollection, sourceId, date
}) {
  const { balanceRef, txRef, balanceSnap, txSnap } = cashState;

  if (txSnap.exists()) {
    return; // já processado antes, não duplica
  }

  const current = balanceSnap.exists() ? balanceSnap.data() : emptyBalance(uid);
  const signedAmount = direction === 'credit' ? amount : -amount;

  const updatedBalance = {
    ...current,
    ownerId: uid,
    total: (Number(current.total) || 0) + signedAmount,
    operational: (Number(current.operational) || 0) + signedAmount,
    updatedAt: new Date().toISOString()
  };

  transaction.set(balanceRef, updatedBalance);

  transaction.set(txRef, {
    ownerId: uid,
    type,
    direction,
    amount,
    category,
    sourceCollection,
    sourceId,
    reversed: false,
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
}

// Leitura simples do saldo, para exibir na tela (fora de transação)
async function getBalance() {
  const uid = auth.currentUser?.uid;
  if (!uid) return emptyBalance(null);

  const snap = await getDoc(getBalanceRef(uid));
  return snap.exists() ? snap.data() : emptyBalance(uid);
}

const VALID_CATEGORIES = ['operational', 'reinvestment', 'reserve', 'netSalaryReserved'];

// Move dinheiro entre categorias. Não altera o total do caixa.
async function transfer({ fromCategory, toCategory, amount, notes }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const value = Number(amount) || 0;

  if (value <= 0) {
    throw new Error('Informe um valor maior que zero');
  }
  if (!VALID_CATEGORIES.includes(fromCategory) || !VALID_CATEGORIES.includes(toCategory)) {
    throw new Error('Categoria inválida');
  }
  if (fromCategory === toCategory) {
    throw new Error('Escolha categorias diferentes para a transferência');
  }

  const balanceRef = getBalanceRef(uid);
  const transferRef = doc(collection(db, 'cashTransactions'));

  return runTransaction(db, async (transaction) => {
    const balanceSnap = await transaction.get(balanceRef);
    const current = balanceSnap.exists() ? balanceSnap.data() : emptyBalance(uid);

    const currentFromValue = Number(current[fromCategory]) || 0;

    if (currentFromValue < value) {
      throw new Error(`Saldo insuficiente em ${categoryLabel(fromCategory)}`);
    }

    const updatedBalance = {
      ...current,
      ownerId: uid,
      [fromCategory]: currentFromValue - value,
      [toCategory]: (Number(current[toCategory]) || 0) + value,
      updatedAt: new Date().toISOString()
    };

    transaction.set(balanceRef, updatedBalance);

    transaction.set(transferRef, {
      ownerId: uid,
      type: 'transfer',
      direction: 'transfer',
      amount: value,
      fromCategory,
      toCategory,
      sourceCollection: 'transfers',
      sourceId: transferRef.id,
      reversed: false,
      notes: notes || '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    return updatedBalance;
  });
}

function categoryLabel(category) {
  const labels = {
    operational: 'Operação',
    reinvestment: 'Reinvestimento',
    reserve: 'Reserva',
    netSalaryReserved: 'Salário líquido'
  };
  return labels[category] || category;
}

export const cashStore = {
  getBalanceRef,
  getTransactionRef,
  readCashState,
  applyCashMovement,
  getBalance,
  transfer,
  categoryLabel,
  VALID_CATEGORIES
};
