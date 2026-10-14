const products = [
  { id: 1, name: 'Galletas Magnas Lara', category: 'Abarrotes', code: '7501000134465', stock: 6, price: 15, icon: '▤', sold: 7 },
  { id: 2, name: 'Desodorante Rexona bola', category: 'Higiene', code: '7506306241001', stock: 3, price: 42, icon: '◉', sold: 3 },
  { id: 3, name: 'Tajin de 400 gr', category: 'Abarrotes', code: '7501005100123', stock: 8, price: 68, icon: '▥', sold: 1 },
  { id: 4, name: 'Takis mini', category: 'Botanas', code: '7501000362196', stock: 10, price: 15, icon: '◈', sold: 0 }
];

const navItems = {
  admin: [
    { id: 'sale', label: 'Venta', icon: '▣' },
    { id: 'products', label: 'Productos', icon: '▤' },
    { id: 'history', label: 'Historial', icon: '▧' },
    { id: 'cut', label: 'Corte', icon: '▥' }
  ],
  employee: [
    { id: 'sale', label: 'Venta', icon: '▣' },
    { id: 'inventory', label: 'Inventario', icon: '▤' }
  ]
};

const state = {
  role: null,
  screen: 'sale',
  query: '',
  cart: [],
  sales: [
    { date: '2026-10-09', count: 9, total: 435 },
    { date: '2026-10-08', count: 2, total: 120 }
  ]
};

const loginView = document.querySelector('#login-view');
const appView = document.querySelector('#app-view');
const screen = document.querySelector('#screen');
const nav = document.querySelector('#bottom-nav');
const sessionLabel = document.querySelector('#session-label');
const toastElement = document.querySelector('#toast');
const scannerDialog = document.querySelector('#scanner-dialog');
const barcodeInput = document.querySelector('#barcode-input');
let toastTimer;

function money(value) {
  return `$${value.toFixed(2)}`;
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.add('hidden'), 2400);
}

function startSession(role) {
  state.role = role;
  state.screen = 'sale';
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
  sessionLabel.textContent = role === 'admin' ? 'ADMIN · admin' : 'EMPLEADO · caja1';
  render();
}

function endSession() {
  state.role = null;
  state.screen = 'sale';
  state.cart = [];
  appView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

function renderNav() {
  nav.className = `bottom-nav ${state.role}`;
  nav.innerHTML = navItems[state.role].map((item) => `
    <button class="nav-button ${state.screen === item.id ? 'active' : ''}" data-screen="${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');
}

function productMarkup(product, showAdd = false, employeeInventory = false) {
  const stockClass = product.stock <= 3 ? 'low-stock' : '';
  const action = showAdd
    ? `<button class="small-button" data-add="${product.id}">+ Agregar</button>`
    : employeeInventory && product.stock <= 3
      ? `<button class="small-button" data-restock="${product.id}">Rellenar</button>`
      : `<small class="${stockClass}">${product.stock} unidades</small>`;

  return `
    <article class="product-row">
      <span class="product-symbol">${product.icon}</span>
      <span class="product-main">
        <strong>${product.name}</strong>
        <small>${product.category} · Código: ${product.code}</small>
      </span>
      <span class="product-trailing">
        ${showAdd ? `<strong>${money(product.price)}</strong>` : `<small class="${stockClass}">${product.stock} uds.</small>`}
        ${action}
      </span>
    </article>
  `;
}

function saleView() {
  const query = state.query.trim().toLocaleLowerCase('es');
  const filtered = products.filter((product) =>
    `${product.name} ${product.code}`.toLocaleLowerCase('es').includes(query)
  );
  const subtotal = state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cart = state.cart.length
    ? state.cart.map((item) => `
      <div class="cart-line">
        <span>
          <strong>${item.name}</strong>
          <small>${item.quantity} × ${money(item.price)}</small>
        </span>
        <span class="quantity-control">
          <button data-quantity="${item.id}" data-delta="-1" aria-label="Quitar uno">−</button>
          <b>${item.quantity}</b>
          <button data-quantity="${item.id}" data-delta="1" aria-label="Agregar uno">+</button>
        </span>
        <b>${money(item.price * item.quantity)}</b>
      </div>
    `).join('')
    : '<div class="cart-empty">Escanea o busca un producto para comenzar</div>';

  return `
    <div class="screen-heading">
      <h1>Punto de venta</h1>
      <p>Listo para cobrar</p>
      ${state.role === 'admin' ? '<span class="sync-status">Sincronización activa</span>' : ''}
    </div>
    <div class="sale-search-row">
      <label class="search-wrap">
        <input class="field" id="product-search" type="search" value="${state.query}" placeholder="Buscar producto o código" aria-label="Buscar producto o código" />
      </label>
      <button class="camera-button" type="button" data-open-scanner aria-label="Escanear producto con la cámara" title="Escanear producto">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
          <path d="M8 8h3v3H8zM14 8h2M14 11h2M8 14h2v2H8zM13 14h3v3h-3z" />
        </svg>
      </button>
    </div>
    <div class="section-row">
      <h2>Venta actual</h2>
      <span class="count">${state.cart.reduce((sum, item) => sum + item.quantity, 0)} productos</span>
    </div>
    <div class="product-list">${filtered.map((product) => productMarkup(product, true)).join('')}</div>
    <section class="cart-card">
      <div class="section-row">
        <h2>Resumen de venta</h2>
        <span class="count">${state.cart.length} artículos</span>
      </div>
      ${cart}
      <div class="totals">
        <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
        <div class="grand-total"><span>Total</span><strong>${money(subtotal)}</strong></div>
      </div>
      <button class="primary-button full-width" data-checkout ${subtotal === 0 ? 'disabled' : ''}>▣ &nbsp; Cobrar ${money(subtotal)}</button>
    </section>
  `;
}

function productsView() {
  const ranked = [...products].sort((a, b) => b.sold - a.sold);
  return `
    <div class="screen-heading">
      <h1>Productos</h1>
      <p>Administra el catálogo y registra productos con la cámara.</p>
    </div>
    <button class="primary-button full-width" data-demo-action="scan">▦ &nbsp; Escanear producto</button>
    <div class="button-row">
      <button class="outline-button" data-demo-action="manual">＋ &nbsp; Alta manual</button>
      <button class="outline-button" data-demo-action="bulk">◌ &nbsp; A granel</button>
    </div>
    <label class="search-wrap" style="margin-top: 18px">
      <input class="field" id="product-search" type="search" value="${state.query}" placeholder="Buscar producto o código" aria-label="Buscar producto o código" />
    </label>
    <section class="card">
      <h2>Productos más vendidos</h2>
      <p class="card-description">Top 10</p>
      ${ranked.slice(0, 3).map((product, index) => `
        <div class="product-row rank-row">
          <span class="rank-number">${index + 1}</span>
          <span class="product-main"><strong>${product.name}</strong></span>
          <span class="product-trailing"><small>${product.sold} uds.</small></span>
        </div>
      `).join('')}
    </section>
    <div class="section-row"><h2>Catálogo</h2><span class="count">${products.length} productos</span></div>
    <div class="product-list">${products.map((product) => productMarkup(product)).join('')}</div>
  `;
}

function inventoryView() {
  const lowStock = products.filter((product) => product.stock <= 3);
  return `
    <div class="screen-heading">
      <h1>Inventario</h1>
      <p>Consulta existencias y registra reposiciones.</p>
      <span class="sync-status">Sesión de empleado · caja1</span>
    </div>
    <div class="stat-grid">
      <div class="stat-tile"><span>Productos</span><strong>${products.length}</strong></div>
      <div class="stat-tile"><span>Por rellenar</span><strong>${lowStock.length}</strong></div>
    </div>
    <div class="section-row"><h2>Existencias</h2><span class="count">${products.length} productos</span></div>
    <div class="product-list">${products.map((product) => productMarkup(product, false, true)).join('')}</div>
    <p class="card-description">El empleado puede consultar productos y registrar reposiciones. La administración del catálogo corresponde al administrador.</p>
  `;
}

function historyView() {
  const total = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  return `
    <div class="screen-heading">
      <h1>Historial</h1>
      <p>Consulta las ventas registradas.</p>
    </div>
    <select class="field" aria-label="Periodo del historial">
      <option>Últimos 15 días</option>
      <option>Mes actual</option>
    </select>
    <p class="card-description">Total · últimos 15 días: <strong>${money(total)}</strong></p>
    <section class="card clean-card">
      <h2>Limpieza de datos</h2>
      <p class="card-description">Borra ventas de más de 30 días. Los recibos vencen a los 120 días; las ventas offline vencidas se notifican al administrador.</p>
      <button class="primary-button" data-demo-action="cleanup">▤ &nbsp; Revisar y limpiar</button>
    </section>
    ${state.sales.map((sale) => `
      <article class="history-row">
        <span class="list-symbol">▦</span>
        <span class="row-main"><strong>${sale.date}</strong><small>${sale.count} ventas</small></span>
        <span class="amount">${money(sale.total)}</span>
      </article>
    `).join('')}
  `;
}

function cutView() {
  const todayTotal = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const todayCount = state.sales.reduce((sum, sale) => sum + sale.count, 0);
  return `
    <div class="screen-heading"><h1>Corte de caja</h1><p>Resumen de ventas de hoy.</p></div>
    <div class="cut-total">
      <div class="register-icon">▤</div>
      <h2>Corte del día</h2>
      <p>${todayCount} ventas registradas hoy</p>
      <strong>${money(todayTotal)}</strong>
    </div>
    <div class="stat-grid" style="margin-top: 16px">
      <div class="stat-tile"><span>Ventas</span><strong>${todayCount}</strong></div>
      <div class="stat-tile"><span>Total vendido</span><strong>${money(todayTotal)}</strong></div>
    </div>
  `;
}

function render() {
  renderNav();
  const views = {
    sale: saleView,
    products: productsView,
    inventory: inventoryView,
    history: historyView,
    cut: cutView
  };
  screen.innerHTML = views[state.screen]();
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const current = state.cart.find((item) => item.id === id);
  if ((current?.quantity ?? 0) >= product.stock) {
    showToast('No hay más existencia disponible para este producto.');
    return;
  }
  if (current) current.quantity += 1;
  else state.cart.push({ id, name: product.name, price: product.price, quantity: 1 });
  render();
}

document.querySelectorAll('[data-login-role]').forEach((button) => {
  button.addEventListener('click', () => startSession(button.dataset.loginRole));
});

document.querySelector('#sign-out').addEventListener('click', endSession);

nav.addEventListener('click', (event) => {
  const button = event.target.closest('[data-screen]');
  if (!button) return;
  state.screen = button.dataset.screen;
  state.query = '';
  render();
  screen.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

screen.addEventListener('input', (event) => {
  if (event.target.id !== 'product-search') return;
  const position = event.target.selectionStart;
  state.query = event.target.value;
  render();
  const search = screen.querySelector('#product-search');
  search.focus();
  search.setSelectionRange(position, position);
});

screen.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-scanner]')) {
    scannerDialog.showModal();
    barcodeInput.focus();
    return;
  }

  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    addToCart(Number(addButton.dataset.add));
    return;
  }

  const quantityButton = event.target.closest('[data-quantity]');
  if (quantityButton) {
    const item = state.cart.find((line) => line.id === Number(quantityButton.dataset.quantity));
    if (item) {
      item.quantity += Number(quantityButton.dataset.delta);
      if (item.quantity <= 0) state.cart = state.cart.filter((line) => line !== item);
    }
    render();
    return;
  }

  const restockButton = event.target.closest('[data-restock]');
  if (restockButton) {
    const product = products.find((item) => item.id === Number(restockButton.dataset.restock));
    if (product) {
      product.stock += 5;
      render();
      showToast(`Reposición de ${product.name} registrada en la demo.`);
    }
    return;
  }

  if (event.target.closest('[data-checkout]')) {
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!total) return;
    const received = window.prompt(`Total ${money(total)}. Efectivo recibido:`, total.toFixed(2));
    if (received === null) return;
    const cash = Number(received.replace(',', '.'));
    if (!Number.isFinite(cash) || cash < total) {
      showToast('Ingresa un efectivo igual o mayor al total.');
      return;
    }
    state.sales.unshift({ date: new Date().toISOString().slice(0, 10), count: 1, total });
    state.cart.forEach((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.sold += item.quantity;
      }
    });
    state.cart = [];
    render();
    showToast(`Venta guardada. Cambio: ${money(cash - total)}.`);
    return;
  }

  const actionButton = event.target.closest('[data-demo-action]');
  if (actionButton) {
    const messages = {
      scan: 'El escáner de cámara es una vista de demostración.',
      manual: 'Formulario de alta manual: disponible como ejemplo visual.',
      bulk: 'Formulario de producto a granel: disponible como ejemplo visual.',
      cleanup: 'La revisión de limpieza se mostraría aquí. No se borran datos en esta demo.'
    };
    showToast(messages[actionButton.dataset.demoAction]);
  }
});

document.querySelector('[data-close-scanner]').addEventListener('click', () => {
  scannerDialog.close();
});

document.querySelector('#scanner-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const barcode = barcodeInput.value.trim();
  const product = products.find((item) => item.code === barcode);

  if (!product) {
    showToast('No encontramos ese código en el catálogo de la demo.');
    barcodeInput.focus();
    return;
  }

  scannerDialog.close();
  barcodeInput.value = '';
  addToCart(product.id);
  showToast(`${product.name} agregado a la venta.`);
});
