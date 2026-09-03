// moreView.js
// Tela "Mais" — menu com funções secundárias:
// Compra, e futuramente Insights, Calculadora e Alertas.

import { renderPurchase } from './purchaseView.js';

export function renderMore(container) {
  container.innerHTML = `
    <div class="product-list">
      <div class="product-item" id="menu-purchase">
        <div class="product-item-name">📥 Registrar compra</div>
      </div>
      <div class="product-item" style="opacity: 0.5;">
        <div class="product-item-name">💡 Insights (em breve)</div>
      </div>
      <div class="product-item" style="opacity: 0.5;">
        <div class="product-item-name">🧮 Calculadora (em breve)</div>
      </div>
      <div class="product-item" style="opacity: 0.5;">
        <div class="product-item-name">🔔 Alertas (em breve)</div>
      </div>
    </div>
    <div id="more-subview" style="margin-top: 16px;"></div>
  `;

  document.getElementById('menu-purchase').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    renderPurchase(subview);
  });
}
