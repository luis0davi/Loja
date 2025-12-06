function getCarrinho() {
  return JSON.parse(localStorage.getItem("carrinho") || "[]");
}

function saveCarrinho(c) {
  localStorage.setItem("carrinho", JSON.stringify(c));
}

function addCarrinho(id, nome, preco) {
  let c = getCarrinho();
  c.push({id, nome, preco});
  saveCarrinho(c);
  alert("Produto adicionado!");
}

function renderCarrinho() {
  let c = getCarrinho();
  let html = "";
  let total = 0;

  c.forEach(p => {
    html += `<p>${p.nome} — R$ ${p.preco.toFixed(2)}</p>`;
    total += p.preco;
  });

  document.getElementById("lista").innerHTML = html;
  document.getElementById("total").innerText = total.toFixed(2);
}
