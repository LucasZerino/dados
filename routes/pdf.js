const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { exec } = require("child_process");

// Rota para gerar um arquivo ODT a partir do DOCX com substituições
router.post("/gerar-odt", async (req, res) => {
  try {
    // Ler o conteúdo do arquivo modelo.docx
    const docxPath = path.join(__dirname, "../modelo.docx");
    const outputPath = path.join(__dirname, "../termos");

    // Verifique se o arquivo modelo.docx existe
    if (!fs.existsSync(docxPath)) {
      return res
        .status(404)
        .json({ message: "Arquivo modelo.docx não encontrado." });
    }

    // Crie uma cópia do arquivo modelo.docx
    const outputOdtFileName = `termo_${Date.now()}.odt`;
    const outputOdtFilePath = path.join(outputPath, outputOdtFileName);

    // Faça unzip do arquivo modelo.docx
    const zip = new AdmZip(docxPath);

    // Leitura do conteúdo do documento
    let contentXml = zip.readAsText("word/document.xml");

    // Substituir as variáveis no conteúdo
    const variaveis = req.body;
    for (const variavel in variaveis) {
      const regex = new RegExp("{" + variavel + "}", "g");
      contentXml = contentXml.replace(regex, variaveis[variavel]);
    }

    // Escrever o conteúdo modificado de volta no arquivo ODT
    zip.updateFile("word/document.xml", Buffer.from(contentXml, "utf-8"));
    zip.writeZip(outputOdtFilePath);

    // Envie a resposta com o URL do arquivo ODT gerado
    res.status(200).json({ odtUrl: outputOdtFilePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

module.exports = router;
