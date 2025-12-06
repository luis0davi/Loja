const mp = new MercadoPago("TEST-b3a2a4af-ce0b-442e-80cc-978e780b59ad", {
  locale: 'pt-BR'
});

async function gerarPagamento() {
  const email = document.getElementById("email").value;
  if (!email) return alert("Digite seu e-mail!");

  const carrinho = JSON.parse(localStorage.getItem("carrinho"));

  let res = await fetch(
    "https://script.google.com/macros/s/SEU_WEBAPP_ID/exec",
    {
      method: "POST",
      body: JSON.stringify({
        tipo: "criar_preferencia",
        email: email,
        itens: carrinho
      })
    }
  );

  const data = await res.json();

  mp.bricks().create("wallet", "wallet_container", {
    initialization: { preferenceId: data.preference_id }
  });
}
