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
    try{ PRODUCTS = JSON.parse(raw); return; }catch(e){ console.warn('Erro parse produtos, usando amostra', e); }
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

function getCartTotal(){
  return CART.reduce((s,p)=>s + (p.price * p.qty),0);
}

function updateCartLabel(){
  // Atualiza o botão do menu (link com id open-cart)
  const cartBtn = document.getElementById('open-cart');
  const total = getCartTotal();
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
      <div class="thumb">${(p.imgs && p.imgs[0]) ? `<img src="${p.imgs[0]}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : p.title.split(' ')[0]}</div>
      <div class="meta">
        <div>
          <div style="font-weight:800">${p.title}</div>
          <div class="small">${p.desc ? (p.desc.length>60 ? p.desc.substring(0,60)+'...' : p.desc) : ''}</div>
        </div>
        <div class="price">R$ ${p.price.toFixed(2)}</div>
      </div>
      <div class="actions">
        <button class="btn" onclick="openProduct(${p.id})">Detalhes</button>
        <button class="btn btn-primary" onclick="addToCartId(${p.id}, this)">Comprar</button>
      </div>
    `;
    grid.appendChild(el);
  });
  populateCategoryFilter();
}

// modal functions
function openProduct(id){
  const p = PRODUCTS[id];
  if(!p) return alert('Produto não encontrado');
  document.getElementById('modal-title').textContent = p.title;
  document.getElementById('modal-desc').textContent = p.desc + ' — Preço: R$' + p.price.toFixed(2);
  // images
  const imgs = document.getElementById('modal-images');
  imgs.innerHTML = '';
  if(p.imgs && p.imgs.length){
    p.imgs.forEach(src=>{
      const img = document.createElement('img'); img.src = src; imgs.appendChild(img);
    });
  } else {
    imgs.innerHTML = '<div class="small">Sem imagens</div>';
  }
  // buy now button
  const buyBtn = document.getElementById('buy-now');
  buyBtn.onclick = (e)=>{ e.preventDefault(); addToCartId(p.id); openCart(); }
  document.getElementById('modal').style.display = 'flex';
}

function closeModal(){ document.getElementById('modal').style.display = 'none'; }

// CART functions (by id)
function addToCartId(id, btnEl){
  const p = PRODUCTS[id];
  if(!p) return;
  addToCart(p.title, p.price, p.download, id);
  showToast(`${p.title} adicionado ao carrinho`);
  // small animation on button
  if(btnEl){
    btnEl.classList.add('pulse');
    setTimeout(()=> btnEl.classList.remove('pulse'), 450);
  }
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
  if(CART.length===0){
    box.innerHTML = '<p>Seu carrinho está vazio.</p>';
    // disable checkout
    document.getElementById('checkout-btn').disabled = true;
    document.getElementById('checkout-btn').textContent = 'Carrinho vazio';
    return;
  }
  // enable checkout
  document.getElementById('checkout-btn').disabled = false;
  document.getElementById('checkout-btn').textContent = 'Ir para o pagamento';
  // items
  CART.forEach((p,i)=>{
    const div = document.createElement('div'); div.className='cart-item';
    const subtotal = (p.price * p.qty).toFixed(2);
    div.innerHTML = `
      <div style="flex:1">
        <strong>${p.name}</strong>
        <div class="small">R$ ${p.price.toFixed(2)} x ${p.qty} — Sub: R$ ${subtotal}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div class="qty-control">
          <button class="btn-qty" onclick="changeQty(${i}, -1)">−</button>
          <span style="padding:0 8px">${p.qty}</span>
          <button class="btn-qty" onclick="changeQty(${i}, 1)">+</button>
        </div>
        <button class="remove" onclick="removeItem(${i})" title="Remover item">✖</button>
      </div>
    `;
    box.appendChild(div);
  });
  const total = getCartTotal().toFixed(2);
  const totalDiv = document.createElement('div');
  totalDiv.style.marginTop = '8px';
  totalDiv.style.borderTop = '1px solid #eee';
  totalDiv.style.paddingTop = '10px';
  totalDiv.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
    <strong>Total:</strong><div style="font-weight:900;color:var(--orange)">R$ ${total}</div>
  </div>`;
  box.appendChild(totalDiv);
}

function changeQty(i, delta){
  if(!CART[i]) return;
  CART[i].qty += delta;
  if(CART[i].qty<=0) CART.splice(i,1);
  saveCart(); renderCart();
}
function removeItem(i){ CART.splice(i,1); saveCart(); renderCart(); showToast('Item removido'); }

function openCart(){ 
  const panel = document.getElementById('cart-panel');
  panel.classList.add('open');
  renderCart(); updateCartLabel(); 
}
function closeCart(){ 
  const panel = document.getElementById('cart-panel');
  panel.classList.remove('open');
}

// checkout button triggers pagamento flow (see pagamento.js)
document.addEventListener('DOMContentLoaded', ()=>{
  loadProducts();
  loadCart();
  renderProducts();
  // open cart link
  const openCartLink = document.getElementById('open-cart');
  if(openCartLink) openCartLink.addEventListener('click', (e)=>{ e.preventDefault(); openCart(); });

  // escape to close modals / cart
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') { closeModal(); closeCart(); toggleAdmin(false); }
  });

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
  const openAdminBtn = document.getElementById('open-admin-panel');
  if(openAdminBtn) openAdminBtn.addEventListener('click', ()=> toggleAdmin(true));

  // close cart when clicking outside (small improvement)
  document.addEventListener('click', (e)=>{
    const panel = document.getElementById('cart-panel');
    if(!panel) return;
    if(panel.classList.contains('open')){
      const withinCart = panel.contains(e.target);
      const isCartBtn = e.target.closest('#open-cart');
      if(!withinCart && !isCartBtn){
        // don't auto close if clicking admin or modal
        // closeCart();
      }
    }
  });
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
  slideIndex = (slideIndex % 3) + 1;
  // placeholder for future slider images
}, 5000);

// toast (feedback rápido)
function showToast(msg){
  let t = document.getElementById('app-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'app-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 1600);
}

// expose some functions globally for inline onclick
window.openProduct = openProduct;
window.addToCart = addToCartId;
window.openCart = openCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
