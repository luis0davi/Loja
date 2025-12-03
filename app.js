let cart = [];

/* ------------------------
   1) Carregar produtos
------------------------- */
async function loadProducts() {
  const r = await fetch(API + "?action=getProducts");
  const products = await r.json();

  if (!products.length) {
    document.getElementById("products").innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  let html = "";
  products.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <strong>R$ ${p.price.toFixed(2)}</strong>
        <button onclick="addToCart('${p.id}','${p.name}',${p.price})">
          Adicionar ao Carrinho
        </button>
      </div>
    `;
  });

  document.getElementById("products").innerHTML = html;
}
loadProducts();

/* ------------------------
   2) Carrinho
------------------------- */
function addToCart(id, name, price){
  cart.push({id,name,price});
  document.getElementById("cartCount").innerText = cart.length;
  alert("Adicionado ao carrinho!");
}

document.getElementById("cartBtn").onclick = () => {
  document.getElementById("cartModal").classList.remove("hidden");
  renderCart();
};

function closeCart(){
  document.getElementById("cartModal").classList.add("hidden");
}

function renderCart(){
  let html = "";
  cart.forEach(c => {
    html += `<p>${c.name} — R$ ${c.price.toFixed(2)}</p>`;
  });
  document.getElementById("cartItems").innerHTML = html;
}

/* ------------------------
   3) Finalizar Compra
------------------------- */
document.getElementById("checkoutBtn").onclick = async () => {
  const name = prompt("Seu nome:");
  const email = prompt("Seu e-mail:");

  const r = await fetch(API + "?action=createOrder", {
    method: "POST",
    body: JSON.stringify({name,email,cart})
  });

  const data = await r.json();
  window.location.href = data.payment_url; // link de pagamento MP
};
