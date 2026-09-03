// dashboardView.js
// Tela inicial (Dashboard). Mostra o resumo do mês atual,
// a comparação com o mês anterior, e um resumo do Caixa.
// Ignora vendas canceladas em todos os cálculos.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { saleStore } from '../data/saleStore.js';
import { cashStore } from '../data/cashStore.js';
import { renderCash } from './cashView.js';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export async function renderDashboard(container) {
  container.innerHTML = `<div class="coming-soon">Carregando resumo...</div>`;

  try {
    const [products, allSales, balance] = await Promise.all([
      productStore.getAll(),
      saleStore.getAll(),
      cashStore.getBalance()
    ]);

    const sales = allSales.filter(s => s.status !== 'cancelled');

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

    const total = Number(balance.total) || 0;
    const operational = Number(balance.operational) || 0;
    const netSalaryReserved = Number(balance.netSalaryReserved) || 0;

    const operationalWarning = operational < 0
      ? `<div style="color: var(--color-danger); font-size: 0.75rem; margin-top: 4px;">⚠️ Operação negativa</div>`
      : '';

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

      <div class="card" style="margin-top: 16px; cursor: pointer;" id="dashboard-cash-card">
        <div class="card-title">💰 Caixa total</div>
        <div class="card-value positive" style="font-size: 1.5rem;">R$ ${total.toFixed(2)}</div>
        ${operationalWarning}
        <div style="margin-top: 10px; font-size: 0.85rem; color: var(--color-text-secondary);">
          💸 Disponível para retirada: <strong style="color: var(--color-text-primary);">R$ ${netSalaryReserved.toFixed(2)}</strong>
        </div>
        <div style="margin-top: 8px; font-size: 0.75rem; color: var(--color-text-secondary);">Toque para ver o Caixa completo →</div>
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

    document.getElementById('dashboard-cash-card').addEventListener('click', () => {
      renderCash(container);
    });
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
