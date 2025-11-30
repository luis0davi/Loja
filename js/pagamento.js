// Seu Access Token de TESTE
const accessToken = "TEST-214699310458254-112813-dcd8d534d55423ea64ed273f44701838-776186295";

// Total salvo no LocalStorage
let total = localStorage.getItem("total") || "0.00";

// Cria preference automaticamente
async function gerarLinkPagamento() {
  const url = "https://api.mercadopago.com/checkout/preferences";

  const dados = {
    items: [
      {
        title: "Compra na Loja",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(total)
      }
    ]
  };

  const req = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados)
  });

  const res = await req.json();

  console.log(res);

  // link de pagamento pronto
  document.getElementById("btn-pagar").href = res.init_point;
}

// Gera no carregamento da página
gerarLinkPagamento();
