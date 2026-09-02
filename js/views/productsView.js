// productsView.js
// Lista, cadastro, edição e exclusão de produtos.

import { productStore } from '../data/productStore.js';

export function renderProducts(container) {
  const products = productStore.getAll();

  container.innerHTML = `
    <button class="btn-primary" id="btn-new-product">+ Novo produto</button>

    <div id="product-form-area"></div>

    <div class="product-list" id="product-list">
      ${products.length === 0
        ? '<div class="coming-soon">Nenhum produto cadastrado ainda.</div>'
        : products.map(renderProductItem).join('')}
    </div>
  `;

  document.getElementById('btn-new-product')
    .addEventListener('click', () => showProductForm(container));

  container.querySelectorAll('.product-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const product = productStore.getAll().find(p => p.id === id);
      showProductForm(container, product);
    });
  });
}

function renderProductItem(product) {
  return `
    <div class="product-item" data-id="${product.id}">
      <div>
        <div class="product-item-name">${product.name}</div>
        <div class="product-item-detail">Estoque: ${product.quantity}</div>
      </div>
      <div class="product-item-detail">R$ ${product.salePrice.toFixed(2)}</div>
    </div>
  `;
}

function showProductForm(container, product = null) {
  const isEditing = Boolean(product);
  const formArea = container.querySelector('#product-form-area');

  formArea.innerHTML = `
    <div class="card">
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input class="form-input" id="f-name" value="${product?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <input class="form-input" id="f-category" value="${product?.category || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Preço de compra</label>
        <input class="form-input" id="f-purchase" type="number" value="${product?.purchasePrice || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Preço de venda</label>
        <input class="form-input" id="f-sale" type="number" value="${product?.salePrice || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Quantidade em estoque</label>
        <input class="form-input" id="f-quantity" type="number" value="${product?.quantity || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Monitorar estoque?</label>
        <select class="form-input" id="f-monitor">
          <option value="false" ${!product?.monitorStock ? 'selected' : ''}>Não</option>
          <option value="true" ${product?.monitorStock ? 'selected' : ''}>Sim</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Estoque mínimo</label>
        <input class="form-input" id="f-min-stock" type="number" value="${product?.minStock || ''}">
      </div>
      <button class="btn-primary" id="btn-save-product">
        ${isEditing ? 'Salvar alterações' : 'Cadastrar produto'}
      </button>
      ${isEditing ? '<button class="btn-primary" id="btn-delete-product" style="background-color: var(--color-danger); margin-top: 8px;">Excluir produto</button>' : ''}
    </div>
  `;

  document.getElementById('btn-save-product').addEventListener('click', () => {
    const data = {
      name: document.getElementById('f-name').value,
      category: document.getElementById('f-category').value,
      purchasePrice: document.getElementById('f-purchase').value,
      salePrice: document.getElementById('f-sale').value,
      quantity: document.getElementById('f-quantity').value,
      monitorStock: document.getElementById('f-monitor').value === 'true',
      minStock: document.getElementById('f-min-stock').value
    };

    if (isEditing) {
      productStore.update(product.id, data);
    } else {
      productStore.add(data);
    }

    renderProducts(container);
  });

  if (isEditing) {
    document.getElementById('btn-delete-product').addEventListener('click', () => {
      productStore.remove(product.id);
      renderProducts(container);
    });
  }
}
