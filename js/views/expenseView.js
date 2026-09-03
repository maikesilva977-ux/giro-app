// expenseView.js
// Tela de registro de despesas operacionais.

import { expenseStore } from '../data/expenseStore.js';

const CATEGORIES = ['aluguel', 'embalagens', 'taxas', 'transporte', 'marketing', 'outros'];

function categoryLabel(cat) {
  const labels = {
    aluguel: 'Aluguel',
    embalagens: 'Embalagens',
    taxas: 'Taxas',
    transporte: 'Transporte',
    marketing: 'Marketing',
    outros: 'Outros'
  };
  return labels[cat] || cat;
}

export function renderExpense(container) {
  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">📤 Nova despesa</h2>

      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="e-description" placeholder="Ex: Aluguel do galpão">
      </div>

      <div class="form-group">
        <label class="form-label">Valor</label>
        <input class="form-input" id="e-amount" type="number" step="0.01">
      </div>

      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-input" id="e-category">
          ${CATEGORIES.map(c => `<option value="${c}">${categoryLabel(c)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="e-notes">
      </div>

      <div id="expense-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="expense-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-save-expense">Registrar despesa</button>
    </div>

    <div id="expense-list-area" style="margin-top: 16px;"></div>
  `;

  const btn = document.getElementById('btn-save-expense');

  btn.addEventListener('click', async () => {
    const errorEl = document.getElementById('expense-error');
    const successEl = document.getElementById('expense-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    const description = document.getElementById('e-description').value;
    const amount = document.getElementById('e-amount').value;
    const category = document.getElementById('e-category').value;
    const notes = document.getElementById('e-notes').value;

    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
      await expenseStore.add({ description, amount, category, notes });
      successEl.textContent = 'Despesa registrada com sucesso!';
      setTimeout(() => renderExpense(container), 1000);
    } catch (error) {
      errorEl.textContent = error.message;
      console.error(error);
      btn.disabled = false;
      btn.textContent = 'Registrar despesa';
    }
  });

  renderRecentExpenses(container);
}

async function renderRecentExpenses(container) {
  const listArea = container.querySelector('#expense-list-area');
  if (!listArea) return;

  listArea.innerHTML = `<div class="coming-soon">Carregando despesas recentes...</div>`;

  try {
    const expenses = await expenseStore.getAll();
    const sorted = expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    listArea.innerHTML = `
      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">Despesas recentes</div>
        ${sorted.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhuma despesa registrada ainda.</div>`
          : `<div class="product-list">
              ${sorted.map(e => `
                <div class="product-item">
                  <div>
                    <div class="product-item-name">${e.description}</div>
                    <div class="product-item-detail">${categoryLabel(e.category)}</div>
                  </div>
                  <div class="product-item-detail">R$ ${Number(e.amount).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  } catch (error) {
    listArea.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar despesas:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}
