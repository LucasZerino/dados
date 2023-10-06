// app.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const odoobridgeRouter = require("./routes/odoobridge");
const deskRouter = require("./routes/deskRouter");
const bankRouter = require("./routes/bank");
const businesslinkRoute = require("./routes/businesslinkRoute");
const buscadadosRoute = require("./routes/buscaDados");
const pdfRouter = require("./routes/pdf"); // Importe a rota PDF

// Middleware personalizado para registrar logs das solicitações
app.use((req, res, next) => {
  console.log(`Recebido pedido ${req.method} para ${req.url}`);
  next(); // Passa a solicitação para o próximo middleware
});

app.use(cors());
app.use(bodyParser.json({ limit: "1000mb" }));
app.use("/odoobridge", odoobridgeRouter);
app.use("/desk", deskRouter);
app.use("/bank", bankRouter);
app.use("/getLinks", businesslinkRoute);
app.use("/buscadados", buscadadosRoute);
app.use("/pdf", pdfRouter);

const PORT = 3832;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
