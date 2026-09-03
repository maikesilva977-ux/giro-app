// closingStore.js
// Fechamento mensal: calcula os números do mês (faturamento, custos,
// despesas, lucro), permite distribuir o lucro entre as gavetas do
// caixa, e salva um registro permanente (nunca editado depois).

import { db, auth } from './firebaseConfig.js';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { saleStore } from './saleStore.js';
import { expenseStore } from './expenseStore.js';
import { cashStore } from './cashStore.js';

function getClosingRef(uid, year, month) {
  return doc(db, 'monthlyClosings', `${uid}_${year}-${month}`);
}

async function getClosing(year, month) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(getClosingRef(uid, year, month));
  return snap.exists() ? snap.data() : null;
}

async function getAllClosings() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(collection(db, 'monthlyClosings'), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(d => d.data());
}

async function calculateMonthStats(year, month) {
  const [sales, expenses] = await Promise.all([
    saleStore.getAll(),
    expenseStore.getAll()
  ]);

  const salesInMonth = sales.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const expensesInMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const revenue = salesInMonth.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
  const cost = salesInMonth.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const expensesTotal = expensesInMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profit = revenue - cost - expensesTotal;

  return { revenue, cost, expenses: expensesTotal, profit };
}

async function closeMonth({ year, month, distribution }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');

  const existing = await getClosing(year, month);
  if (existing) {
    throw new Error('Este mês já foi fechado.');
  }

  const stats = await calculateMonthStats(year, month);

  const reinvestment = Number(distribution?.reinvestment) || 0;
  const reserve = Number(distribution?.reserve) || 0;
  const netSalary = Number(distribution?.netSalary) || 0;
  const totalDistribution = reinvestment + reserve + netSalary;

  if (totalDistribution > 0 && stats.profit <= 0) {
    throw new Error('Não há lucro neste mês para distribuir.');
  }
  if (stats.profit > 0 && totalDistribution > stats.profit) {
    throw new Error('A distribuição não pode ultrapassar o lucro do mês.');
  }

  const closingRef = getClosingRef(uid, year, month);
  const balanceRef = cashStore.getBalanceRef(uid);

  return runTransaction(db, async (transaction) => {
    const closingSnap = await transaction.get(closingRef);
    if (closingSnap.exists()) {
      throw new Error('Este mês já foi fechado.');
    }

    const balanceSnap = await transaction.get(balanceRef);
    const current = balanceSnap.exists() ? balanceSnap.data() : {
      total: 0, operational: 0, reinvestment: 0, reserve: 0, netSalaryReserved: 0, withdrawn: 0
    };

    const currentOperational = Number(current.operational) || 0;

    if (currentOperational < totalDistribution) {
      throw new Error('Saldo insuficiente em Operação para essa distribuição.');
    }

    const updatedBalance = {
      ...current,
      ownerId: uid,
      operational: currentOperational - totalDistribution,
      reinvestment: (Number(current.reinvestment) || 0) + reinvestment,
      reserve: (Number(current.reserve) || 0) + reserve,
      netSalaryReserved: (Number(current.netSalaryReserved) || 0) + netSalary,
      updatedAt: new Date().toISOString()
    };

    transaction.set(balanceRef, updatedBalance);

    // Registra cada transferência de distribuição no histórico de movimentações
    if (reinvestment > 0) {
      const txRef = doc(db, 'cashTransactions', `closing_${uid}_${year}-${month}_reinvestment`);
      transaction.set(txRef, {
        ownerId: uid, type: 'closing', direction: 'transfer', amount: reinvestment,
        fromCategory: 'operational', toCategory: 'reinvestment',
        sourceCollection: 'monthlyClosings', sourceId: closingRef.id,
        reversed: false, date: new Date().toISOString(), createdAt: new Date().toISOString()
      });
    }
    if (reserve > 0) {
      const txRef = doc(db, 'cashTransactions', `closing_${uid}_${year}-${month}_reserve`);
      transaction.set(txRef, {
        ownerId: uid, type: 'closing', direction: 'transfer', amount: reserve,
        fromCategory: 'operational', toCategory: 'reserve',
        sourceCollection: 'monthlyClosings', sourceId: closingRef.id,
        reversed: false, date: new Date().toISOString(), createdAt: new Date().toISOString()
      });
    }
    if (netSalary > 0) {
      const txRef = doc(db, 'cashTransactions', `closing_${uid}_${year}-${month}_netSalary`);
      transaction.set(txRef, {
        ownerId: uid, type: 'closing', direction: 'transfer', amount: netSalary,
        fromCategory: 'operational', toCategory: 'netSalaryReserved',
        sourceCollection: 'monthlyClosings', sourceId: closingRef.id,
        reversed: false, date: new Date().toISOString(), createdAt: new Date().toISOString()
      });
    }

    const closingDoc = {
      ownerId: uid,
      year,
      month,
      revenue: stats.revenue,
      cost: stats.cost,
      expenses: stats.expenses,
      profit: stats.profit,
      distribution: { reinvestment, reserve, netSalary },
      cashBalanceAtClosing: {
        total: updatedBalance.total,
        operational: updatedBalance.operational,
        reinvestment: updatedBalance.reinvestment,
        reserve: updatedBalance.reserve,
        netSalaryReserved: updatedBalance.netSalaryReserved
      },
      closedAt: new Date().toISOString()
    };

    transaction.set(closingRef, closingDoc);

    return closingDoc;
  });
}

export const closingStore = {
  getClosing,
  getAllClosings,
  calculateMonthStats,
  closeMonth
};
