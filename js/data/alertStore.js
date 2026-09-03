// alertStore.js
// Calcula os alertas do GIRO a partir dos produtos e vendas existentes.
// Não salva nada no Firestore — os alertas são sempre recalculados
// na hora, a partir dos dados atuais.

import { productStoreFirebase as productStore } from './productStoreFirebase.js';
import { saleStore } from './saleStore.js';

const STALLED_DAYS_THRESHOLD = 30;
const MIN_DAYS_TO_CONSIDER = 15; // evita alarmar produtos recém-cadastrados

async function getAlerts() {
  const [products, sales] = await Promise.all([
    productStore.getAll(),
    saleStore.getAll()
  ]);

  const now = new Date();

  // Data da última venda de cada produto
  const lastSaleByProduct = {};
  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    const current = lastSaleByProduct[sale.productId];
    if (!current || saleDate > current) {
      lastSaleByProduct[sale.productId] = saleDate;
    }
  });

  const lowStockAlerts = products
    .filter(p => p.monitorStock && Number(p.quantity) <= Number(p.minStock))
    .map(p => ({
      type: 'lowStock',
      productName: p.name,
      message: `Estoque atual: ${p.quantity} (mínimo: ${p.minStock})`
    }));

  const stalledAlerts = products
    .filter(p => {
      const createdAt = new Date(p.createdAt);
      const daysSinceCreated = (now - createdAt) / 86400000;

      // Só considera produtos cadastrados há tempo suficiente
      if (daysSinceCreated < MIN_DAYS_TO_CONSIDER) return false;

      const lastSale = lastSaleByProduct[p.id];
      const referenceDate = lastSale || createdAt;
      const daysSinceLastMovement = (now - referenceDate) / 86400000;

      return daysSinceLastMovement >= STALLED_DAYS_THRESHOLD;
    })
    .map(p => {
      const createdAt = new Date(p.createdAt);
      const lastSale = lastSaleByProduct[p.id];
      const referenceDate = lastSale || createdAt;
      const days = Math.floor((now - referenceDate) / 86400000);

      return {
        type: 'stalled',
        productName: p.name,
        message: `Sem vendas há ${days} dias`
      };
    });

  return { lowStockAlerts, stalledAlerts };
}

export const alertStore = {
  getAlerts
};
