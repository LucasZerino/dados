const fs = require("fs");
const puppeteer = require("puppeteer");

// Função para extrair dados de um link específico
async function extractDataFromLink(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 600000 });

    // Aguarde a visibilidade dos elementos desejados.
    const contentElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(3) > div:nth-child(1) > p:nth-child(2) > a",
      { visible: true }
    ); // Seu seletor CSS aqui

    const EmailElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(3) > div:nth-child(2) > p:nth-child(2) > a",
      { visible: true }
    ); // Seu seletor CSS aqui

    const nameElement = await page.waitForSelector(
      "#__nuxt > div > div:nth-child(2) > section:nth-child(1) > div > div > div:nth-child(4) > div.column.is-9 > div:nth-child(1) > div:nth-child(2) > p:nth-child(2)",
      { visible: true }
    ); // Seu seletor CSS aqui

    // Extraia o texto dos elementos.
    const numero = await contentElement.evaluate((element) => {
      return element.textContent;
    });
    const email = await EmailElement.evaluate((element) => {
      return element.textContent;
    });
    const name = await nameElement.evaluate((element) => {
      return element.textContent;
    });

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

    console.log(result);

    return result;
  } catch (error) {
    console.error("Erro ao extrair conteúdo:", error);
    return null;
  } finally {
    await browser.close();
  }
}

// Carregue os links do arquivo links.json
let links = [];
try {
  const jsonData = require("../package/links.json");
  links = jsonData.links;
} catch (err) {
  console.error("Erro ao carregar links.json:", err);
}

// Verifique se links é um array antes de iterar sobre ele
if (!Array.isArray(links)) {
  console.error("O arquivo links.json não contém um array válido de links.");
} else {
  // Processar cada link e armazenar os resultados
  const dados = [];
  (async () => {
    for (const linkObject of links) {
      const link = linkObject.link;
      const data = await extractDataFromLink(link);
      if (data) {
        dados.push(data);
      }
    }

    // Caminho absoluto para o arquivo dados.json
    const outputPath = path.join(__dirname, "../package/dados.json");

    // Salve os dados no arquivo dados.json
    fs.writeFileSync(outputPath, JSON.stringify(dados, null, 2));

    console.log(
      "Extração de dados concluída e os resultados foram salvos em dados.json"
    );
  })();
}
