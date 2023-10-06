const express = require("express");
const router = express.Router();
const main = require("../utilites/businesslink"); // Importe a função main do seu script businesslink.js

router.get("/", async (req, res) => {
  try {
    const links = await main(); // Chame a função main para obter os links
    res.json({ links });
  } catch (error) {
    console.error("Erro ao obter os links:", error);
    res.status(500).json({ error: "Erro ao obter os links" });
  }
});

module.exports = router;
