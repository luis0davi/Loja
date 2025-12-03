// URL do seu Apps Script Web App
const API_URL = "SUA_WEB_APP_URL_AQUI";

// carregar produtos do sheets
async function loadProducts() {
  const res = await fetch(API_URL + "?action=getProducts");
  const data = await res.json();

  const container = document.getElementById("products");
  container.innerHTML = "";

  data.forEach(item => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${item.image}" />
        <h3>${item.name}</h3>
        <p>R$ ${item.price}</p>
        <button onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
          Adicionar ao Carrinho
        </button>
      </div>
    `;
  });
}

// carrinho
let cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartCount();

function addToCart(id, name, price) {
  cart.push({ id, name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  document.getElementById("cartCount").innerText = cart.length;
}

// modal carrinho
document.getElementById("cartBtn").onclick = () =>
  document.getElementById("cartModal").classList.remove("hidden");

document.getElementById("closeCart").onclick = () =>
  document.getElementById("cartModal").classList.add("hidden");

function renderCart() {
  const list = document.getElementById("cartItems");
  list.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    list.innerHTML += `<p>${item.name} — R$ ${item.price}</p>`;
    total += item.price;
  });

  document.getElementById("cartTotal").innerText = total.toFixed(2);
}

setInterval(renderCart, 300);

document.getElementById("checkoutBtn").onclick = async () => {
  const name = document.getElementById("customerName").value;
  const email = document.getElementById("customerEmail").value;

  if (!name || !email) {
    alert("Preencha nome e e-mail!");
    return;
  }

  const res = await fetch(API_URL + "?action=createOrder", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      cart
    })
  });

  const data = await res.json();

  // redirecionar para o pagamento MP
  window.location.href = data.payment_url;
};
