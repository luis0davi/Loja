const products = [
    { id: 1, name: "Planilha Financeira Mestre", price: 29.90, description: "Controle completo de gastos mensais." },
    { id: 2, name: "PDF Atividades Alfabetização", price: 15.00, description: "Mais de 50 páginas de exercícios." },
    { id: 3, name: "Ebook Gestão de Tempo", price: 19.90, description: "Técnicas para otimizar sua rotina." }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderProducts() {
    const productListEl = document.getElementById('products-list');
    products.forEach(product => {
        const productEl = document.createElement('div');
        productEl.classList.add('product');
        productEl.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>R$ ${product.price.toFixed(2)}</p>
            <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
        `;
        productListEl.appendChild(productEl);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCart();
        alert(`${product.name} adicionado ao carrinho!`);
    }
}

function updateCart() {
    const cartItemsEl = document.getElementById('cart-items');
    cartItemsEl.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - R$ ${item.price.toFixed(2)}`;
        cartItemsEl.appendChild(li);
        total += item.price;
    });

    document.getElementById('cart-total').textContent = total.toFixed(2);
    localStorage.setItem('cart', JSON.stringify(cart));
}

function clearCart() {
    cart = [];
    updateCart();
    alert('Carrinho limpo.');
}

function checkout() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    
    // AQUI VOCÊ INTEGRARIA COM O MERCADO PAGO
    alert("Iniciando processo de checkout!\n\nNo mundo real, aqui você seria redirecionado para a página de pagamento do Mercado Pago com os dados do pedido.");
    
    // Para fins de teste, mostra os itens que seriam enviados:
    console.log("Itens para enviar ao Mercado Pago:", cart);
    
    // Limpar carrinho após (simulação)
    // clearCart(); 
}

// Inicializa a loja ao carregar a página
renderProducts();
updateCart();
