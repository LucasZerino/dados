const puppeteer = require('puppeteer')

const info = {
    login: "lucas@grupomais.work",
    pass: "Gmais2023@@",
    loginUrl: "https://app.powercrm.com.br/",
    usersUrl: "https://app.powercrm.com.br/company/users",
    nome: "cosbel da silva", email: "cosbel@bolt360.com", cpf: "01643427458", celular: "84986034712"
}

async function execute(){
    const waitSeconds = async (seconds = 0) => new Promise(r => setTimeout(r, seconds * 1000)); 
    const browser = await puppeteer.launch({headless: "new", defaultViewport: { width: 1200, height: 600 }})
    const page = await browser.newPage();


    // DO LOGIN CPANEL
    await page.goto(info.loginUrl);
    await page.locator("#emailField").fill(info.login);
    await page.locator("#j_password").fill(info.pass);
    await page.locator("#formLoginPowerCRM > input.btn_logar").click();

    await page.waitForNavigation();

    // USERS PAGE
    await page.goto(info.usersUrl);
    await waitSeconds(3)
    await page.locator("#addUserButton").hover();
    await page.locator("#addUserButton").click();
    // nome tratamento 
    await page.locator("#modalUserName").fill(info.nome)
    await page.locator("#modalUserFullName").fill(info.nome)
    // email 
    await page.locator("#modalUserEmail").hover();
    await page.locator("#modalUserEmail").fill(info.email)
    // cpf 
    await page.locator("#modalUserRegistration").fill(info.cpf)
    await waitSeconds(3)
    // funcao  - value=1
    await page.locator("#modalUserOffice").hover();
    await page.select("#modalUserOffice", "1");
    // celular 
    await page.locator("#modalUserMobile").fill(info.celular)
    // regional
    await page.locator("#newUserModal > div > div > div.modal-body > div:nth-child(1) > div:nth-child(9) > div > div.fs-label-wrap > div").click()
    await page.locator("#newUserModal > div > div > div.modal-body > div:nth-child(1) > div:nth-child(9) > div > div.fs-dropdown > div.fs-option.fs-selectAll").click()

    // grupo permissaõ
    await page.locator("#modalUserPermissionGroup").hover();
    await page.select("#modalUserPermissionGroup", "1169");

    //comissao
    await page.locator("#modalUserComission").fill("0");

    // BOTAO ENTRAR
    // await page.locator("#modalUserButtonSave").click();

    // await browser.close();
}   

execute();