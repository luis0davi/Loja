// ===== APP.JS =====
const STORAGE_KEY = 'tc_produtos_v1';
const CART_KEY = 'tc_cart_v1';

let PRODUCTS = {};
let CART = [];

// Produtos padrão
const SAMPLE = {
  1:{id:1,title:'Kit Valores — Atividades',desc:'PDF com 45 páginas para trabalhar valores e convivência. Entrega digital após pagamento.',price:12,download:'kit-valores.pdf',cat:'Kits',imgs:[]},
  2:{id:2,title:'Alfabetiza Aventura',desc:'Jogos e fichas para alfabetização.',price:20,download:'alfabetiza-aventura.pdf',cat:'Alfabetização',imgs:[]},
  3:{id:3,title:'NR-18 — Apostila',desc:'Resumo da NR-18 em linguagem didática.',price:8,download:'nr18-apostila.pdf',cat:'Profissional',imgs:[]}
};

function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ try{PRODUCTS = JSON.parse(raw);return;}catch(e){} }
  PRODUCTS = SAMPLE;
  saveProducts();
}
function saveProducts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
}

function loadCart(){
  const raw = localStorage.getItem(CART_KEY);
  CART = raw ? JSON.parse(raw) : [];
  updateCartLabel();
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(CART));
  updateCartLabel();
}

// Atualiza valor do carrinho no menu
function updateCartLabel(){
  const btn = document.getElementById("open-cart");
  const total = CART.reduce((s,p)=>s+(p.price*p.qty),0);
  btn.innerHTML = `🛒 CARRINHO • R$${total.toFixed(2)}`;
}

// ================= ANIMAÇÃO +1 ====================
function showAddAnimation(x, y){
  const el = document.createElement("div");
  el.className = "cart-plus";
  el.textContent = "+1";
  el.style.left = x+"px";
  el.style.top = y+"px";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 900);
}

// ================= RENDER PRODUTOS =================
function renderProducts(filter='all', q=''){
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  const items = Object.values(PRODUCTS).filter(p=>{
    const okCat = filter==='all' || p.cat===filter;
    const okQ = q==='' || p.title.toLowerCase().includes(q.toLowerCase());
    return okCat && okQ;
  });

  items.forEach(p=>{
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="thumb">${p.title.split(' ')[0]}</div>
      <div class="meta">
        <div>
          <strong>${p.title}</strong>
          <div class="small">${p.desc.substring(0,60)}...</div>
        </div>
        <div class="price">R$ ${p.price.toFixed(2)}</div>
      </div>
      <div class="actions">
        <button class="btn" onclick="openProduct(${p.id})">Detalhes</button>
        <button class="btn btn-primary" onclick="addToCartId(${p.id}, event)">Adicionar ao carrinho</button>
      </div>
    `;
    grid.appendChild(el);
  });

  populateCategoryFilter();
}

// ================= MODAL PRODUTO =================
function openProduct(id){
  const p = PRODUCTS[id];
  document.getElementById('modal-title').textContent = p.title;
  document.getElementById('modal-desc').textContent = p.desc + ' — R$' + p.price.toFixed(2);

  const imgs = document.getElementById('modal-images');
  imgs.innerHTML = '';

  const buyBtn = document.getElementById('buy-now');
  buyBtn.textContent = "Adicionar ao carrinho";
  buyBtn.onclick = (e)=>{
    addToCartId(p.id, e);
    closeModal();
  };

  document.getElementById('modal').style.display = 'flex';
}
function closeModal(){
  document.getElementById('modal').style.display='none';
}

// ================= CARRINHO =================
function addToCartId(id, event){
  const p = PRODUCTS[id];
  addToCart(p.title, p.price, p.download, id);

  if(event){
    const rect = event.target.getBoundingClientRect();
    showAddAnimation(rect.x, rect.y);
  }

  updateCartLabel();
  openCart(); 
}

function addToCart(name, price, file, id){
  const found = CART.find(x=>x.id===id);
  if(found) found.qty++;
  else CART.push({id,name,price,file,qty:1});
  saveCart();
  renderCart();
}

function renderCart(){
  const box = document.getElementById('cart-box');
  box.innerHTML = '';
  if(CART.length===0){ box.innerHTML='<p>Seu carrinho está vazio.</p>'; return; }

  CART.forEach((p,i)=>{
    const div = document.createElement('div');
    div.className='cart-item';
    div.innerHTML = `
      <div style="flex:1">
        <strong>${p.name}</strong>
        <div>R$ ${p.price.toFixed(2)} x ${p.qty}</div>
      </div>
      <div>
        <div class="qty-control">
          <button onclick="changeQty(${i},-1)">-</button>
          <button onclick="changeQty(${i},1)">+</button>
        </div>
        <button class="remove" onclick="removeItem(${i})">✖</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function changeQty(i,delta){
  CART[i].qty += delta;
  if(CART[i].qty<=0) CART.splice(i,1);
  saveCart();
  renderCart();
}

function removeItem(i){
  CART.splice(i,1);
  saveCart();
  renderCart();
}

function openCart(){
  const panel = document.getElementById('cart-panel');
  panel.classList.add("open");
  renderCart();
}
function closeCart(){
  document.getElementById('cart-panel').classList.remove("open");
}

// ================= CATEGORIAS =================
function populateCategoryFilter(){
  const sel = document.getElementById('category-filter');
  const cats = new Set(Object.values(PRODUCTS).map(p=>p.cat));
  sel.innerHTML = '<option value="all">Todas as categorias</option>';
  cats.forEach(c=> sel.innerHTML += `<option value="${c}">${c}</option>`);
}

// ================= EVENTOS =================
document.addEventListener('DOMContentLoaded', ()=>{
  loadProducts();
  loadCart();
  renderProducts();

  document.getElementById('open-cart').addEventListener('click',(e)=>{
    e.preventDefault();
    openCart();
  });

  document.getElementById('search-btn').addEventListener('click', ()=>{
    const q = document.getElementById('search-input').value;
    renderProducts(document.getElementById('category-filter').value, q);
  });

  document.getElementById('category-filter').addEventListener('change', ()=>{
    renderProducts(document.getElementById('category-filter').value, document.getElementById('search-input').value);
  });

  document.getElementById('checkout-btn').addEventListener('click', ()=>{
    if(CART.length===0){ alert('Carrinho vazio'); return; }
    const order = {
      items: CART.map(c=>({id:c.id,title:c.name,quantity:c.qty,unit_price:c.price})),
      email:''
    };
    window.startCheckout(order);
  });

  document.getElementById('open-admin-panel').addEventListener('click', ()=> toggleAdmin(true));
});

// Expor global
window.openProduct = openProduct;
window.addToCartId = addToCartId;
window.changeQty = changeQty;
window.removeItem = removeItem;
window.openCart = openCart;
window.closeCart = closeCart;
