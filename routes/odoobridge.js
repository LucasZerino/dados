// routes/odoobridge.js

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const jsonData = req.body;

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };

    // Fazendo uma requisição para o webhook com os dados JSON
    const webhookURL = "https://hook.bolt360.com.br/webhook/appffodoo";
    const response = await axios.post(webhookURL, jsonData);

    // Retornando a resposta do webhook como resposta para a requisição original
    res.json({
      message: "JSON enviado com sucesso para o webhook",
      response: response.data,
    });
  } catch (error) {
    console.error("Erro ao enviar JSON para o webhook:", error);
    res.status(500).json({ error: "Erro ao enviar JSON para o webhook" });
  }
});

module.exports = router;
