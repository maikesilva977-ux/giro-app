// saleView.js
// Tela de registro de venda.

import { productStoreFirebase as productStore } from '../data/productStoreFirebase.js';
import { saleStore } from '../data/saleStore.js';

export async function renderSale(container) {
  container.innerHTML = `<div class="coming-soon">Carregando produtos...</div>`;

  const products = await productStore.getAll();

  if (products.length === 0) {
    container.innerHTML = `
      <div class="coming-soon">
        Você ainda não tem produtos cadastrados.<br>
        Cadastre um produto antes de registrar uma venda.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">Nova venda</h2>

      <div class="form-group">
        <label class="form-label">Produto</label>
        <select class="form-input" id="s-product">
          ${products.map(p => `
            <option value="${p.id}" data-price="${p.salePrice}" data-stock="${p.quantity}">
              ${p.name} (estoque: ${p.quantity})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Quantidade</label>
        <input class="form-input" id="s-quantity" type="number" value="1" min="1">
      </div>

      <div class="form-group">
        <label class="form-label">Preço de venda (unitário)</label>
        <input class="form-input" id="s-price" type="number" step="0.01">
      </div>

      <div class="form-group">
        <label class="form-label">Forma de pagamento</label>
        <select class="form-input" id="s-payment">
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="s-notes">
      </div>

      <div id="sale-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>
      <div id="sale-success" style="color: var(--color-success); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-save-sale">Registrar venda</button>
    </div>
  `;

  const productSelect = document.getElementById('s-product');
  const priceInput = document.getElementById('s-price');

  // Preenche o preço de venda automaticamente com o preço cadastrado do produto
  function fillDefaultPrice() {
    const selectedOption = productSelect.selectedOptions[0];
    priceInput.value = selectedOption.dataset.price;
  }
  fillDefaultPrice();
  productSelect.addEventListener('change', fillDefaultPrice);

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
      await saleStore.add({
        productId,
        quantity,
        salePrice,
        paymentMethod,
        notes
      });

      successEl.textContent = 'Venda registrada com sucesso!';
      setTimeout(() => renderSale(container), 1000);
    } catch (error) {
      errorEl.textContent = error.message || 'Erro ao registrar venda.';
    }
  });
}
