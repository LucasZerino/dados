// Em routes/deskRoutes.js

const express = require("express");
const router = express.Router();
const createTicket = require("../utilites/deskTemplate");

router.post("/create/:templateNumber", async (req, res) => {
  try {
    console.log("Criando ticket...");
    const templateNumber = req.params.templateNumber;
    await createTicket(templateNumber);

    res.json({ message: "Ticket criado com sucesso" });
  } catch (error) {
    console.error("Erro ao criar o ticket:", error);
    res.status(500).json({ error: "Erro ao criar o ticket" });
  }
});

module.exports = router;
