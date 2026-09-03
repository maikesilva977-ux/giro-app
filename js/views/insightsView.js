// insightsView.js
// Tela de Insights: mensagens automáticas sobre o desempenho do negócio.

import { insightStore } from '../data/insightStore.js';

export async function renderInsights(container) {
  container.innerHTML = `<div class="coming-soon">Carregando insights...</div>`;

  try {
    const insights = await insightStore.getInsights();

    container.innerHTML = `
      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">💡 Insights</div>
        ${insights.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">
              Ainda não há dados suficientes para gerar insights. Continue registrando vendas.
            </div>`
          : `<div class="product-list">
              ${insights.map(text => `
                <div class="product-item" style="align-items: flex-start;">
                  <div class="product-item-detail" style="font-size: 0.9rem; color: var(--color-text-primary);">${text}</div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar insights:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}
