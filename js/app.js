// ===== APP.JS =====
// Basic product model (will be loaded from localStorage if exists)
const STORAGE_KEY = 'tc_produtos_v1';
const CART_KEY = 'tc_cart_v1';

let PRODUCTS = {};
let CART = [];

// Default sample products (used if localStorage empty)
const SAMPLE = {
  1: { id:1, title:'Kit Valores — Atividades', desc:'PDF com 45 páginas para trabalhar valores e convivência. Entrega digital após pagamento.', price:12, download:'kit-valores.pdf', cat:'Kits', imgs:[], slug:'kit-valores' },
  2: { id:2, title:'Alfabetiza Aventura', desc:'Jogos e fichas para alfabetização. Páginas para recortar e jogar.', price:20, download:'alfabetiza-aventura.pdf', cat:'Alfabetização', imgs:[], slug:'alfabetiza-aventura' },
  3: { id:3, title:'NR-18 — Apostila', desc:'Resumo da NR-18 em linguagem didática, fichas e exercícios.', price:8, download:'nr18-apostila.pdf', cat:'Profissional', imgs:[], slug:'nr18-apostila' }
};

function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ PRODUCTS = JSON.parse(raw); return; }catch(e){}
  }
  PRODUCTS = SAMPLE;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
}

function saveProducts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
}

function loadCart(){
  const raw = localStorage.getItem(CART_KEY);
  CART = raw ? JSON.parse(raw) : [];
  updateCartLabel();
}

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(CART)); updateCartLabel(); }

function updateCartLabel(){
  const cartBtn = document.querySelector('.main-menu .cart');
  const total = CART.reduce((s,p)=>s + (p.price * p.qty),0);
  if(cartBtn) cartBtn.innerHTML = `🛒 CARRINHO • R$${total.toFixed(2)}`;
}

// render products
function renderProducts(filter='all', q=''){
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  const items = Object.values(PRODUCTS).filter(p=>{
    const matchCat = (filter==='all') || (p.cat === filter);
    const matchQ = q.trim()==='' ? true : (p.title.toLowerCase().includes(q.toLowerCase()) || (p.desc && p.desc.toLowerCase().includes(q.toLowerCase())));
    return matchCat && matchQ;
  });

  items.forEach(p=>{
    const el = document.createElement('article');
    el.className = 'card product-card';
    el.dataset.cat = p.cat || 'Uncategorized';
    el.innerHTML = `
      <div class="thumb">${p.title.split(' ')[0]}</div>
      <div class="meta">
        <div>
          <div style="font-weight:800">${p.title}</div>
          <div class="small">${p.desc ? p.desc.substring(0,60)+'...' : ''}</div>
        </div>
        <div class="price">R$ ${p.price.toFixed(2)}</div>
      </div>
      <div class="actions">
        <button class="btn" onclick="openProduct(${p.id})">Detalhes</button>
        <button class="btn btn-primary" onclick="addToCartId(${p.id})">Comprar</button>
      </div>
    `;
    grid.appendChild(el);
  });
  populateCategoryFilter();
}

// modal functions
function openProduct(id){
  const p = PRODUCTS[id];
  document.getElementById('modal-title').textContent = p.title;
  document.getElementById('modal-desc').textContent = p.desc + ' — Preço: R$' + p.price.toFixed(2);
  // images
  const imgs = document.getElementById('modal-images');
  imgs.innerHTML = '';
  if(p.imgs && p.imgs.length){
    p.imgs.forEach(src=>{
      const img = document.createElement('img'); img.src = src; imgs.appendChild(img);
    });
  }
  // buy now button
  const buyBtn = document.getElementById('buy-now');
  buyBtn.onclick = (e)=>{ e.preventDefault(); comprarProdutoId(p.id) }
  document.getElementById('modal').style.display = 'flex';
}

function closeModal(){ document.getElementById('modal').style.display = 'none'; }

// CART functions (by id)
function addToCartId(id){
  const p = PRODUCTS[id];
  addToCart(p.title, p.price, p.download, id);
  alert(p.title + ' adicionado ao carrinho');
}
function addToCart(name, price, file, id){
  const found = CART.find(x=>x.id===id);
  if(found) found.qty++;
  else CART.push({ id, name, price, file, qty:1 });
  saveCart();
  renderCart();
}
function renderCart(){
  const box = document.getElementById('cart-box');
  if(!box) return;
  box.innerHTML = '';
  if(CART.length===0){ box.innerHTML = '<p>Seu carrinho está vazio.</p>'; return; }
  CART.forEach((p,i)=>{
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `
      <div style="flex:1">
        <strong>${p.name}</strong>
        <div>R$ ${p.price.toFixed(2)} x ${p.qty}</div>
      </div>
      <div>
        <div class="qty-control">
          <button onclick="changeQty(${i}, -1)">-</button>
          <button onclick="changeQty(${i}, 1)">+</button>
        </div>
        <button class="remove" onclick="removeItem(${i})">✖</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function changeQty(i, delta){
  CART[i].qty += delta;
  if(CART[i].qty<=0) CART.splice(i,1);
  saveCart(); renderCart();
}
function removeItem(i){ CART.splice(i,1); saveCart(); renderCart(); }
function openCart(){ document.getElementById('cart-panel').style.display='block'; renderCart(); updateCartLabel(); }
function closeCart(){ document.getElementById('cart-panel').style.display='none'; }

// checkout button triggers pagamento flow (see pagamento.js)
document.addEventListener('DOMContentLoaded', ()=>{
  loadProducts();
  loadCart();
  renderProducts();
  document.getElementById('open-cart').addEventListener('click', (e)=>{ e.preventDefault(); openCart() });
  document.getElementById('search-btn').addEventListener('click', ()=> {
    const q = document.getElementById('search-input').value;
    renderProducts(document.getElementById('category-filter').value, q);
  });
  document.getElementById('category-filter').addEventListener('change', ()=> {
    renderProducts(document.getElementById('category-filter').value, document.getElementById('search-input').value);
  });
  document.getElementById('checkout-btn').addEventListener('click', ()=> {
    if(CART.length===0){ alert('Carrinho vazio.'); return; }
    // prepare minimal order payload and call payment flow
    const order = { items: CART.map(c=>({ id:c.id, title:c.name, quantity:c.qty, unit_price:c.price })), email: '' };
    window.startCheckout(order);
  });

  // admin quick open
  document.getElementById('open-admin-panel').addEventListener('click', ()=> toggleAdmin(true));
});

// categories
function populateCategoryFilter(){
  const sel = document.getElementById('category-filter');
  const cats = new Set(Object.values(PRODUCTS).map(p=>p.cat || 'Uncategorized'));
  sel.innerHTML = '<option value="all">Todas as categorias</option>';
  cats.forEach(c=> sel.innerHTML += `<option value="${c}">${c}</option>`);
}

// slider simple (auto)
let slideIndex = 1;
setInterval(()=> {
  // simple visual effect: toggle background image if multiple slides exist
  slideIndex = (slideIndex % 3) + 1;
  const slide = document.getElementById('slide-1');
  // no multiple images included; this is a placeholder
}, 5000);

// expose some functions globally for inline onclick
window.openProduct = openProduct;
window.addToCart = addToCartId;
window.openCart = openCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
