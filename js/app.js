// app.js
// Ponto de entrada do GIRO. Controla qual tela está visível
// e conecta a navegação inferior às views.

import { renderDashboard } from './views/dashboardView.js';
import { renderProducts } from './views/productsView.js';

const content = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');

const views = {
  dashboard: renderDashboard,
  products: renderProducts,
  sale: renderComingSoon,
  reports: renderComingSoon,
  more: renderComingSoon
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

// Tela inicial ao carregar o app
navigateTo('dashboard');
