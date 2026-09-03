// moreView.js
// Tela "Mais" — menu com funções secundárias:
// Compra, Alertas, Insights, Calculadora e Sair.

import { auth } from '../data/firebaseConfig.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
      <div class="product-item" id="menu-logout">
        <div class="product-item-name" style="color: var(--color-danger);">🚪 Sair da conta</div>
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

  document.getElementById('menu-logout').addEventListener('click', () => {
    const subview = document.getElementById('more-subview');
    subview.innerHTML = `
      <div class="card">
        <div style="margin-bottom: 16px;">Tem certeza que deseja sair da conta?</div>
        <button class="btn-primary" id="btn-confirm-logout" style="background-color: var(--color-danger);">
          Sim, sair da conta
        </button>
      </div>
    `;

    document.getElementById('btn-confirm-logout').addEventListener('click', () => {
      signOut(auth);
    });
  });
}
