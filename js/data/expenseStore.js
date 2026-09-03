// expenseStore.js
// Camada de dados das despesas operacionais (aluguel, embalagens,
// taxas, etc). Não estão ligadas a compra de produto.
// Ao registrar, debita o valor do caixa (categoria operacional).

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

function getExpensesCollectionRef() {
  return collection(db, 'expenses');
}

async function getAll() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(getExpensesCollectionRef(), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function add(expense) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const amount = Number(expense.amount) || 0;

  if (amount <= 0) {
    throw new Error('Informe um valor maior que zero');
  }
  if (!expense.description || !expense.description.trim()) {
    throw new Error('Informe uma descrição para a despesa');
  }

  const expenseRef = doc(collection(db, 'expenses'));

  return runTransaction(db, async (transaction) => {
    const cashState = await cashStore.readCashState(transaction, uid, 'expense', expenseRef.id);

    const newExpense = {
      ownerId: uid,
      description: expense.description.trim(),
      category: expense.category || 'outros',
      amount,
      date: expense.date || new Date().toISOString(),
      notes: expense.notes || '',
      createdAt: new Date().toISOString()
    };

    transaction.set(expenseRef, newExpense);

    cashStore.applyCashMovement(transaction, cashState, {
      uid,
      type: 'expense',
      direction: 'debit',
      amount,
      category: 'operational',
      sourceCollection: 'expenses',
      sourceId: expenseRef.id,
      date: newExpense.date
    });

    return { id: expenseRef.id, ...newExpense };
  });
}

export const expenseStore = {
  getAll,
  add
};
