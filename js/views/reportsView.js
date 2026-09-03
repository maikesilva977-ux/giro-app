// reportsView.js
// Tela de Relatórios. Permite filtrar vendas por período
// e ver faturamento, custos, lucro e ticket médio.

import { saleStore } from '../data/saleStore.js';

let currentFilter = 'today';

export async function renderReports(container) {
  container.innerHTML = `<div class="coming-soon">Carregando relatório...</div>`;

  let sales;
  try {
    sales = await saleStore.getAll();
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar relatório:<br>${error.message}
      </div>
    `;
    console.error(error);
    return;
  }

  renderFilteredReport(container, sales);
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

function renderFilteredReport(container, sales) {
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

    <div class="dashboard-grid">
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
  `;

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderFilteredReport(container, sales);
    });
  });
                                     }
