// dashboardView.js
// Tela inicial (Dashboard). Nesta etapa, mostra apenas
// um resumo simples, já que vendas ainda não existem.

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-title">Faturamento</div>
        <div class="card-value positive">R$ 0,00</div>
      </div>
      <div class="card">
        <div class="card-title">Lucro</div>
        <div class="card-value positive">R$ 0,00</div>
      </div>
      <div class="card">
        <div class="card-title">Produtos vendidos</div>
        <div class="card-value">0</div>
      </div>
      <div class="card">
        <div class="card-title">Produtos em estoque</div>
        <div class="card-value">0</div>
      </div>
    </div>
    <div class="coming-soon">
      Gráficos, comparações e insights chegam nas próximas etapas.
    </div>
  `;
}
