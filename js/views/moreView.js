// moreView.js
// Tela "Mais" — menu com funções secundárias:
// Compra, Alertas, Insights e Calculadora.

import { renderPurchase } from './purchaseView.js';
import { renderAlerts } from './alertsView.js';
import { renderInsights } from './insightsView.js';
import { renderCalculator } from './calculatorView.js';

export function renderMore(container) {
  container.innerHTML = `
    <div class="product-list">
      <div class="product-item" id="menu-purchase">
        <div class="product-item-name">📥 Registrar compra</div>
      </div>
      <div class="product-item" id="menu-alerts">
        <div class="product-item-name">🔔 Alertas</div>
      </div>
      <div class="product-item" id="menu-insights">
        <div class="product-item-name">💡 Insights</div>
      </div>
      <div class="product-item" id="menu-calculator">
        <div class="product-item-name">🧮 Calculadora</div>
      </div>
    </div>
    <div id="more-subview" style="margin-top: 16px;"></div>
  `;

  document.getElementById('menu-purchase').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    renderPurchase(subview);
  });

  document.getElementById('menu-alerts').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    renderAlerts(subview);
  });

  document.getElementById('menu-insights').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    renderInsights(subview);
  });

  document.getElementById('menu-calculator').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    renderCalculator(subview);
  });
}
