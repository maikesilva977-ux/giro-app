// reportsView.js
// Tela de Relatórios. Permite filtrar vendas por período
// e ver faturamento, custos, lucro, ticket médio e rankings de produtos.
// Ignora vendas canceladas em todos os cálculos.

import { saleStore } from '../data/saleStore.js';
import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';

let currentFilter = 'today';

export async function renderReports(container) {
  container.innerHTML = `<div class="coming-soon">Carregando relatório...</div>`;

  let sales, products;
  try {
    const [allSales, allProducts] = await Promise.all([
      saleStore.getAll(),
      productStore.getAll()
    ]);
    sales = allSales.filter(s => s.status !== 'cancelled');
    products = allProducts;
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar relatório:<br>${error.message}
      </div>
    `;
    console.error(error);
    return;
  }

  renderFilteredReport(container, sales, products);
}

function getDateRange(filter) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return { start: startOfToday, end: new Date(startOfToday.getTime() + 86400000) };
    case 'last7days': {
      const start = new Date(startOfToday.getTime() - 6 * 86400000);
      return { start, end: new Date(startOfToday.getTime() + 86400000) };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    default:
      return { start: startOfToday, end: new Date(startOfToday.getTime() + 86400000) };
  }
}

function filterLabel(filter) {
  const labels = {
    today: 'Hoje',
    last7days: 'Últimos 7 dias',
    thisMonth: 'Este mês',
    lastMonth: 'Mês anterior'
  };
  return labels[filter] || '';
}

function buildRankings(filteredSales, products) {
  const byProduct = {};

  filteredSales.forEach(sale => {
    const id = sale.productId;
    if (!byProduct[id]) {
      byProduct[id] = {
        productId: id,
        productName: sale.productName,
        quantity: 0,
        profit: 0
      };
    }
    byProduct[id].quantity += Number(sale.quantity) || 0;
    byProduct[id].profit += Number(sale.profit) || 0;
  });

  const productStats = Object.values(byProduct);

  const topSelling = [...productStats]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topProfit = [...productStats]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const soldProductIds = new Set(filteredSales.map(s => s.productId));
  const stalled = products
    .filter(p => !soldProductIds.has(p.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, 5);

  return { topSelling, topProfit, stalled };
}

function renderRankingList(title, emptyMessage, items, renderItem) {
  return `
    <div class="card" style="margin-bottom: 12px;">
      <div class="card-title" style="margin-bottom: 8px;">${title}</div>
      ${items.length === 0
        ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">${emptyMessage}</div>`
        : `<div class="product-list">${items.map(renderItem).join('')}</div>`
      }
    </div>
  `;
}

function renderFilteredReport(container, sales, products) {
  const { start, end } = getDateRange(currentFilter);

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= start && saleDate < end;
  });

  const revenue = filteredSales.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
  const cost = filteredSales.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const profit = filteredSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
  const numberOfSales = filteredSales.length;
  const unitsSold = filteredSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const avgTicket = numberOfSales > 0 ? revenue / numberOfSales : 0;

  const { topSelling, topProfit, stalled } = buildRankings(filteredSales, products);

  const filters = ['today', 'last7days', 'thisMonth', 'lastMonth'];

  container.innerHTML = `
    <div class="product-list" style="flex-direction: row; flex-wrap: wrap; margin-bottom: 16px;">
      ${filters.map(f => `
        <button
          class="btn-primary filter-btn"
          data-filter="${f}"
          style="width: auto; padding: 8px 14px; font-size: 0.85rem; ${
            f === currentFilter
              ? ''
              : 'background-color: var(--color-surface-alt); color: var(--color-text-primary);'
          }"
        >${filterLabel(f)}</button>
      `).join('')}
    </div>

    <div class="dashboard-grid" style="margin-bottom: 16px;">
      <div class="card">
        <div class="card-title">Faturamento</div>
        <div class="card-value positive">R$ ${revenue.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Custos</div>
        <div class="card-value">R$ ${cost.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Lucro</div>
        <div class="card-value positive">R$ ${profit.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Ticket médio</div>
        <div class="card-value">R$ ${avgTicket.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">Número de vendas</div>
        <div class="card-value">${numberOfSales}</div>
      </div>
      <div class="card">
        <div class="card-title">Produtos vendidos</div>
        <div class="card-value">${unitsSold}</div>
      </div>
    </div>

    ${renderRankingList(
      '🏆 Mais vendidos',
      'Nenhuma venda neste período.',
      topSelling,
      item => `
        <div class="product-item">
          <div class="product-item-name">${item.productName}</div>
          <div class="product-item-detail">${item.quantity} un.</div>
        </div>
      `
    )}

    ${renderRankingList(
      '💰 Mais lucrativos',
      'Nenhuma venda neste período.',
      topProfit,
      item => `
        <div class="product-item">
          <div class="product-item-name">${item.productName}</div>
          <div class="product-item-detail">R$ ${item.profit.toFixed(2)}</div>
        </div>
      `
    )}

    ${renderRankingList(
      '📦 Produtos encalhados',
      'Nenhum produto encalhado neste período.',
      stalled,
      item => `
        <div class="product-item">
          <div class="product-item-name">${item.name}</div>
          <div class="product-item-detail">Estoque: ${item.quantity}</div>
        </div>
      `
    )}
  `;

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderFilteredReport(container, sales, products);
    });
  });
}
