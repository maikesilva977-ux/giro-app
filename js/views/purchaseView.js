// purchaseView.js
// Tela de registro de compra.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { purchaseStore } from '../data/purchaseStore.js';

export async function renderPurchase(container) {
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
        Cadastre um produto antes de registrar uma compra.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">Nova compra</h2>

      <div class="form-group">
        <label class="form-label">Produto</label>
        <select class="form-input" id="p-product">
          ${products.map(p => `
            <option value="${p.id}">
              ${p.name} (estoque atual: ${p.quantity})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Quantidade comprada</label>
        <input class="form-input" id="p-quantity" type="number" value="1" min="1">
      </div>

      <div class="form-group">
        <label class="form-label">Preço pago por unidade</label>
        <input class="form-input" id="p-unit-price" type="number" step="0.01">
      </div>

      <div class="form-group">
        <label class="form-label">Frete (opcional)</label>
        <input class="form-input" id="p-shipping" type="number" step="0.01" value="0">
      </div>

      <div class="form-group">
        <label class="form-label">Outras despesas (opcional)</label>
        <input class="form-input" id="p-other-expenses" type="number" step="0.01" value="0">
      </div>

      <div class="form-group">
        <label class="form-label">Fornecedor (opcional)</label>
        <input class="form-input" id="p-supplier">
      </div>

      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="p-notes">
      </div>

      <div id="purchase-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="purchase-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-save-purchase">Registrar compra</button>
    </div>
  `;

  document.getElementById('btn-save-purchase').addEventListener('click', async () => {
    const errorEl = document.getElementById('purchase-error');
    const successEl = document.getElementById('purchase-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    const productId = document.getElementById('p-product').value;
    const quantity = document.getElementById('p-quantity').value;
    const unitPrice = document.getElementById('p-unit-price').value;
    const shipping = document.getElementById('p-shipping').value;
    const otherExpenses = document.getElementById('p-other-expenses').value;
    const supplier = document.getElementById('p-supplier').value;
    const notes = document.getElementById('p-notes').value;

    try {
      await purchaseStore.add({
        productId,
        quantity,
        unitPrice,
        shipping,
        otherExpenses,
        supplier,
        notes
      });

      successEl.textContent = 'Compra registrada com sucesso!';
      setTimeout(() => renderPurchase(container), 1000);
    } catch (error) {
      errorEl.textContent = error.message || 'Erro ao registrar compra.';
      console.error(error);
    }
  });
}
