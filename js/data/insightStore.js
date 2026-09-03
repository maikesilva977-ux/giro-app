// insightStore.js
// Gera insights automáticos a partir de vendas e produtos.
// Ignora vendas canceladas. Sempre usa linguagem cautelosa quando
// há poucos dados disponíveis.

import { productStoreFirebase as productStore } from './productStoreFirebase.js';
import { saleStore } from './saleStore.js';

const MIN_SALES_FOR_AVERAGE_COMPARISON = 3;

async function getInsights() {
  const [products, allSales] = await Promise.all([
    productStore.getAll(),
    saleStore.getAll()
  ]);

  const sales = allSales.filter(s => s.status !== 'cancelled');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const salesThisMonth = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const salesLastMonth = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const insights = [];

  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
  const revenueLastMonth = salesLastMonth.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);

  if (revenueLastMonth > 0) {
    if (revenueThisMonth > revenueLastMonth) {
      insights.push('Os dados indicam que seu faturamento aumentou em relação ao mês anterior.');
    } else if (revenueThisMonth < revenueLastMonth) {
      insights.push('Os dados indicam que seu faturamento diminuiu em relação ao mês anterior.');
    }
  }

  const byProduct = {};
  salesThisMonth.forEach(sale => {
    const id = sale.productId;
    if (!byProduct[id]) {
      byProduct[id] = { productName: sale.productName, quantity: 0, profit: 0 };
    }
    byProduct[id].quantity += Number(sale.quantity) || 0;
    byProduct[id].profit += Number(sale.profit) || 0;
  });

  const productStats = Object.values(byProduct);

  if (productStats.length >= MIN_SALES_FOR_AVERAGE_COMPARISON) {
    const avgQuantity = productStats.reduce((sum, p) => sum + p.quantity, 0) / productStats.length;
    const topSeller = [...productStats].sort((a, b) => b.quantity - a.quantity)[0];

    if (topSeller && topSeller.quantity > avgQuantity * 1.5) {
      insights.push(`Há indícios de que "${topSeller.productName}" está vendendo mais rápido que a média este mês.`);
    }
  }

  if (productStats.length > 0) {
    const topProfit = [...productStats].sort((a, b) => b.profit - a.profit)[0];
    if (topProfit && topProfit.profit > 0) {
      insights.push(`"${topProfit.productName}" foi o produto que mais gerou lucro neste mês.`);
    }
  }

  const lastSaleByProduct = {};
  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    const current = lastSaleByProduct[sale.productId];
    if (!current || saleDate > current) {
      lastSaleByProduct[sale.productId] = saleDate;
    }
  });

  products.forEach(p => {
    const createdAt = new Date(p.createdAt);
    const daysSinceCreated = (now - createdAt) / 86400000;
    if (daysSinceCreated < 15) return;

    const lastSale = lastSaleByProduct[p.id];
    const referenceDate = lastSale || createdAt;
    const days = Math.floor((now - referenceDate) / 86400000);

    if (days >= 45) {
      insights.push(`Pode valer a pena revisar o preço ou a estratégia de "${p.name}", que está parado há ${days} dias.`);
    }
  });

  return insights;
}

export const insightStore = {
  getInsights
};
