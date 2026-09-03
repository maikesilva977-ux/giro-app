// cashView.js
// Tela do Caixa: mostra o saldo total, as 4 categorias, o valor
// disponível para retirada, permite transferir entre categorias,
// retirar de fato, e ver o histórico de retiradas.

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

  const operationalWarning = operational < 0
    ? `<div style="color: var(--color-danger); font-size: 0.8rem; margin-top: 6px;">⚠️ Operação está negativa</div>`
    : (operational < 100 && operational >= 0
      ? `<div style="color: var(--color-warning); font-size: 0.8rem; margin-top: 6px;">⚠️ Caixa operacional baixo</div>`
      : '');

  container.innerHTML = `
    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">💰 Caixa total</div>
      <div class="card-value positive" style="font-size: 1.8rem;">R$ ${total.toFixed(2)}</div>
      ${operationalWarning}
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

    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">💸 Disponível para retirada</div>
      <div class="card-value positive">R$ ${netSalaryReserved.toFixed(2)}</div>
      ${netSalaryReserved > 0 ? `
        <button class="btn-primary" id="btn-open-withdraw" style="margin-top: 12px;">Retirar</button>
        <div id="withdraw-form-area" style="margin-top: 12px;"></div>
      ` : `
        <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-top: 8px;">
          Nenhum valor reservado para retirada no momento.
        </div>
      `}
    </div>

    <div class="card" style="margin-bottom: 16px;">
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

    <div id="withdrawal-history-area"></div>
  `;

  attachTransferHandler(container, balance);
  attachWithdrawHandler(container, balance);
  renderWithdrawalHistory(container);
}

function attachTransferHandler(container, balance) {
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

function attachWithdrawHandler(container) {
  const openBtn = document.getElementById('btn-open-withdraw');
  if (!openBtn) return;

  openBtn.addEventListener('click', () => {
    const formArea = document.getElementById('withdraw-form-area');
    formArea.innerHTML = `
      <div class="form-group">
        <label class="form-label">Valor a retirar</label>
        <input class="form-input" id="w-amount" type="number" step="0.01">
      </div>
      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="w-notes">
      </div>
      <div id="withdraw-confirm-area"></div>
      <div id="withdraw-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="withdraw-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <button class="btn-primary" id="btn-confirm-withdraw-step1">Retirar</button>
    `;

    document.getElementById('btn-confirm-withdraw-step1').addEventListener('click', () => {
      const amount = Number(document.getElementById('w-amount').value) || 0;
      const errorEl = document.getElementById('withdraw-error');
      errorEl.textContent = '';

      if (amount <= 0) {
        errorEl.textContent = 'Informe um valor maior que zero';
        return;
      }

      const confirmArea = document.getElementById('withdraw-confirm-area');
      confirmArea.innerHTML = `
        <div class="card" style="background-color: var(--color-surface-alt); margin-bottom: 12px;">
          <div style="margin-bottom: 12px;">
            Tem certeza que deseja retirar <strong>R$ ${amount.toFixed(2)}</strong>?
            Isso vai reduzir o caixa total do negócio de forma definitiva.
          </div>
          <button class="btn-primary" id="btn-confirm-withdraw-final" style="background-color: var(--color-danger);">
            Sim, confirmar retirada
          </button>
        </div>
      `;

      document.getElementById('btn-confirm-withdraw-final').addEventListener('click', async () => {
        const notes = document.getElementById('w-notes').value;
        const successEl = document.getElementById('withdraw-success');
        const btn = document.getElementById('btn-confirm-withdraw-final');
        btn.disabled = true;
        btn.textContent = 'Processando...';

        try {
          await cashStore.withdraw({ amount, notes });
          successEl.textContent = 'Retirada realizada com sucesso!';
          setTimeout(() => renderCash(container), 1000);
        } catch (error) {
          errorEl.textContent = error.message;
          console.error(error);
          btn.disabled = false;
          btn.textContent = 'Sim, confirmar retirada';
        }
      });
    });
  });
}

async function renderWithdrawalHistory(container) {
  const historyArea = container.querySelector('#withdrawal-history-area');
  if (!historyArea) return;

  try {
    const withdrawals = await cashStore.getWithdrawalHistory();
    const sorted = withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    historyArea.innerHTML = `
      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">Histórico de retiradas</div>
        ${sorted.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhuma retirada realizada ainda.</div>`
          : `<div class="product-list">
              ${sorted.map(w => `
                <div class="product-item">
                  <div>
                    <div class="product-item-name">R$ ${Number(w.amount).toFixed(2)}</div>
                    <div class="product-item-detail">${new Date(w.date).toLocaleDateString('pt-BR')}${w.notes ? ' · ' + w.notes : ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  } catch (error) {
    historyArea.innerHTML = '';
    console.error(error);
  }
}
