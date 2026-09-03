// saleView.js
// Tela de registro de venda. Também lista vendas recentes,
// permitindo editar ou cancelar.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { saleStore } from '../data/saleStore.js';

export async function renderSale(container) {
  container.innerHTML = `<div class="coming-soon">Carregando produtos...</div>`;

  let products;
  try {
    products = await productStore.getAll();
  } catch (error) {
    container.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar produtos:<br>${error.message}
      </div>
    `;
    console.error(error);
    return;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="coming-soon">
        Você ainda não tem produtos cadastrados.<br>
        Cadastre um produto antes de registrar uma venda.
      </div>
    `;
    return;
  }

  renderSaleForm(container, products, null);
}

function renderSaleForm(container, products, editingSale) {
  const isEditing = Boolean(editingSale);

  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">${isEditing ? 'Editar venda' : 'Nova venda'}</h2>

      <div class="form-group">
        <label class="form-label">Produto</label>
        <select class="form-input" id="s-product" ${isEditing ? 'disabled' : ''}>
          ${products.map(p => `
            <option value="${p.id}" data-price="${p.salePrice}"
              ${editingSale && editingSale.productId === p.id ? 'selected' : ''}>
              ${p.name} (estoque: ${p.quantity})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Quantidade</label>
        <input class="form-input" id="s-quantity" type="number" min="1"
          value="${editingSale ? editingSale.quantity : 1}">
      </div>

      <div class="form-group">
        <label class="form-label">Preço de venda (unitário)</label>
        <input class="form-input" id="s-price" type="number" step="0.01"
          value="${editingSale ? editingSale.salePrice : ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Forma de pagamento</label>
        <select class="form-input" id="s-payment">
          <option value="pix" ${editingSale?.paymentMethod === 'pix' ? 'selected' : ''}>Pix</option>
          <option value="dinheiro" ${editingSale?.paymentMethod === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
          <option value="cartao" ${editingSale?.paymentMethod === 'cartao' ? 'selected' : ''}>Cartão</option>
          <option value="outro" ${editingSale?.paymentMethod === 'outro' ? 'selected' : ''}>Outro</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="s-notes" value="${editingSale?.notes || ''}">
      </div>

      <div id="sale-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="sale-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-save-sale">${isEditing ? 'Salvar alterações' : 'Registrar venda'}</button>
      ${isEditing ? `<button class="btn-primary" id="btn-cancel-edit" style="background-color: var(--color-surface-alt); color: var(--color-text-primary); margin-top: 8px;">Cancelar edição</button>` : ''}
    </div>

    <div id="sale-list-area" style="margin-top: 16px;"></div>
  `;

  const productSelect = document.getElementById('s-product');
  const priceInput = document.getElementById('s-price');

  if (!isEditing) {
    function fillDefaultPrice() {
      const selectedOption = productSelect.selectedOptions[0];
      priceInput.value = selectedOption.dataset.price;
    }
    fillDefaultPrice();
    productSelect.addEventListener('change', fillDefaultPrice);
  }

  document.getElementById('btn-save-sale').addEventListener('click', async () => {
    const errorEl = document.getElementById('sale-error');
    const successEl = document.getElementById('sale-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    const productId = productSelect.value;
    const quantity = document.getElementById('s-quantity').value;
    const salePrice = priceInput.value;
    const paymentMethod = document.getElementById('s-payment').value;
    const notes = document.getElementById('s-notes').value;

    try {
      if (isEditing) {
        await saleStore.edit(editingSale.id, {
          productId, quantity, salePrice, paymentMethod, notes
        });
        successEl.textContent = 'Venda atualizada com sucesso!';
      } else {
        await saleStore.add({ productId, quantity, salePrice, paymentMethod, notes });
        successEl.textContent = 'Venda registrada com sucesso!';
      }
      setTimeout(() => renderSale(container), 1000);
    } catch (error) {
      errorEl.textContent = error.message || 'Erro ao registrar venda.';
      console.error(error);
    }
  });

  if (isEditing) {
    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
      renderSale(container);
    });
  }

  renderRecentSales(container, products);
}

async function renderRecentSales(container, products) {
  const listArea = container.querySelector('#sale-list-area');
  if (!listArea) return;

  listArea.innerHTML = `<div class="coming-soon">Carregando vendas recentes...</div>`;

  try {
    const sales = await saleStore.getAll();
    const activeSales = sales
      .filter(s => s.status !== 'cancelled')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    const cancelledCount = sales.filter(s => s.status === 'cancelled').length;

    listArea.innerHTML = `
      <div class="card">
        <div class="card-title" style="margin-bottom: 8px;">Vendas recentes</div>
        ${activeSales.length === 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.85rem;">Nenhuma venda registrada ainda.</div>`
          : `<div class="product-list">
              ${activeSales.map(s => `
                <div class="product-item sale-item" data-id="${s.id}" style="cursor: pointer;">
                  <div>
                    <div class="product-item-name">${s.productName}</div>
                    <div class="product-item-detail">${s.quantity} un. · ${new Date(s.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div class="product-item-detail">R$ ${Number(s.revenue).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>`
        }
        ${cancelledCount > 0
          ? `<div style="color: var(--color-text-secondary); font-size: 0.8rem; margin-top: 8px;">${cancelledCount} venda(s) cancelada(s) não exibida(s) aqui.</div>`
          : ''
        }
      </div>
      <div id="sale-action-area" style="margin-top: 12px;"></div>
    `;

    listArea.querySelectorAll('.sale-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const sale = activeSales.find(s => s.id === id);
        showSaleActions(container, listArea, sale, products);
      });
    });
  } catch (error) {
    listArea.innerHTML = `
      <div class="coming-soon" style="color: var(--color-danger);">
        Erro ao carregar vendas:<br>${error.message}
      </div>
    `;
    console.error(error);
  }
}

function showSaleActions(container, listArea, sale, products) {
  const actionArea = listArea.querySelector('#sale-action-area');

  actionArea.innerHTML = `
    <div class="card">
      <div style="margin-bottom: 12px;">${sale.productName} — R$ ${Number(sale.revenue).toFixed(2)}</div>
      <button class="btn-primary" id="btn-edit-sale" style="margin-bottom: 8px;">Editar venda</button>
      <button class="btn-primary" id="btn-delete-sale" style="background-color: var(--color-danger);">Excluir venda</button>
    </div>
  `;

  document.getElementById('btn-edit-sale').addEventListener('click', () => {
    renderSaleForm(container, products, sale);
  });

  document.getElementById('btn-delete-sale').addEventListener('click', () => {
    actionArea.innerHTML = `
      <div class="card" style="background-color: var(--color-surface-alt);">
        <div style="margin-bottom: 12px;">
          Tem certeza que deseja excluir esta venda? O estoque será devolvido e o valor será
          estornado do caixa.
        </div>
        <div id="delete-sale-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
        <button class="btn-primary" id="btn-confirm-delete-sale" style="background-color: var(--color-danger);">
          Sim, excluir venda
        </button>
      </div>
    `;

    document.getElementById('btn-confirm-delete-sale').addEventListener('click', async () => {
      const errorEl = document.getElementById('delete-sale-error');
      try {
        await saleStore.cancel(sale.id, 'Excluída pelo usuário');
        renderSale(container);
      } catch (error) {
        errorEl.textContent = error.message;
        console.error(error);
      }
    });
  });
}
