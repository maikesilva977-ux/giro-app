// closingView.js
// Tela de Fechamento Mensal: calcula os números do mês, permite
// distribuir o lucro entre as gavetas do caixa, e mostra histórico.

import { closingStore } from '../data/closingStore.js';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getRecentMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return options;
}

function isMonthFinished(year, month) {
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
    return true; // mês totalmente no passado
  }
  if (year === now.getFullYear() && month === now.getMonth()) {
    return false; // mês atual, ainda em andamento
  }
  return true;
}

export async function renderClosing(container) {
  const options = getRecentMonthOptions();
  let selected = options[0]; // mês atual por padrão

  await loadAndRender(container, options, selected);
}

async function loadAndRender(container, options, selected) {
  container.innerHTML = `<div class="coming-soon">Carregando fechamento...</div>`;

  try {
    const existingClosing = await closingStore.getClosing(selected.year, selected.month);

    if (existingClosing) {
      renderClosedView(container, options, selected, existingClosing);
    } else {
      const stats = await closingStore.calculateMonthStats(selected.year, selected.month);
      const prevDate = new Date(selected.year, selected.month - 1, 1);
      const prevStats = await closingStore.calculateMonthStats(prevDate.getFullYear(), prevDate.getMonth());
      renderOpenView(container, options, selected, stats, prevStats);
    }

    renderHistorySection(container);
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar fechamento:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}

function renderMonthSelector(options, selected) {
  return `
    <div class="form-group">
      <label class="form-label">Mês</label>
      <select class="form-input" id="closing-month-select">
        ${options.map(o => `
          <option value="${o.year}-${o.month}" ${o.year === selected.year && o.month === selected.month ? 'selected' : ''}>
            ${monthNames[o.month]} ${o.year}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function attachMonthSelectorEvent(container, options) {
  const select = container.querySelector('#closing-month-select');
  if (!select) return;

  select.addEventListener('change', () => {
    const [year, month] = select.value.split('-').map(Number);
    loadAndRender(container, options, { year, month });
  });
}

function renderVariation(current, previous) {
  if (previous === 0) {
    if (current === 0) return '';
    return `<span style="color: var(--color-success); font-size: 0.8rem;"> (▲ novo)</span>`;
  }
  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const color = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
  const arrow = isPositive ? '▲' : '▼';
  return `<span style="color: ${color}; font-size: 0.8rem;"> (${arrow} ${Math.abs(change).toFixed(0)}% vs mês anterior)</span>`;
}

function renderOpenView(container, options, selected, stats, prevStats) {
  const monthFinished = isMonthFinished(selected.year, selected.month);
  const hasProfit = stats.profit > 0;

  container.innerHTML = `
    <div class="card" style="margin-bottom: 16px;">
      <h2 style="margin-bottom: 16px;">📅 Fechamento — ${monthNames[selected.month]} ${selected.year}</h2>

      ${renderMonthSelector(options, selected)}

      ${!monthFinished ? `
        <div style="color: var(--color-warning); font-size: 0.85rem; margin-bottom: 12px;">
          ⚠️ Este mês ainda não terminou. Os números podem mudar até o fim do mês.
        </div>
      ` : ''}

      <div class="product-list" style="margin-bottom: 16px;">
        <div class="product-item">
          <div class="product-item-name">Faturamento</div>
          <div class="product-item-detail">R$ ${stats.revenue.toFixed(2)}${renderVariation(stats.revenue, prevStats.revenue)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Custos</div>
          <div class="product-item-detail">R$ ${stats.cost.toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Despesas</div>
          <div class="product-item-detail">R$ ${stats.expenses.toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Lucro líquido</div>
          <div class="product-item-detail" style="color: ${hasProfit ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">
            R$ ${stats.profit.toFixed(2)}${renderVariation(stats.profit, prevStats.profit)}
          </div>
        </div>
      </div>

      ${!hasProfit ? `
        <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-bottom: 16px;">
          Não há lucro neste mês para distribuir. Você ainda pode fechar o mês para registrar o histórico.
        </div>
        <div id="closing-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
        <div id="closing-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>
        <button class="btn-primary" id="btn-close-no-distribution">Fechar o mês</button>
      ` : `
        <div style="margin-bottom: 8px; font-size: 0.9rem;">Como distribuir esse lucro?</div>

        <div class="form-group">
          <label class="form-label">🔁 Reinvestimento</label>
          <input class="form-input closing-dist-input" id="d-reinvestment" type="number" step="0.01" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">🛟 Reserva</label>
          <input class="form-input closing-dist-input" id="d-reserve" type="number" step="0.01" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">👤 Salário líquido</label>
          <input class="form-input closing-dist-input" id="d-netsalary" type="number" step="0.01" value="0">
        </div>

        <div id="closing-remaining" style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 12px;">
          Sobra em Operação: R$ ${stats.profit.toFixed(2)}
        </div>

        <div id="closing-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
        <div id="closing-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

        <button class="btn-primary" id="btn-close-with-distribution" style="margin-bottom: 8px;">Confirmar fechamento</button>
        <button class="btn-primary" id="btn-close-no-distribution" style="background-color: var(--color-surface-alt); color: var(--color-text-primary);">Fechar sem distribuir</button>
      `}
    </div>

    <div id="closing-history-area"></div>
  `;

  attachMonthSelectorEvent(container, options);

  if (hasProfit) {
    const inputs = container.querySelectorAll('.closing-dist-input');
    const remainingEl = container.querySelector('#closing-remaining');

    function updateRemaining() {
      const r = Number(document.getElementById('d-reinvestment').value) || 0;
      const res = Number(document.getElementById('d-reserve').value) || 0;
      const n = Number(document.getElementById('d-netsalary').value) || 0;
      const remaining = stats.profit - (r + res + n);
      remainingEl.textContent = `Sobra em Operação: R$ ${remaining.toFixed(2)}`;
      remainingEl.style.color = remaining < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)';
    }

    inputs.forEach(input => input.addEventListener('input', updateRemaining));

    document.getElementById('btn-close-with-distribution').addEventListener('click', async () => {
      const errorEl = document.getElementById('closing-error');
      const successEl = document.getElementById('closing-success');
      errorEl.textContent = '';
      successEl.textContent = '';

      const distribution = {
        reinvestment: document.getElementById('d-reinvestment').value,
        reserve: document.getElementById('d-reserve').value,
        netSalary: document.getElementById('d-netsalary').value
      };

      try {
        await closingStore.closeMonth({ year: selected.year, month: selected.month, distribution });
        successEl.textContent = 'Mês fechado com sucesso!';
        setTimeout(() => loadAndRender(container, options, selected), 1000);
      } catch (error) {
        errorEl.textContent = error.message;
        console.error(error);
      }
    });
  }

  document.getElementById('btn-close-no-distribution').addEventListener('click', async () => {
    const errorEl = document.getElementById('closing-error');
    const successEl = document.getElementById('closing-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    try {
      await closingStore.closeMonth({
        year: selected.year,
        month: selected.month,
        distribution: { reinvestment: 0, reserve: 0, netSalary: 0 }
      });
      successEl.textContent = 'Mês fechado com sucesso!';
      setTimeout(() => loadAndRender(container, options, selected), 1000);
    } catch (error) {
      errorEl.textContent = error.message;
      console.error(error);
    }
  });
}

function renderClosedView(container, options, selected, closing) {
  container.innerHTML = `
    <div class="card" style="margin-bottom: 16px;">
      <h2 style="margin-bottom: 16px;">📅 Fechamento — ${monthNames[selected.month]} ${selected.year}</h2>

      ${renderMonthSelector(options, selected)}

      <div style="color: var(--color-success); font-size: 0.85rem; margin-bottom: 12px;">
        ✅ Este mês já foi fechado em ${new Date(closing.closedAt).toLocaleDateString('pt-BR')}
      </div>

      <div class="product-list" style="margin-bottom: 16px;">
        <div class="product-item">
          <div class="product-item-name">Faturamento</div>
          <div class="product-item-detail">R$ ${Number(closing.revenue).toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Custos</div>
          <div class="product-item-detail">R$ ${Number(closing.cost).toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Despesas</div>
          <div class="product-item-detail">R$ ${Number(closing.expenses).toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Lucro líquido</div>
          <div class="product-item-detail" style="font-weight: 600;">R$ ${Number(closing.profit).toFixed(2)}</div>
        </div>
      </div>

      <div style="margin-bottom: 8px; font-size: 0.9rem;">Distribuição definida:</div>
      <div class="product-list">
        <div class="product-item">
          <div class="product-item-name">🔁 Reinvestimento</div>
          <div class="product-item-detail">R$ ${Number(closing.distribution?.reinvestment || 0).toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">🛟 Reserva</div>
          <div class="product-item-detail">R$ ${Number(closing.distribution?.reserve || 0).toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">👤 Salário líquido</div>
          <div class="product-item-detail">R$ ${Number(closing.distribution?.netSalary || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>

    <div id="closing-history-area"></div>
  `;

  attachMonthSelectorEvent(container, options);
}

async function renderHistorySection(container) {
  const historyArea = container.querySelector('#closing-history-area');
  if (!historyArea) return;

  try {
    const closings = await closingStore.getAllClosings();
    const sorted = closings.sort((a, b) => (b.year - a.year) || (b.month - a.month));

    historyArea.innerHTML = `
      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">Histórico de fechamentos</div>
        ${sorted.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhum mês fechado ainda.</div>`
          : `<div class="product-list">
              ${sorted.map(c => `
                <div class="product-item">
                  <div class="product-item-name">${monthNames[c.month]} ${c.year}</div>
                  <div class="product-item-detail">Lucro: R$ ${Number(c.profit).toFixed(2)}</div>
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
