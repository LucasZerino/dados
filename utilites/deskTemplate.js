// Em utilites/deskTemplate.js

const puppeteer = require("puppeteer");

async function createTicket(templateNumber) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://desk.bchat.com.br/#login");

  await page.click("#username");
  await page.type("#username", "betoobot@bolt360.com.br");

  await page.click("#password");
  await page.type("#password", "Gmais2023@@");

  await page.click("#login > div.form-controls > button");

  await page.waitForTimeout(5000);

  await page.goto("https://desk.bchat.com.br/#ticket/create/");

  await page.waitForTimeout(5000);

  await page.select('select[name="id"]', templateNumber);

  await page.waitForSelector("button.js-apply");

  await page.click("button.js-apply");

  await page.waitForTimeout(3000);

  await page.click("button.js-submit");

  await page.waitForTimeout(3000);

  await browser.close();
}

module.exports = createTicket;
