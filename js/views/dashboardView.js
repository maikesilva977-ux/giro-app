// dashboardView.js
// Tela inicial (Dashboard). Mostra o resumo do mês atual,
// calculado a partir das vendas e produtos reais.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { saleStore } from '../data/saleStore.js';

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

    const salesThisMonth = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    const revenue = salesThisMonth.reduce((sum, sale) => sum + (Number(sale.revenue) || 0), 0);
    const profit = salesThisMonth.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);
    const unitsSold = salesThisMonth.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);
    const stockCount = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

    container.innerHTML = `
      <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-bottom: 8px;">
        ${monthLabel.toUpperCase()}
      </div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-title">Faturamento</div>
          <div class="card-value positive">R$ ${revenue.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-title">Lucro</div>
          <div class="card-value positive">R$ ${profit.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-title">Produtos vendidos</div>
          <div class="card-value">${unitsSold}</div>
        </div>
        <div class="card">
          <div class="card-title">Produtos em estoque</div>
          <div class="card-value">${stockCount}</div>
        </div>
      </div>
      <div class="coming-soon">
        Gráficos, comparações e insights chegam nas próximas etapas.
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
