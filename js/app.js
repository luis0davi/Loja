let produtos = [
  { id: 1, nome: "Produto 1", preco: 10, img: "img/p1.jpg" },
  { id: 2, nome: "Produto 2", preco: 20, img: "img/p2.jpg" },
  { id: 3, nome: "Produto 3", preco: 30, img: "img/p3.jpg" }
];

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function salvar() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function atualizarContador() {
  document.getElementById("contador").innerText =
    carrinho.reduce((acc, item) => acc + item.qtd, 0);
}

function carregarProdutos() {
  let lista = document.getElementById("lista-produtos");

  produtos.forEach(p => {
    lista.innerHTML += `
      <div class="produto">
        <img src="${p.img}">
        <h3>${p.nome}</h3>
        <p>R$ ${p.preco}</p>
        <button onclick="addCarrinho(${p.id})">Adicionar</button>
      </div>`;
  });
}

function addCarrinho(id) {
  let item = carrinho.find(i => i.id === id);

  if (item) item.qtd++;
  else carrinho.push({ id, qtd: 1 });

  salvar();
  atualizarContador();
}

function abrirCarrinho() {
  let modal = document.getElementById("modal-carrinho");
  modal.style.display = "flex";

  let itens = document.getElementById("itens-carrinho");
  itens.innerHTML = "";

  let total = 0;

  carrinho.forEach(item => {
    let p = produtos.find(prod => prod.id === item.id);
    total += p.preco * item.qtd;

    itens.innerHTML += `
      <p>${p.nome} — ${item.qtd}x = R$ ${p.preco * item.qtd}</p>
    `;
  });

  document.getElementById("total").innerText = total.toFixed(2);

  localStorage.setItem("total", total.toFixed(2));
}

document.getElementById("btnCarrinho").onclick = abrirCarrinho;
document.getElementById("fecharModal").onclick =
  () => document.getElementById("modal-carrinho").style.display = "none";

carregarProdutos();
atualizarContador();
