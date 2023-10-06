const puppeteer = require("puppeteer");

async function choose(page, button, value) {
  await button.fill(value);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
}

async function main() {
  async function getHref(page, index) {
    await sleep(1);
    let href = await page.waitForSelector(
      `#__nuxt > div > div.top-footer > section > div:nth-child(11) > div.column.is-offset-1.is-6 > div > div > div > div > div:nth-child(${index}) > article > div > div > p > a`
    );
    return await href.evaluate((el) => {
      return el.getAttribute("href");
    });
  }
  const sleep = async (seconds = 0) => {
    new Promise((r) => setTimeout(r, seconds * 1000));
  };

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 600 },
  });
  const page = await browser.newPage();

  await page.goto("https://casadosdados.com.br/solucao/cnpj/pesquisa-avancada");

  const cnaeBtn = await page.locator(
    "#__nuxt > div > div.top-footer > section > div:nth-child(3) > div.column.is-4 > section > div > div > div > div > div.control.has-icons-left > input"
  );
  const cnaes = [
    "5611204",
    "5611202",
    "5611205",
    "5611201",
    "4721102",
    "4721101",
    "4511102",
  ];

  for (const cnae of cnaes) {
    await choose(page, cnaeBtn, cnae);
    await sleep(1);
  }

  const stateBtn = await page.locator(
    "#__nuxt > div > div.top-footer > section > div:nth-child(4) > div:nth-child(2) > div > div > div > div > div.control.has-icons-left > input"
  );
  await choose(page, stateBtn, "rio grande do norte");

  // Com telefone opção
  await page
    .locator(
      "#__nuxt > div > div.top-footer > section > div:nth-child(6) > div.column.is-5 > div:nth-child(1) > div > div > label:nth-child(1) > input[type=checkbox]"
    )
    .click();
  // Com email opção
  await page
    .locator(
      "#__nuxt > div > div.top-footer > section > div:nth-child(6) > div.column.is-5 > div:nth-child(2) > div > div > label:nth-child(2) > input[type=checkbox]"
    )
    .click();

  await sleep(3);
  // clica em pesquisar
  await page
    .locator(
      "#__nuxt > div > div.top-footer > section > div:nth-child(7) > div > div > button.button.is-medium.is-success"
    )
    .click();
  await sleep(4);

  let obj = [];

  while (true) {
    await sleep(2);

    for (let i = 2; i <= 21; i++) {
      const data = await getHref(page, i);
      obj.push({ link: `https://casadosdados.com.br${data}` });
    }

    const nextButton = await page.$(
      "#__nuxt > div > div.top-footer > section > div:nth-child(10) > div > nav > a.pagination-link.pagination-next.pagination-next"
    );
    if (await nextButton.evaluate((el) => el.classList.contains("is-disabled")))
      break;
    await page
      .locator(
        "#__nuxt > div > div.top-footer > section > div:nth-child(10) > div > nav > a.pagination-link.pagination-next.pagination-next"
      )
      .click();
  }

  await browser.close();
  return obj;
}

module.exports = main;
