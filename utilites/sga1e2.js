const puppeteer = require('puppeteer');

const info = {
    login: "lucas.zerino",
    pass: "Lucas#4019",
    loginUrl: "https://europa.hinova.com.br/sga/sgav4_pensar/v5/login.php",
    userUrl: "https://europa.hinova.com.br/sga/sgav4_pensar/usuario/listaUsuario.php",
    loginUrl2: "https://taiga.hinova.com.br/sga/sgav4_webck/v5/login.php",
    userUrl2: "https://taiga.hinova.com.br/sga/sgav4_webck/usuario/listaUsuario.php",
    nome: "Charles Alexandre Soares Gomes", cpf: '01200672429', usuario: "charles.alexandre", senha: "Mudarsenha123", telefone: "8481867804",
    horario: {
        inicio: "08:00", termino: "18:00"
    },
    mensagem: "SGA NÃO PODE CARACTERES ESPECIAIS"
}

async function execute(){
    const waitSeconds = async (seconds = 0) => new Promise(r => setTimeout(r, seconds * 1000)); 
    const browser = await puppeteer.launch({headless: "new", defaultViewport: { width: 1200, height: 600 }})
    const page = await browser.newPage();


    // DO LOGIN CPANEL
    await page.goto(info.loginUrl);
    await page.locator('#myModal > div > div > div.modal-body > div > div > div > button').click();
    await page.locator('#usuario').fill(info.login)
    await page.locator('#senha').fill(info.pass)
    await waitSeconds(1)
    await page.locator('#login > button.btn.btn-primary').click();
    await page.waitForNavigation();

    await waitSeconds(1);

    // USER PAGE
    await page.goto(info.userUrl);
    await waitSeconds(5)
    const userButton = await page.locator('#pbNovo');
    userButton.hover();
    userButton.click();
    const modal = await page.locator('#frmCadastrarUsuario');

    // ABA DADOS PESSOAIS
    //GRUPO
    await page.locator('#dfs_data_usuario_id_grupo').hover();
    await page.select('#dfs_data_usuario_id_grupo', '4');
    // NOME 
    await page.locator('#dfs_data_usuario_nome').fill(info.nome);
    // CPF 
    await page.locator('#dfs_data_usuario_cpf').fill(info.cpf);
    // SITUACAO
    await page.locator('#cmb_data_usuario_situacao').hover();
    await page.select('#cmb_data_usuario_situacao', 'A');
    // REGIONAL
    await page.locator('#cmb_data_usuario_id_dados').hover();
    await page.select('#cmb_data_usuario_id_dados', '1');
    // USUARIO 
    await page.locator('#dfs_data_usuario_usuario').fill(info.usuario);
    // SENHA 
    await page.locator('#dfs_data_usuario_senha').fill(info.senha);
    // CONFIRM SENHA 
    await page.locator('#dfs_data_usuario_senha_confirmacao').fill(info.senha);
    // TELEFONE 
    await page.locator('#dfs_data_usuario_telefone').fill(info.telefone)

    await waitSeconds(3)

    //ABA HORÁRIOS
    await page.locator('#aba_usuarios > li:nth-child(2) > a').click();
    //SEGUNDA
    await page.locator('#divHorario_segunda_1 > div > div.left > input').fill(info.horario.inicio);
    await page.locator('#divHorario_segunda_1 > div > div.right > input').fill(info.horario.termino);
    //TERÇA
    await page.locator('#divHorario_terca_1 > div > div:nth-child(1) > input').fill(info.horario.inicio)
    await page.locator('#divHorario_terca_1 > div > div:nth-child(3) > input').fill(info.horario.termino)
    //QUARTA
    await page.locator('#divHorario_quarta_1 > div > div:nth-child(1) > input').fill(info.horario.inicio)
    await page.locator('#divHorario_quarta_1 > div > div:nth-child(3) > input').fill(info.horario.termino)
    //QUINTA
    await page.locator('#divHorario_quinta_1 > div > div:nth-child(1) > input').fill(info.horario.inicio)
    await page.locator('#divHorario_quinta_1 > div > div:nth-child(3) > input').fill(info.horario.termino)
    //SEXTA
    await page.locator('#divHorario_sexta_1 > div > div:nth-child(1) > input').fill(info.horario.inicio)
    await page.locator('#divHorario_sexta_1 > div > div:nth-child(3) > input').fill(info.horario.termino)

    await waitSeconds(1);

    // SAVE BUTTON
    await page.locator('#pbSalvar').click();
    await waitSeconds(2);
    await browser.close();


}


execute();