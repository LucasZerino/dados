const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv-safe");
dotenv.config(); // Carrega vari      veis de ambiente do arquivo .env
const buscarXAuthToken = require("../utils/contaAzulGetToken"); // Ajuste o caminho

// Rota para cadastrar um cliente na ContaAzul
router.post("/cadastro", async (req, res) => {
  try {
    // Leitura do refresh token a partir das vari      veis de ambiente
    let refreshToken = process.env.REFRESH_TOKEN;

    // Primeiro, fa      a o refresh do token
    const refreshTokenResponse = await refreshContaAzulToken(refreshToken);
    const accessToken = refreshTokenResponse.access_token;

    // Log para a primeira requisi            o
    console.log(
      "Primeira requisi            o - Novo refresh token criado:",
      refreshTokenResponse.refresh_token
    );

    // Atualize o refresh token no arquivo .env
    refreshToken = refreshTokenResponse.refresh_token;
    updateRefreshTokenInEnv(refreshToken);

    // Verifique se a solicita            o possui a propriedade 'cnpj'
    if (!req.body.cnpj) {
      return res
        .status(400)
        .json({ message: "O campo 'cnpj'        obrigat      rio." });
    }

    // Remova todos os caracteres n      o num      ricos do CNPJ
    const cnpj = req.body.cnpj.replace(/\D/g, ""); // Esta express      o regular remove todos os caracteres n      o num      ricos

    // Em seguida, use o novo access token para cadastrar o cliente
    const cadastrarClienteResponse = await cadastrarClienteContaAzul(
      { ...req.body, cnpj }, // Adicione o CNPJ limpo aos dados do cliente
      accessToken
    );

    // Log para a segunda requisi            o
    console.log(
      "Segunda requisi            o - Cliente cadastrado com sucesso."
    );

    // Verifique se o cadastro do cliente foi bem-sucedido
    if (cadastrarClienteResponse.status === 201) {
      res.status(201).json({ message: "Cliente cadastrado com sucesso." });
    } else {
      res.status(cadastrarClienteResponse.status).json({
        message: "Erro ao cadastrar o cliente na ContaAzul.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

router.get("/buscarproposta/:id", async (req, res) => {
  const xAuthorization = await buscarXAuthToken();
  const id = req.params.id; // Obt      m o ID da URL dinamicamente
  const url = `https://services.contaazul.com/app/sale/${id}/preview/proposal`;

  try {
    // Construa a configura            o para a solicita            o GET
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: url,
      headers: {
        "X-Authorization": xAuthorization,
      },
    };

    // Fa      a a solicita            o GET
    const response = await axios.request(config);

    // Verifique se a solicita            o foi bem-sucedida
    if (response.status === 200) {
      // Chame a fun            o para calcular as somas
      const somas = calcularSomas(response.data);

      // Formate os valores de price, total e quantity
      const items = response.data.data.sale.items.map((item) => ({
        ...item,
        price: `R$ ${item.price.toFixed(2)}`,
        total: `R$ ${item.total.toFixed(2)}`,
        quantity: `(${item.quantity})`,
      }));

      const resultado = {
        ...response.data, // Inclua os dados da proposta
        SomaMensalidade: `R$ ${somas.somaMensalidade.toFixed(2)}`,
        SomaSetup: `R$ ${somas.somaSetup.toFixed(2)}`,
      };

      resultado.data.sale.items = items; // Substitui os items formatados

      res.status(200).json(resultado);
    } else {
      res.status(response.status).json({
        message: "Erro ao buscar a proposta na ContaAzul.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

router.get("/buscarvendas/:nomeCliente?", async (req, res) => {
  const xAuthorization = await buscarXAuthToken();
  const nomeCliente = req.params.nomeCliente;

  try {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiroDiaFormatado = `${primeiroDia.getFullYear()}-${(
      primeiroDia.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-01`;

    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const ultimoDiaFormatado = `${ultimoDia.getFullYear()}-${(
      ultimoDia.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${ultimoDia.getDate()}`;

    const requestBody = {
      types: ["SALE", "SCHEDULED_SALE", "SALE_PROPOSAL"],
      totals: "ALL",
      period: {
        startDate: primeiroDiaFormatado,
        endDate: ultimoDiaFormatado,
      },
      searchTerm: nomeCliente,
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://services.contaazul.com/contaazul-bff/sale/v1/sales/searches?page=1&page_size=100",
      headers: {
        "X-Authorization": xAuthorization,
        "Content-Type": "application/json",
      },
      data: requestBody,
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      const data = response.data;
      if (data.items.length === 1) {
        // Se houver apenas uma venda, retorne apenas o objeto JSON da venda
        res.status(200).json(data.items[0]);
      } else if (data.items.length > 1) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: "Nenhuma venda encontrada." });
      }
    } else {
      res.status(response.status).json({
        message: "Erro ao buscar vendas na ContaAzul.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

router.get("/buscarclientes/:parametroBusca?", async (req, res) => {
  const xAuthorization = await buscarXAuthToken();
  const parametroBusca = req.params.parametroBusca;

  try {
    let url = `https://services.contaazul.com/contaazul-bff/person-registration/v1/persons?type=CUSTOMER&status=active&page=1&page_size=10`;

    if (parametroBusca) {
      url += `&search_term=${parametroBusca}`;
    }

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: url,
      headers: {
        "X-Authorization": xAuthorization,
        Cookie:
          "session=Mmo2uhxKPwOQG5c2NZcfNg|1695788683|15S671Cvhm5KCFHBEreBbsP1T0f7uqcodioJwqzK1_gAydGCBkhJZ8cfv-3lpWyqvPAjCbIzv6S_hd-QiUfVAcn_aZc-B6QC4XvcJ1EWn9o_T1_CNrSFjIncxrBeovdcQCvhilp78uhGZjQiffRgVPwtQE9UXHcr_AqcfBknS2KgS5BkDv6wfxJ1W-IZdZtU7S8ipOwG5VKkD04slSuckGzDpjuJ-EnhVUzUli3QUNjAHfdRTfBqrLvLXd3eVFRk3w-Iliri5WsoEg4QvdabkD_YsiHFeVGkGbNcWL3eQ8ka1wO2T3w9hx9OLQbZfhmW_FKTdVWz3sOp5KIDrNkW4w|RPXMuiZRi6V1hg-_BzIjh4QL-vA; cookiesession1=678A3E110CB93B493371875CD913CB1E",
      },
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      const data = response.data;
      if (data.items.length === 1) {
        // Se houver apenas um item, retorne apenas o objeto JSON, sem a estrutura adicional
        res.status(200).json(data.items[0]);
      } else if (data.items.length > 1) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: "Nenhum cliente encontrado." });
      }
    } else {
      res.status(response.status).json({
        message: "Erro ao buscar clientes na ContaAzul.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

async function getIpInfo(ip) {
    try {
      const response = await axios.get(`https://ipinfo.io/${ip}/json`);
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error("Erro ao buscar informações de localização.");
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  
  router.get("/getuserDetails/:id", async (req, res) => {
    const xAuthorization = await buscarXAuthToken();
    try {
      const id = req.params.id;
  
      // Obtém a data e hora da requisição
      const currentDate = new Date();
      const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
  
      // Obtém o IP do cliente da requisição
      const clientIp = req.ip;
  
      // Obtém informações de localização com base no IP do cliente
      const locationInfo = await getIpInfo(clientIp);
  
      // Faz a primeira requisição para buscar o UUID com base no ID
      const firstUrl = `https://bridge.bolt360.com.br/contaazul/buscarclientes/${id}`;
      const firstResponse = await axios.get(firstUrl);
  
      if (firstResponse.status !== 200) {
        return res.status(500).json({ message: "Erro ao buscar o UUID." });
      }
  
      const uuid = firstResponse.data.uuid;
  
      // Faz a segunda requisição para buscar os detalhes do usuário com base no UUID
      const secondUrl = `https://services.contaazul.com/contaazul-bff/person-registration/v1/persons/${uuid}/resume`;
      const secondResponse = await axios.get(secondUrl, {
        headers: {
          "X-Authorization": xAuthorization,
        },
      });
  
      if (secondResponse.status !== 200) {
        return res
          .status(500)
          .json({ message: "Erro ao buscar os detalhes do usuário." });
      }
  
      // Filtra os contatos na propriedade "otherContacts" para incluir apenas o contato com "Diretor"
      const directorContact = secondResponse.data.otherContacts.filter(
        (contact) => contact.office === "Diretor"
      );
  
      // Substitui os contatos em "otherContacts" pelos contatos filtrados
      secondResponse.data.otherContacts = directorContact;
  
      // Retorna todos os detalhes com os contatos filtrados, dia, hora, IP e localização
      res.status(200).json({
        ...secondResponse.data,
        requestInfo: {
          date: formattedDate,
          ip: clientIp,
          location: locationInfo,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }

async function refreshContaAzulToken(refreshToken) {
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url:
      "https://api.contaazul.com/oauth2/token?grant_type=refresh_token&refresh_token=" +
      refreshToken,
    headers: {
      Authorization:
        "Basic Sm9RVzJUUzA0STEyWlVld3R3V2xCYlJYVm9RVDRpUnI6OEpYbDNzYWNnWlhQZ1Y4dVVnS0FuMWRqS2dmbVNTbGY=",
    },
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error; // Rejeita o erro para que ele seja tratado na rota
  }
}

// Fun            o para cadastrar o cliente na ContaAzul
async function cadastrarClienteContaAzul(clientData, accessToken) {
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.contaazul.com/v1/customers",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    data: clientData, // N      o        necess      rio transformar em JSON novamente
  };

  try {
    return await axios.request(config);
  } catch (error) {
    console.error(error);
    throw error; // Rejeita o erro para que ele seja tratado na rota
  }
}

function calcularSomas(data) {
  const items = data.data.sale.items;
  let somaMensalidade = 0;
  let somaSetup = 0;

  items.forEach((item) => {
    const descricao = item.item.descricao.toLowerCase();
    console.log(descricao);

    if (
      descricao.includes("setup") ||
      descricao.includes("implanta            o") ||
      descricao.includes("treinamento")
    ) {
      // Se a descri            o cont      m alguma das palavras-chave, adicione ao somaSetup
      somaSetup += item.total;
    } else {
      // Caso contr      rio, adicione ao somaMensalidade
      somaMensalidade += item.total;
    }
  });

  return {
    somaMensalidade,
    somaSetup,
  };
}

// Fun            o para atualizar o refresh token no arquivo .env
function updateRefreshTokenInEnv(refreshToken) {
  // Atualize o valor no objeto process.env
  process.env.REFRESH_TOKEN = refreshToken;

  // Atualize o arquivo .env
  fs.writeFileSync(".env", `REFRESH_TOKEN=${refreshToken}`, "utf-8");
}

module.exports = router;
