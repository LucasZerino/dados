// ./routes/businesslinkRoute.js

const express = require("express");
const puppeteer = require("puppeteer");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    // Valide se o URL foi fornecido.
    if (!url) {
      return res.status(400).json({ error: "URL não fornecido" });
    }

    // Use puppeteer para extrair os dados da URL fornecida.
    const extractedData = await getContentFromUrl(url);

    if (extractedData) {
      res.json(extractedData);
    } else {
      res
        .status(500)
        .json({ error: "Não foi possível extrair os dados da URL" });
    }
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Função para extrair dados da URL usando Puppeteer (a mesma função do código anterior).
async function getContentFromUrl(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
    );
    await page.goto(url, { timeout: 600000 });

    // Aguarde a visibilidade do elemento desejado.
    const contentElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(3) > div:nth-child(1) > p:nth-child(2) > a"
    );
    const EmailElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(3) > div:nth-child(2) > p:nth-child(2) > a"
    );
    const nameElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(1) > div:nth-child(2) > p:nth-child(2)"
    );

    // Extraia o texto dos elementos.
    const numero = await page.evaluate((element) => {
      return element.textContent;
    }, contentElement);
    const email = await page.evaluate((element) => {
      return element.textContent;
    }, EmailElement);
    const name = await page.evaluate((element) => {
      return element.textContent;
    }, nameElement);

    // Modifique o número de telefone para o formato desejado.
    const numeroModificado = numero
      .replace(/[\s-]/g, "")
      .replace("84", "+5584");

    // Crie um objeto JSON com os resultados.
    const result = {
      Numero: numeroModificado,
      Email: email.trim(),
      Nome: name.trim(),
    };

    return result;
  } catch (error) {
    console.error("Erro ao extrair conteúdo:", error);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = router;
