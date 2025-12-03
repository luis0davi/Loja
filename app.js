// Ajuste: URL do seu Apps Script Web App (deploy) - copie do Deploy
const API_URL = "https://script.google.com/macros/s/AKfycbxGHvqQ6-wCr19-ZlE9JllS0Iy93NQu6IA4LiDA7sNdbzE3gwyafBgdSoTZuAZXpQpUbw/exec";

// Funções
async function fetchProducts(){
  const resp = await fetch(API_URL + "?action=getProducts");
  return await resp.json();
}

function formatPrice(n){ return Number(n).toFixed(2); }

async function renderProducts(){
  const products = await fetchProducts();
  const container = document.getElementById("products");
  container.innerHTML = "";
  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">R$ ${formatPrice(p.price)}</p>
      <button data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Adicionar ao Carrinho</button>
    `;
    container.appendChild(div);
  });

  // listeners
  document.querySelectorAll(".product-card button").forEach(btn=>{
    btn.addEventListener("click", (ev)=>{
      const id = ev.currentTarget.dataset.id;
      const name = ev.currentTarget.dataset.name;
      const price = Number(ev.currentTarget.dataset.price);
      addToCart({ id, name, price });
    });
  });
}

// Carrinho (localStorage)
let cart = JSON.parse(localStorage.getItem("cart_v1")) || [];
updateCartCount();

function addToCart(item){
  cart.push(item);
  localStorage.setItem("cart_v1", JSON.stringify(cart));
  updateCartCount();
  alert(item.name + " adicionado ao carrinho.");
}

function updateCartCount(){
  document.getElementById("cartCount").innerText = cart.length;
}

document.getElementById("cartBtn").addEventListener("click", ()=>{
  document.getElementById("cartModal").classList.remove("hidden");
  renderCart();
});
document.getElementById("closeCart").addEventListener("click", ()=> document.getElementById("cartModal").classList.add("hidden"));

function renderCart(){
  const list = document.getElementById("cartItems");
  list.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx)=>{
    list.innerHTML += `<p>${it.name} — R$ ${formatPrice(it.price)} <button data-idx="${idx}" class="remove-item">Remover</button></p>`;
    total += Number(it.price);
  });
  document.getElementById("cartTotal").innerText = total.toFixed(2);
  document.querySelectorAll(".remove-item").forEach(b=>{
    b.addEventListener("click", (ev)=>{
      const idx = Number(ev.currentTarget.dataset.idx);
      cart.splice(idx,1);
      localStorage.setItem("cart_v1", JSON.stringify(cart));
      updateCartCount();
      renderCart();
    });
  });
}

// Checkout
document.getElementById("checkoutBtn").addEventListener("click", async ()=>{
  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  if(!name || !email) { alert("Preencha nome e e-mail."); return; }
  if(cart.length === 0){ alert("Carrinho vazio."); return; }

  // criar pedido
  const payload = { name, email, cart };
  const resp = await fetch(API_URL + "?action=createOrder", { method: "POST", body: JSON.stringify(payload) });
  const data = await resp.json();
  if(data && data.payment_url){
    // redireciona para Mercado Pago
    window.location.href = data.payment_url;
  } else {
    alert("Erro ao criar pedido: " + JSON.stringify(data));
  }
});

// inicialização
renderProducts();
