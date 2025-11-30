// ===== ADMIN.JS =====
function toggleAdmin(show){
  const panel = document.getElementById('admin-panel');
  panel.style.display = show ? 'flex' : 'none';
  refreshAdminList();
}

function seedSampleProducts(){
  localStorage.setItem('tc_produtos_v1', JSON.stringify({
    1: { id:1, title:'Kit Valores — Atividades', desc:'PDF com 45 páginas...', price:12, download:'kit-valores.pdf', cat:'Kits', imgs:[] },
    2: { id:2, title:'Alfabetiza Aventura', desc:'Jogos e fichas...', price:20, download:'alfabetiza-aventura.pdf', cat:'Alfabetização', imgs:[] },
    3: { id:3, title:'NR-18 — Apostila', desc:'Resumo da NR-18...', price:8, download:'nr18-apostila.pdf', cat:'Profissional', imgs:[] }
  }));
  location.reload();
}

function refreshAdminList(){
  loadProducts();
  const list = document.getElementById('admin-list');
  list.innerHTML = '';
  Object.values(PRODUCTS).forEach(p=>{
    const div = document.createElement('div');
    div.style.border = '1px solid #eee';
    div.style.padding = '8px';
    div.style.marginBottom = '6px';
    div.innerHTML = `<strong>${p.title}</strong> — R$ ${p.price.toFixed(2)} <button onclick="deleteProduct(${p.id})">Excluir</button>`;
    list.appendChild(div);
  });
}

document.getElementById('admin-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('admin-name').value;
  const price = parseFloat(document.getElementById('admin-price').value);
  const cat = document.getElementById('admin-cat').value;
  const desc = document.getElementById('admin-desc').value;
  const file = document.getElementById('admin-file').value;
  // new id
  const ids = Object.keys(PRODUCTS).map(x=>Number(x));
  const nid = ids.length ? Math.max(...ids)+1 : 1;
  PRODUCTS[nid] = { id:nid, title:name, desc, price, download:file || 'arquivo.pdf', cat, imgs:[] };
  saveProducts();
  refreshAdminList();
  renderProducts();
  alert('Produto adicionado localmente.');
  document.getElementById('admin-form').reset();
});

function deleteProduct(id){
  if(confirm('Excluir produto?')){ delete PRODUCTS[id]; saveProducts(); refreshAdminList(); renderProducts(); }
}
