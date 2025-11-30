// ===== PAGAMENTO.JS =====
// Replace this TEST token with your test token (you already had one). WARNING: do NOT use production token in frontend.
const MP_TEST_TOKEN = "TEST-214699310458254-112813-dcd8d534d55423ea64ed273f44701838-776186295";

// Function to create preference via Mercado Pago REST API
async function gerarLinkPagamento(orderItems){
  // orderItems: [{id, title, quantity, unit_price}]
  const preference = {
    items: orderItems.map(it=>({
      id: String(it.id),
      title: it.title,
      quantity: it.quantity,
      currency_id: "BRL",
      unit_price: Number(it.unit_price)
    })),
    back_urls: {
      success: location.href,   // volta para a página atual
      failure: location.href,
      pending: location.href
    },
    auto_return: "approved"
  };

  const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + MP_TEST_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(preference)
  });

  if(!resp.ok){
    const err = await resp.text();
    throw new Error("Erro gerando preferência: " + err);
  }
  const data = await resp.json();
  return data.init_point; // URL do checkout
}

// Exposed function to start checkout from app.js
window.startCheckout = async function(order){
  try{
    // Transform order items to match expected shape
    const items = order.items.map(i=>({ id:i.id, title:i.title, quantity:i.quantity, unit_price:i.unit_price || i.unit_price || i.price }));
    // call API
    const link = await gerarLinkPagamento(items);
    // Redirect to Mercado Pago checkout
    window.location.href = link;
  }catch(e){
    alert("Erro no pagamento: " + e.message);
    console.error(e);
  }
}
