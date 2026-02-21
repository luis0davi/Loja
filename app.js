const express = require("express");
const app = express();
app.use(express.json());

let liberarAgua = false;

app.post("/webhook", (req, res) => {
    const pagamento = req.body;

    // Verifica valor
    if (pagamento.data && pagamento.data.transaction_amount == 1.5) {
        liberarAgua = true;
    }

    res.sendStatus(200);
});

app.get("/status", (req, res) => {
    if (liberarAgua) {
        liberarAgua = false;
        res.json({ liberar: true });
    } else {
        res.json({ liberar: false });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando");
});
