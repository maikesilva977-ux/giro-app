// calculatorView.js
// Calculadora de preço de venda. Não salva nada, é só uma ferramenta
// de apoio para decidir o preço ideal de um produto.

export function renderCalculator(container) {
  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">🧮 Calculadora de preço</h2>

      <div class="form-group">
        <label class="form-label">Preço de compra</label>
        <input class="form-input" id="c-purchase" type="number" step="0.01" value="0">
      </div>

      <div class="form-group">
        <label class="form-label">Frete (opcional)</label>
        <input class="form-input" id="c-shipping" type="number" step="0.01" value="0">
      </div>

      <div class="form-group">
        <label class="form-label">Outras despesas (opcional)</label>
        <input class="form-input" id="c-expenses" type="number" step="0.01" value="0">
      </div>

      <div class="form-group">
        <label class="form-label">Margem de lucro desejada (%)</label>
        <input class="form-input" id="c-margin" type="number" step="1" value="30">
      </div>

      <button class="btn-primary" id="btn-calculate">Calcular</button>

      <div id="calc-result" style="margin-top: 16px;"></div>
    </div>
  `;

  function calculate() {
    const purchase = Number(document.getElementById('c-purchase').value) || 0;
    const shipping = Number(document.getElementById('c-shipping').value) || 0;
    const expenses = Number(document.getElementById('c-expenses').value) || 0;
    const margin = Number(document.getElementById('c-margin').value) || 0;

    const realCost = purchase + shipping + expenses;
    const minPrice = realCost;
    const recommendedPrice = realCost * (1 + margin / 100);
    const estimatedProfit = recommendedPrice - realCost;

    document.getElementById('calc-result').innerHTML = `
      <div class="product-list">
        <div class="product-item">
          <div class="product-item-name">Custo real</div>
          <div class="product-item-detail">R$ ${realCost.toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Preço mínimo</div>
          <div class="product-item-detail">R$ ${minPrice.toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Preço recomendado</div>
          <div class="product-item-detail" style="color: var(--color-success); font-weight: 600;">R$ ${recommendedPrice.toFixed(2)}</div>
        </div>
        <div class="product-item">
          <div class="product-item-name">Lucro estimado</div>
          <div class="product-item-detail" style="color: var(--color-success);">R$ ${estimatedProfit.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  document.getElementById('btn-calculate').addEventListener('click', calculate);

  // Calcula automaticamente ao abrir, com os valores padrão
  calculate();
}
