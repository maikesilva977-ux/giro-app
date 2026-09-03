// dashboardView.js
// Tela inicial (Dashboard). Mostra o resumo do mês atual
// e a comparação com o mês anterior.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { saleStore } from '../data/saleStore.js';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export async function renderDashboard(container) {
  container.innerHTML = `<div class="coming-soon">Carregando resumo...</div>`;

  try {
    const [products, sales] = await Promise.all([
      productStore.getAll(),
      saleStore.getAll()
    ]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const currentStats = calculateMonthStats(sales, currentMonth, currentYear);
    const lastStats = calculateMonthStats(sales, lastMonth, lastMonthYear);

    const stockCount = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

    container.innerHTML = `
      <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-bottom: 8px;">
        ${monthLabel.toUpperCase()}
      </div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-title">Faturamento</div>
          <div class="card-value positive">R$ ${currentStats.revenue.toFixed(2)}</div>
          ${renderVariation(currentStats.revenue, lastStats.revenue)}
        </div>
        <div class="card">
          <div class="card-title">Lucro</div>
          <div class="card-value positive">R$ ${currentStats.profit.toFixed(2)}</div>
          ${renderVariation(currentStats.profit, lastStats.profit)}
        </div>
        <div class="card">
          <div class="card-title">Produtos vendidos</div>
          <div class="card-value">${currentStats.unitsSold}</div>
          ${renderVariation(currentStats.unitsSold, lastStats.unitsSold)}
        </div>
        <div class="card">
          <div class="card-title">Produtos em estoque</div>
          <div class="card-value">${stockCount}</div>
        </div>
      </div>

      <div class="card" style="margin-top: 16px;">
        <div class="card-title" style="margin-bottom: 12px;">Comparação com ${monthNames[lastMonth]}</div>
        <div class="product-list">
          <div class="product-item">
            <div class="product-item-name">Faturamento</div>
            <div class="product-item-detail">R$ ${lastStats.revenue.toFixed(2)} → R$ ${currentStats.revenue.toFixed(2)}</div>
          </div>
          <div class="product-item">
            <div class="product-item-name">Lucro</div>
            <div class="product-item-detail">R$ ${lastStats.profit.toFixed(2)} → R$ ${currentStats.profit.toFixed(2)}</div>
          </div>
          <div class="product-item">
            <div class="product-item-name">Vendas</div>
            <div class="product-item-detail">${lastStats.numberOfSales} → ${currentStats.numberOfSales}</div>
          </div>
        </div>
      </div>

      <div class="coming-soon">
        Gráficos e insights chegam nas próximas etapas.
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar o dashboard:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}

function calculateMonthStats(sales, month, year) {
  const filtered = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getMonth() === month && saleDate.getFullYear() === year;
  });

  return {
    revenue: filtered.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0),
    profit: filtered.reduce((sum, s) => sum + (Number(s.profit) || 0), 0),
    unitsSold: filtered.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0),
    numberOfSales: filtered.length
  };
}

function renderVariation(current, previous) {
  if (previous === 0) {
    if (current === 0) return '';
    return `<div style="font-size: 0.75rem; color: var(--color-success); margin-top: 4px;">▲ novo</div>`;
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const color = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
  const arrow = isPositive ? '▲' : '▼';

  return `<div style="font-size: 0.75rem; color: ${color}; margin-top: 4px;">${arrow} ${Math.abs(change).toFixed(0)}% vs mês anterior</div>`;
}
