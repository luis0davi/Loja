require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const mercadopago = require("mercadopago");
const crypto = require("crypto");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DOWNLOAD_TOKEN_EXPIRY_HOURS = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS || "24", 10);
//if (!MP_ACCESS_TOKEN) { console.error("Coloque MERCADO_PAGO_ACCESS_TOKEN no .env"); process.exit(1); }
// BLOQUEIO TEMPORARIAMENTE REMOVIDO PARA TESTES
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    console.warn("⚠️ AVISO: MERCADO_PAGO_ACCESS_TOKEN não definido. Rodando em modo de teste.");
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TESTE_TEMPORARIO";
}

mercadopago.configurations.setAccessToken(MP_ACCESS_TOKEN);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PRODUCTS_FILE = path.join(__dirname, "data", "products.json");
const TOKENS_FILE = path.join(__dirname, "data", "download_tokens.json");
const ORDERS_FILE = path.join(__dirname, "data", "orders.json");
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, JSON.stringify([]));
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));

function loadProducts(){ return JSON.parse(fs.readFileSync(PRODUCTS_FILE)); }
function saveProducts(p){ fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(p, null, 2)); }
function loadTokens(){ return JSON.parse(fs.readFileSync(TOKENS_FILE)); }
function saveTokens(t){ fs.writeFileSync(TOKENS_FILE, JSON.stringify(t, null, 2)); }
function loadOrders(){ return JSON.parse(fs.readFileSync(ORDERS_FILE)); }
function saveOrders(o){ fs.writeFileSync(ORDERS_FILE, JSON.stringify(o, null, 2)); }

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
//const smtpUser = process.env.SMTP_USER;
const smtpUser = "adm";
//const smtpPass = process.env.SMTP_PASS;
const smtpPass = 123;
const emailFrom = process.env.EMAIL_FROM || "no-reply@example.com";
const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: (String(process.env.SMTP_SECURE||"true")==="true"), auth: { user: smtpUser, pass: smtpPass } });

const upload = multer({ dest: path.join(__dirname, "uploads/") });

app.get("/api/products", (req, res) => res.json(loadProducts()));

// Admin endpoints
function checkAdminAuth(req, res, next){
  const user = req.headers["x-admin-user"] || req.body.admin_user;
  const pass = req.headers["x-admin-pass"] || req.body.admin_pass;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) return next();
  return res.status(401).json({ error: "unauthorized" });
}
app.get("/admin/list", checkAdminAuth, (req, res) => res.json(loadProducts()));
app.post("/admin/products", checkAdminAuth, upload.single("file"), (req, res) => {
  try {
    const { title, description, price_cents } = req.body;
    const filename = req.file ? req.file.originalname : (req.body.filename || null);
    if (req.file) { const target = path.join(__dirname, "uploads", req.file.originalname); fs.renameSync(req.file.path, target); }
    const products = loadProducts();
    const id = uuidv4();
    const p = { id, title, description, price_cents: parseInt(price_cents||0,10), filename };
    products.push(p);
    saveProducts(products);
    res.json({ ok:true, product: p });
  } catch (err){ console.error(err); res.status(500).json({ error: err.message }); }
});
app.delete("/admin/products/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id; let products = loadProducts(); products = products.filter(p=>p.id!==id); saveProducts(products); res.json({ ok:true });
});

// create preference
app.post("/api/create-preference", async (req, res) => {
  try {
    const { items, payer } = req.body;
    const products = loadProducts();
    const mp_items = items.map(it => { const p = products.find(x=>x.id===it.id); if(!p) throw new Error("product not found "+it.id); return { title: p.title, quantity: it.quantity||1, unit_price: (p.price_cents||0)/100, description: p.description||"" }; });
    const external_reference = JSON.stringify({ items, payer: payer||{} });
    const preference = { items: mp_items, payer: payer||undefined, back_urls: { success: `${BASE_URL}/success.html`, failure: `${BASE_URL}/`, pending: `${BASE_URL}/` }, auto_return: "approved", external_reference };
    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.body.init_point, preference_id: response.body.id });
  } catch (err){ console.error(err); res.status(500).json({ error: err.message }); }
});

// webhook
app.post("/webhook", bodyParser.urlencoded({ extended:true }), async (req,res)=>{
  try{
    const paymentId = req.query.id || req.body.id || (req.body && req.body["data.id"]);
    if(!paymentId) return res.status(200).send("no id");
    const payment = await mercadopago.payment.findById(paymentId);
    const status = payment.body.status;
    if(status==="approved"){
      const preferenceId = payment.body.preference_id;
      let prefItems=[]; let buyerEmail = (payment.body.payer && payment.body.payer.email)?payment.body.payer.email:null;
      if(preferenceId){ const pref = await mercadopago.preferences.findById(preferenceId); const ext = pref.body.external_reference; if(ext){ try{ const parsed = JSON.parse(ext); prefItems = parsed.items || []; if(parsed.payer && parsed.payer.email) buyerEmail = parsed.payer.email; }catch(e){ } } }
      const products = loadProducts(); const generated=[];
      prefItems.forEach(it=>{ const p = products.find(x=>x.id===it.id); if(p){ const token = crypto.randomBytes(24).toString("hex"); const expires_at = Date.now()+DOWNLOAD_TOKEN_EXPIRY_HOURS*3600*1000; const tokens = loadTokens(); tokens.push({ token, filename: p.filename, expires_at, downloads:0, max_downloads:3 }); saveTokens(tokens); generated.push({ title: p.title, filename: p.filename, token }); } });
      const orders = loadOrders(); orders.push({ id: paymentId, preference_id: payment.body.preference_id, status, email: buyerEmail, items: prefItems, generated, created_at: Date.now() }); saveOrders(orders);
      if(buyerEmail && smtpHost && smtpUser && smtpPass){
        const linksHtml = generated.map(g=>`<li>${g.title} - <a href="${BASE_URL}/download/${g.token}">Download</a></li>`).join("");
        const text = `Obrigado pela compra! Acesse seus arquivos:\\n\\n${generated.map(g=>`${BASE_URL}/download/${g.token} - ${g.title}`).join("\\n")}`;
        const html = `<p>Obrigado pela compra! Acesse seus arquivos:</p><ul>${linksHtml}</ul><p>Links expiram em ${DOWNLOAD_TOKEN_EXPIRY_HOURS} horas.</p>`;
        const mailOptions = { from: emailFrom, to: buyerEmail, subject: 'Seus arquivos comprados', text, html };
        transporter.sendMail(mailOptions, (err,info)=>{ if(err) console.error('Erro ao enviar e-mail:', err); else console.log('E-mail enviado:', info && info.response); });
      }
    }
    res.status(200).send('received');
  }catch(err){ console.error(err); res.status(500).send('error'); }
});

// download
app.get('/download/:token', (req,res)=>{
  const token = req.params.token; const tokens = loadTokens(); const row = tokens.find(t=>t.token===token);
  if(!row) return res.status(404).send('Token inválido'); if(Date.now()>row.expires_at) return res.status(410).send('Link expirado'); if(row.downloads>=row.max_downloads) return res.status(410).send('Limite de downloads atingido');
  const filePath = path.join(__dirname,'uploads',row.filename); if(!fs.existsSync(filePath)) return res.status(404).send('Arquivo não encontrado');
  row.downloads += 1; saveTokens(tokens); res.download(filePath, row.filename);
});

app.listen(PORT, ()=>{ console.log('Servidor rodando em', PORT); });
