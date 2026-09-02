// productStore.js
// Camada de dados dos produtos.
// Nesta etapa, os dados ficam salvos no localStorage do navegador.
// Na Etapa 2, este arquivo será substituído pela versão com Firebase,
// sem precisar alterar as views que o utilizam.

const STORAGE_KEY = 'giro_products';

function getAll() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAll(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function add(product) {
  const products = getAll();
  const newProduct = {
    id: Date.now().toString(),
    name: product.name,
    category: product.category || '',
    purchasePrice: Number(product.purchasePrice) || 0,
    salePrice: Number(product.salePrice) || 0,
    quantity: Number(product.quantity) || 0,
    monitorStock: Boolean(product.monitorStock),
    minStock: Number(product.minStock) || 0,
    notes: product.notes || '',
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  saveAll(products);
  return newProduct;
}

function update(id, updatedFields) {
  const products = getAll();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updatedFields };
  saveAll(products);
  return products[index];
}

function remove(id) {
  const products = getAll().filter(p => p.id !== id);
  saveAll(products);
}

export const productStore = {
  getAll,
  add,
  update,
  remove
};
