// cashView.js
// Tela do Caixa: mostra o saldo total e as 4 categorias,
// e permite transferir dinheiro entre elas.

import { cashStore } from '../data/cashStore.js';

export async function renderCash(container) {
  container.innerHTML = `<div class="coming-soon">Carregando caixa...</div>`;

  try {
    const balance = await cashStore.getBalance();
    renderCashScreen(container, balance);
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar o caixa:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}

function renderCashScreen(container, balance) {
  const total = Number(balance.total) || 0;
  const operational = Number(balance.operational) || 0;
  const reinvestment = Number(balance.reinvestment) || 0;
  const reserve = Number(balance.reserve) || 0;
  const netSalaryReserved = Number(balance.netSalaryReserved) || 0;

  container.innerHTML = `
    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">💰 Caixa total</div>
      <div class="card-value positive" style="font-size: 1.8rem;">R$ ${total.toFixed(2)}</div>
    </div>

    <div class="dashboard-grid" style="margin-bottom: 16px;">
      <div class="card">
        <div class="card-title">🏦 Operação</div>
        <div class="card-value">R$ ${operational.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">🔁 Reinvestimento</div>
        <div class="card-value">R$ ${reinvestment.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">🛟 Reserva</div>
        <div class="card-value">R$ ${reserve.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-title">👤 Salário líquido</div>
        <div class="card-value">R$ ${netSalaryReserved.toFixed(2)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom: 12px;">Transferir entre categorias</div>

      <div class="form-group">
        <label class="form-label">De</label>
        <select class="form-input" id="t-from">
          <option value="operational">🏦 Operação</option>
          <option value="reinvestment">🔁 Reinvestimento</option>
          <option value="reserve">🛟 Reserva</option>
          <option value="netSalaryReserved">👤 Salário líquido</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Para</label>
        <select class="form-input" id="t-to">
          <option value="reinvestment">🔁 Reinvestimento</option>
          <option value="reserve">🛟 Reserva</option>
          <option value="netSalaryReserved">👤 Salário líquido</option>
          <option value="operational">🏦 Operação</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Valor</label>
        <input class="form-input" id="t-amount" type="number" step="0.01">
      </div>

      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="t-notes">
      </div>

      <div id="transfer-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="transfer-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-transfer">Transferir</button>
    </div>
  `;

  const btn = document.getElementById('btn-transfer');

  btn.addEventListener('click', async () => {
    const errorEl = document.getElementById('transfer-error');
    const successEl = document.getElementById('transfer-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    const fromCategory = document.getElementById('t-from').value;
    const toCategory = document.getElementById('t-to').value;
    const amount = document.getElementById('t-amount').value;
    const notes = document.getElementById('t-notes').value;

    btn.disabled = true;
    btn.textContent = 'Transferindo...';

    try {
      await cashStore.transfer({ fromCategory, toCategory, amount, notes });
      successEl.textContent = 'Transferência realizada com sucesso!';
      setTimeout(() => renderCash(container), 1000);
    } catch (error) {
      errorEl.textContent = error.message;
      console.error(error);
      btn.disabled = false;
      btn.textContent = 'Transferir';
    }
  });
}
