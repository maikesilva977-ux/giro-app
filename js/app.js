// app.js
// Ponto de entrada do GIRO. Controla login, qual tela está visível
// e conecta a navegação inferior às views.

import { auth } from './data/firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { renderLogin } from './views/loginView.js';
import { renderDashboard } from './views/dashboardView.js';
import { renderProducts } from './views/productsView.js';
import { renderSale } from './views/saleView.js';
import { renderMore } from './views/moreView.js';
import { renderReports } from './views/reportsView.js';

const content = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');
const bottomNav = document.querySelector('.bottom-nav');

const views = {
  dashboard: renderDashboard,
  products: renderProducts,
  sale: renderSale,
  reports: renderReports,
  more: renderMore
};

function renderComingSoon(container) {
  container.innerHTML = `<div class="coming-soon">Em breve 🚧</div>`;
}

function setActiveNav(viewName) {
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
}

function navigateTo(viewName) {
  const renderFn = views[viewName] || renderComingSoon;
  renderFn(content);
  setActiveNav(viewName);
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navigateTo(item.dataset.view);
  });
});

// Controla se mostra login ou o app
onAuthStateChanged(auth, (user) => {
  if (user) {
    bottomNav.style.display = 'flex';
    navigateTo('dashboard');
  } else {
    bottomNav.style.display = 'none';
    renderLogin(content, () => {
      // onSuccess é chamado automaticamente pelo onAuthStateChanged
    });
  }
});
