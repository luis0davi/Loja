import mercadopago from "mercadopago";

export default async function handler(req, res) {
  mercadopago.configure({
    access_token: TEST-214699310458254-112813-dcd8d534d55423ea64ed273f44701838-776186295
  });

  const preference = {
    items: [
      {
        id: "1",
        title: "Produto Teste",
        quantity: 1,
        currency_id: "BRL",
        unit_price: 10
      }
    ],
    back_urls: {
      success: "https://google.com",
      failure: "https://google.com",
      pending: "https://google.com"
    },
    auto_return: "approved"
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ link: response.body.init_point });
  } catch (err) {
    res.status(500).json({ error: "Falha ao gerar link." });
  }
}
