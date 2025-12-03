// Frontend logic
const productsContainer = document.getElementById('products');
let cart = JSON.parse(localStorage.getItem('cart_v1') || '[]');
document.getElementById('cartCount').innerText = cart.length;

async function fetchProducts(){
  try{
    const res = await fetch(API_URL + '?action=getProducts');
    const data = await res.json();
    return data;
  }catch(err){
    console.error(err);
    return [];
  }
}

function formatPrice(n){ return Number(n).toFixed(2); }

function renderProducts(list){
  productsContainer.innerHTML = '';
  list.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/600x400?text=Imagem'}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>${p.description || ''}</p>
      <p class="price">R$ ${formatPrice(p.price)}</p>
      <button class="primary" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Adicionar ao carrinho</button>
    `;
    productsContainer.appendChild(el);
  });

  document.querySelectorAll('.card button').forEach(b=>{
    b.addEventListener('click', (ev)=>{
      const id = ev.currentTarget.dataset.id;
      const name = ev.currentTarget.dataset.name;
      const price = Number(ev.currentTarget.dataset.price);
      cart.push({id,name,price});
      localStorage.setItem('cart_v1', JSON.stringify(cart));
      document.getElementById('cartCount').innerText = cart.length;
      alert(name + ' adicionado ao carrinho');
    });
  });
}

async function init(){
  const products = await fetchProducts();
  renderProducts(products);
}
init();

/* CART MODAL */
document.getElementById('openCartBtn').addEventListener('click', ()=>{
  document.getElementById('cartModal').classList.remove('hidden');
  renderCart();
});
document.getElementById('closeCart').addEventListener('click', ()=> document.getElementById('cartModal').classList.add('hidden'));

function renderCart(){
  const el = document.getElementById('cartItems');
  el.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx)=>{
    el.innerHTML += `<div style="margin-bottom:8px"><b>${it.name}</b> — R$ ${formatPrice(it.price)} <button data-idx="${idx}" style="margin-left:8px">Remover</button></div>`;
    total += Number(it.price);
  });
  document.getElementById('cartTotal').innerText = formatPrice(total);

  el.querySelectorAll('button[data-idx]').forEach(btn=>{
    btn.addEventListener('click', ev=>{
      const idx = Number(ev.currentTarget.dataset.idx);
      cart.splice(idx,1);
      localStorage.setItem('cart_v1', JSON.stringify(cart));
      document.getElementById('cartCount').innerText = cart.length;
      renderCart();
    });
  });
}

/* CHECKOUT -> chama Apps Script para criar preferência MP */
document.getElementById('checkoutBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('buyerName').value.trim();
  const email = document.getElementById('buyerEmail').value.trim();
  if(!name || !email){ alert('Preencha nome e e-mail'); return; }
  if(cart.length === 0){ alert('Carrinho vazio'); return; }

  const payload = { name, email, cart };
  try{
    const resp = await fetch(API_URL + '?action=createOrder', { method:'POST', body: JSON.stringify(payload) });
    const data = await resp.json();
    if(data && data.init_point){
      // redirect to MP checkout
      window.location.href = data.init_point;
    }else{
      alert('Erro ao criar pedido: ' + JSON.stringify(data));
    }
  }catch(err){
    alert('Erro: ' + err);
  }
});
