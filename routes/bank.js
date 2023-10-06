const express = require("express");
const axios = require("axios");
const fs = require("fs"); // Adicione esta linha
const FormData = require("form-data");

const router = express.Router();

// Função para validar CNPJ
function validateCNPJ(cnpj) {
  // Remova caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, "");

  // Verifique se o CNPJ possui 14 dígitos
  if (cnpj.length !== 14) {
    return false;
  }

  // Verifique se todos os dígitos são iguais (CNPJs inválidos)
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Calcula os dígitos verificadores
  let sum = 0;
  let multiplier = 2;

  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i), 10) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;

  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  multiplier = 2;

  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i), 10) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }

  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  // Verifique se os dígitos verificadores calculados são iguais aos dígitos originais
  if (
    parseInt(cnpj.charAt(12), 10) !== firstDigit ||
    parseInt(cnpj.charAt(13), 10) !== secondDigit
  ) {
    return false;
  }

  return true;
}

function mapDataFromFirstJSON(data) {
  return {
    razaoSocial: data.dados.nomeEmpresarial,
    nomeEmpresa: data.dados.nomeFantasia,
    cep: data.dados.endereco.cep,
    bairro: data.dados.endereco.bairro,
    numero: data.dados.endereco.numero,
    rua: `${data.dados.endereco.tipoLogradouro} ${data.dados.endereco.logradouro}`,
    estado: data.dados.endereco.uf,
    cidade: data.dados.endereco.municipio.descricao,
  };
}

function mapDataFromSecondJSON(data) {
  return {
    razaoSocial: data.dados.razao_social,
    nomeEmpresa: data.dados.nome,
    cep: data.dados.cep,
    bairro: data.dados.bairro,
    numero: data.dados.numero,
    rua: data.dados.endereco,
    estado: data.dados.estado,
    cidade: data.dados.cidade,
  };
}

async function isCompanyAlreadyRegistered(cnpj) {
  try {
    const formData = new FormData();
    formData.append("cnpj", cnpj);

    const headers = formData.getHeaders();

    const bankURL =
      "https://boltbank.conectar.site/credenciador/pre_cadastramento/buscaCnpjCadastro";

    const response = await axios.post(bankURL, formData, { headers });

    return response.data.status === 0;
  } catch (error) {
    console.error("Erro ao verificar cadastro da empresa:", error);
    throw error; // Lança o erro para que possa ser tratado posteriormente
  }
}

// Função para obter dados da empresa por CNPJ
async function getCompanyDataByCNPJ(cnpj) {
  try {
    const data = new FormData();
    data.append("cnpj", cnpj);

    const headers = data.getHeaders();

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://boltbank.conectar.site/credenciador/lojas/getDadosEmpresaByCnpj",
      headers: {
        Cookie:
          "ci_session=9%2BB4GuwrqEzFDYqFgeHInRL0wA9FnDjw3ICiDUqhOQ8zoilo1TZzXtYruyiSA4JjhKxnoJ8b2OVyrcsN8Mm5t495%2FFTg4M3jB9nEBZjU%2BrFpGHfeflnjrduNH0KS2dk%2BvaHA7r040pyNu7cPMGqhAjDf25gz%2F%2FzZWKO89qAr%2F4ZJs%2FbfwF9BwWs5pOcNUT%2F%2FUl4ucSpEOolvFbNzNxW7uVawKyUnsphif1%2BDmxKQPgwd%2BtKG%2BHN0TwgTy%2FcfGQ%2FjHNrD1AINNQLCWwEUi%2B2z4tnSitLgQN5koaovfFiipXO21U%2BTcmAgCTjBMp%2BB6kNfWQTpgUnFNhfuFWy%2FUHdtbg%3D%3D",
        ...headers,
      },
      data: data,
    };

    const response = await axios.request(config);

    return response.data;
  } catch (error) {
    console.error("Erro ao obter dados da empresa por CNPJ:", error);
    throw error; // Lança o erro para que possa ser tratado posteriormente
  }
}

// Função para mapear dados do JSON 1
function mapDataFromFirstJSON(data) {
  return {
    razaoSocial: data.dados.nomeEmpresarial,
    nomeEmpresa: data.dados.nomeFantasia,
    cep: data.dados.endereco.cep,
    bairro: data.dados.endereco.bairro,
    numero: data.dados.endereco.numero,
    rua: `${data.dados.endereco.tipoLogradouro} ${data.dados.endereco.logradouro}`,
    estado: data.dados.endereco.uf,
    cidade: data.dados.endereco.municipio.descricao,
  };
}

// Função para mapear dados do JSON 2
function mapDataFromSecondJSON(data) {
  return {
    razaoSocial: data.dados.razao_social,
    nomeEmpresa: data.dados.nome,
    cep: data.dados.cep,
    bairro: data.dados.bairro,
    numero: data.dados.numero,
    rua: data.dados.endereco,
    estado: data.dados.estado,
    cidade: data.dados.cidade,
  };
}

router.post("/pesquisa", async (req, res) => {
  try {
    const cnpj = req.body.cnpj;

    console.log("Solicitação POST recebida na rota /pesquisa:", req.body);

    if (!validateCNPJ(cnpj)) {
      return res.status(400).json({ error: "CNPJ inválido" });
    }

    const companyData = await getCompanyDataByCNPJ(cnpj);
    if (companyData && companyData.status === 0) {
      // CNPJ já cadastrado, retornar erro
      return res.status(400).json({ error: "Empresa já cadastrada" });
    }

    let mappedData;

    if (companyData && companyData.dados && companyData.dados.nomeEmpresarial) {
      // Usar o JSON 1
      mappedData = mapDataFromFirstJSON(companyData);
    } else if (companyData && companyData.dados) {
      // Usar o JSON 2
      mappedData = mapDataFromSecondJSON(companyData);
    } else {
      // Dados não encontrados
      return res
        .status(404)
        .json({ error: "Dados da empresa não encontrados" });
    }

    res.json(mappedData);
  } catch (error) {
    console.error("Erro na rota /pesquisa:", error);
    res.status(500).json({ error: "Erro na rota /pesquisa" });
  }
});

router.post("/cadastrar", async (req, res) => {
  try {
    // Definir os valores padrão para idCredenciador, id_categoria, email_contato_principal e foneFax
    const idCredenciador = "1";
    const id_categoria = "16";

    // Obtenha os dados do corpo da solicitação
    const {
      cnpj,
      nome,
      razao_social,
      email,
      cep,
      cidade,
      endereco,
      bairro,
      estado,
      numero_endereco,
      complemento_endereco,
      cpf_responsavel,
      celular_contato_principal,
      nome_responsavel,
      // Removi os campos de hora_ini_seg, hora_fim_seg, etc.
      // Inclua outros campos conforme necessário
    } = req.body;

    // Definir os horários padrão de início e fechamento
    const hora_ini_padrao = "08:00";
    const hora_fim_seg_qui = "18:00";
    const hora_fim_sex = "17:00";

    // Configurar os campos de fechamento
    const fechado_seg = "0";
    const fechado_ter = "0";
    const fechado_qua = "0";
    const fechado_qui = "0";
    const fechado_sex = "0";
    const fechado_sab = "1";
    const fechado_dom = "1";

    // Validar o CPF
    function validateCPF(cpf) {
      // Remove caracteres não numéricos
      cpf = cpf.replace(/[^\d]/g, "");

      // Verifica se o CPF possui 11 dígitos
      if (cpf.length !== 11) {
        return false;
      }

      // Verifica se todos os dígitos são iguais (CPF inválido)
      if (/^(\d)\1+$/.test(cpf)) {
        return false;
      }

      // Calcula o primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let firstDigit = 11 - (sum % 11);
      if (firstDigit === 10 || firstDigit === 11) {
        firstDigit = 0;
      }
      if (firstDigit !== parseInt(cpf.charAt(9))) {
        return false;
      }

      // Calcula o segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      let secondDigit = 11 - (sum % 11);
      if (secondDigit === 10 || secondDigit === 11) {
        secondDigit = 0;
      }
      if (secondDigit !== parseInt(cpf.charAt(10))) {
        return false;
      }

      return true;
    }

    // Função para validar CNPJ
    function validateCNPJ(cnpj) {
      // Remova caracteres não numéricos
      cnpj = cnpj.replace(/[^\d]/g, "");

      // Verifique se o CNPJ possui 14 dígitos
      if (cnpj.length !== 14) {
        return false;
      }

      // Verifique se todos os dígitos são iguais (CNPJs inválidos)
      if (/^(\d)\1+$/.test(cnpj)) {
        return false;
      }

      // Calcula os dígitos verificadores
      let sum = 0;
      let multiplier = 2;

      for (let i = 11; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i), 10) * multiplier;
        multiplier = multiplier === 9 ? 2 : multiplier + 1;
      }

      const remainder = sum % 11;

      const firstDigit = remainder < 2 ? 0 : 11 - remainder;

      sum = 0;
      multiplier = 2;

      for (let i = 12; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i), 10) * multiplier;
        multiplier = multiplier === 9 ? 2 : multiplier + 1;
      }

      const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

      // Verifique se os dígitos verificadores calculados são iguais aos dígitos originais
      if (
        parseInt(cnpj.charAt(12), 10) !== firstDigit ||
        parseInt(cnpj.charAt(13), 10) !== secondDigit
      ) {
        return false;
      }

      return true;
    }

    // Verificar se o CPF é válido
    if (!validateCPF(cpf_responsavel)) {
      return res.status(400).json({ error: "CPF inválido" });
    }

    // Criar um objeto FormData e adicionar os dados a ele
    const data = new FormData();
    data.append("idCredenciador", idCredenciador);
    data.append("cnpj", cnpj);
    data.append("nome", nome);
    data.append("foneFax", celular_contato_principal); // Definindo foneFax como o mesmo que celular_contato_principal
    data.append("razao_social", razao_social);
    data.append("email", email);
    data.append("cep", cep);
    data.append("cidade", cidade);
    data.append("endereco", endereco);
    data.append("bairro", bairro);
    data.append("estado", estado);
    data.append("numero_endereco", numero_endereco);
    data.append("complemento_endereco", complemento_endereco);
    data.append("nome_contato_principal", nome_responsavel);
    data.append("cpf_responsavel", cpf_responsavel);
    data.append("celular_contato_principal", celular_contato_principal);
    data.append("email_contato_principal", email); // Definindo email_contato_principal como o mesmo que email
    data.append("id_categoria", id_categoria);
    data.append("hora_ini_seg", hora_ini_padrao);
    data.append("hora_fim_seg", hora_fim_seg_qui);
    data.append("hora_ini_ter", hora_ini_padrao);
    data.append("hora_fim_ter", hora_fim_seg_qui);
    data.append("hora_ini_qua", hora_ini_padrao);
    data.append("hora_fim_qua", hora_fim_seg_qui);
    data.append("hora_ini_qui", hora_ini_padrao);
    data.append("hora_fim_qui", hora_fim_seg_qui);
    data.append("hora_ini_sex", hora_ini_padrao);
    data.append("hora_fim_sex", hora_fim_sex);
    data.append("hora_ini_sab", hora_ini_padrao);
    data.append("hora_fim_sab", hora_fim_sex);
    data.append("hora_ini_dom", hora_ini_padrao);
    data.append("hora_fim_dom", hora_fim_sex);
    data.append("fechado_seg", fechado_seg);
    data.append("fechado_ter", fechado_ter);
    data.append("fechado_qua", fechado_qua);
    data.append("fechado_qui", fechado_qui);
    data.append("fechado_sex", fechado_sex);
    data.append("fechado_sab", fechado_sab);
    data.append("fechado_dom", fechado_dom);

    // Carregar o arquivo de imagem (se necessário)
    if (req.file) {
      data.append("img_auto_cadastro", fs.createReadStream(req.file.path));
    } else {
      // Anexar a imagem padrão se nenhuma imagem for fornecida
      data.append(
        "img_auto_cadastro",
        fs.createReadStream("./image/padrao.png")
      );
    }

    // Configurar os cabeçalhos para a solicitação Axios
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://boltbank.conectar.site/credenciador/pre_cadastramento/post_loja",
      headers: {
        Cookie:
          "ci_session=HtkWljwjnL3fWsHRIHhQTBZsx0aqKQt0wvuxRe1%2FEAC28DpjDvSvX4K5Djmh1dLVwE1%2FAoXLCu2Om0Xwv7jtAGQHT%2B%2BHJIPhl85CxobdQhdDS5vCmSvYx3GQeo7LdHWUTdceumuoQf4y8BIqs5dng4gXLFXBvKu2BkJyKVQPajWVKlLA9ZKtX23IJGKw3BJIOJXGBrAO54pXLK7fLdbYNVYUh4F%2BO2SH3F2vPAoIZtd52rMe2GLfpIK7UDc0hxDrjW8tSyZsZhXBGcNpE8K%2BCxp1AMW%2Fqwgtc%2B301XHKhfXaigRasAYMym79N5TzbUMJ5ofRi7rFDSw94jfmBfN9qA%3D%3D",
        ...data.getHeaders(),
      },
      data: data,
    };

    // Fazer a solicitação Axios
    const firstPostResponse = await axios.request(config);

    // Verificar se o primeiro post foi bem-sucedido
    if (firstPostResponse.status === 200) {
      // Dados para o segundo post (mesmas informações do primeiro)
      const secondPostData = {
        idCredenciador,
        cnpj,
        nome,
        foneFax: celular_contato_principal,
        razao_social,
        email,
        cep,
        cidade,
        endereco,
        bairro,
        estado,
        numero_endereco,
        complemento_endereco,
        nome_contato_principal: nome_responsavel,
        function: "EnviarParaOERP", // Adicionei esta linha
        cpf_responsavel,
        celular_contato_principal,
        email_contato_principal: email,
        id_categoria,
        hora_ini_seg: hora_ini_padrao,
        hora_fim_seg: hora_fim_seg_qui,
        hora_ini_ter: hora_ini_padrao,
        hora_fim_ter: hora_fim_seg_qui,
        hora_ini_qua: hora_ini_padrao,
        hora_fim_qua: hora_fim_seg_qui,
        hora_ini_qui: hora_ini_padrao,
        hora_fim_qui: hora_fim_seg_qui,
        hora_ini_sex: hora_ini_padrao,
        hora_fim_sex: hora_fim_sex,
        hora_ini_sab: hora_ini_padrao,
        hora_fim_sab: hora_fim_sex,
        hora_ini_dom: hora_ini_padrao,
        hora_fim_dom: hora_fim_sex,
        fechado_seg,
        fechado_ter,
        fechado_qua,
        fechado_qui,
        fechado_sex,
        fechado_sab,
        fechado_dom,
      };

      // Configurar os cabeçalhos para a solicitação Axios para o webhook
      const webhookConfig = {
        method: "post",
        url: "https://hook.bolt360.com.br/webhook/bbtoodoo",
        headers: {
          "Content-Type": "application/json", // Certifique-se de definir o tipo de conteúdo apropriado para o webhook
        },
        data: secondPostData,
      };

      // Fazer o segundo post para o webhook
      const secondPostResponse = await axios.request(webhookConfig);

      // Verificar se o segundo post para o webhook foi bem-sucedido
      if (secondPostResponse.status === 200) {
        res.json({ success: true, message: "Cadastro realizado com sucesso" });
      } else {
        res.status(500).json({
          error: "Erro ao enviar dados para o webhook",
        });
      }
    } else {
      res.status(500).json({
        error: "Erro ao cadastrar os dados",
      });
    }
  } catch (error) {
    console.error("Erro na rota /cadastrar:", error);
    res.status(500).json({ error: "Erro na rota /cadastrar" });
  }
});
module.exports = router;
