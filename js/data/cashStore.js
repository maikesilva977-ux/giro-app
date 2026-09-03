// cashStore.js
// Camada de dados do Caixa. Mantém o saldo agregado (cashBalances)
// e o histórico de movimentações (cashTransactions).
//
// IMPORTANTE: as funções aqui devem ser chamadas DENTRO de uma
// runTransaction já aberta pelo saleStore/purchaseStore, para garantir
// que tudo (venda/compra + estoque + caixa) aconteça de forma atômica.

import { db } from './firebaseConfig.js';
import { doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function getBalanceRef(uid) {
  // Um único documento de saldo por usuário, identificado pelo próprio uid
  return doc(db, 'cashBalances', uid);
}

function getTransactionRef(type, sourceId) {
  // ID determinístico: evita duplicar movimentação para a mesma origem
  return doc(db, 'cashTransactions', `${type}_${sourceId}`);
}

// Deve ser chamado logo no início da transação, junto com as outras leituras
// (getDoc do produto, etc), pois no Firestore todas as leituras de uma
// transação precisam vir antes de qualquer escrita.
async function readCashState(transaction, uid, type, sourceId) {
  const balanceRef = getBalanceRef(uid);
  const txRef = getTransactionRef(type, sourceId);

  const balanceSnap = await transaction.get(balanceRef);
  const txSnap = await transaction.get(txRef);

  return { balanceRef, txRef, balanceSnap, txSnap };
}

// Aplica a movimentação no saldo e registra a transação.
// Se já existir uma transação para essa origem (sourceId), não faz nada —
// isso é o que impede duplicidade em caso de clique duplo ou nova tentativa.
function applyCashMovement(transaction, cashState, {
  uid, type, direction, amount, category, sourceCollection, sourceId, date
}) {
  const { balanceRef, txRef, balanceSnap, txSnap } = cashState;

  if (txSnap.exists()) {
    return; // já processado antes, não duplica
  }

  const current = balanceSnap.exists() ? balanceSnap.data() : {
    total: 0,
    operational: 0,
    reinvestment: 0,
    reserve: 0,
    netSalaryReserved: 0,
    withdrawn: 0
  };

  const signedAmount = direction === 'credit' ? amount : -amount;

  const updatedBalance = {
    ownerId: uid,
    total: (Number(current.total) || 0) + signedAmount,
    operational: (Number(current.operational) || 0) + signedAmount,
    reinvestment: Number(current.reinvestment) || 0,
    reserve: Number(current.reserve) || 0,
    netSalaryReserved: Number(current.netSalaryReserved) || 0,
    withdrawn: Number(current.withdrawn) || 0,
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

export const cashStore = {
  getBalanceRef,
  getTransactionRef,
  readCashState,
  applyCashMovement
};
