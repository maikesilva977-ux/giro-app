// alertStore.js
// Calcula os alertas do GIRO a partir dos produtos e vendas existentes.
// Ignora vendas canceladas.

import { productStoreFirebase as productStore } from './productStoreFirebase.js';
import { saleStore } from './saleStore.js';

const STALLED_DAYS_THRESHOLD = 30;
const MIN_DAYS_TO_CONSIDER = 15;

async function getAlerts() {
  const [products, allSales] = await Promise.all([
    productStore.getAll(),
    saleStore.getAll()
  ]);

  const sales = allSales.filter(s => s.status !== 'cancelled');
  const now = new Date();

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
