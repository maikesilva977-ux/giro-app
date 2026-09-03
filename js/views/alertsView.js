// alertsView.js
// Central de Alertas: estoque baixo e produtos parados.

import { alertStore } from '../data/alertStore.js';

export async function renderAlerts(container) {
  container.innerHTML = `<div class="coming-soon">Carregando alertas...</div>`;

  try {
    const { lowStockAlerts, stalledAlerts } = await alertStore.getAlerts();

    container.innerHTML = `
      <div class="card" style="margin-bottom: 12px;">
        <div class="card-title" style="margin-bottom: 8px;">⚠️ Estoque baixo</div>
        ${lowStockAlerts.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhum alerta de estoque no momento.</div>`
          : `<div class="product-list">
              ${lowStockAlerts.map(alert => `
                <div class="product-item">
                  <div class="product-item-name">${alert.productName}</div>
                  <div class="product-item-detail" style="color: var(--color-warning);">${alert.message}</div>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">🐌 Produtos parados</div>
        ${stalledAlerts.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhum produto parado no momento.</div>`
          : `<div class="product-list">
              ${stalledAlerts.map(alert => `
                <div class="product-item">
                  <div class="product-item-name">${alert.productName}</div>
                  <div class="product-item-detail">${alert.message}</div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar alertas:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}
