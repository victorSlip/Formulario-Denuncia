const SHEET_NAME = "Seu_ID_aqui"; // ajuste para o nome da sua aba
const PASTA_ANEXOS_ID = "Seu_ID_da_pasta_aqui";

function doGet(e) {
  const pagina = e.parameter.page;

  if (pagina === 'consulta') {
    return HtmlService.createHtmlOutputFromFile('Consulta')
      .setTitle('Consultar Denúncia')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Formulário de Denúncia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function consultarProtocolo(protocolo) {
  try {
    if (!protocolo || protocolo.trim() === "") {
      return { encontrado: false, erro: "Informe um número de protocolo." };
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const dados = sheet.getDataRange().getValues();
    const cabecalho = dados[0];

    const colProtocolo = cabecalho.indexOf("Protocolo");
    const colTipo = cabecalho.indexOf("Tipo da denúncia");
    const colStatus = cabecalho.indexOf("Status");
    const colDataCadastro = cabecalho.indexOf("Data de cadastro");
    const colObservacoes = cabecalho.indexOf("Andamento");

    const protocoloBusca = protocolo.trim().toUpperCase();

    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      if (String(linha[colProtocolo]).trim().toUpperCase() === protocoloBusca) {
        return {
          encontrado: true,
          protocolo: linha[colProtocolo],
          tipo: linha[colTipo],
          status: linha[colStatus] || "Pendente",
          dataCadastro: Utilities.formatDate(new Date(linha[colDataCadastro]), Session.getScriptTimeZone(), "dd/MM/yyyy 'às' HH:mm"),
          observacoes: colObservacoes !== -1 ? (linha[colObservacoes] || "") : ""
        };
      }
    }

    return { encontrado: false, erro: "Protocolo não encontrado. Verifique se digitou corretamente." };
  } catch (e) {
    return { encontrado: false, erro: "Erro ao consultar: " + e.message };
  }
}
function gerarProtocolo() {
  const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const ultimaLinha = sheet.getLastRow();
  const sequencial = String(ultimaLinha).padStart(4, '0');
  return `DEN-${hoje}-${sequencial}`;
}

function salvarDenuncia(dados) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    let linksAnexos = [];

    if (dados.desejaAnexar === "Sim" && dados.arquivos && dados.arquivos.length > 0) {
      const pasta = DriveApp.getFolderById(PASTA_ANEXOS_ID);

      dados.arquivos.forEach(arq => {
        const bytes = Utilities.base64Decode(arq.base64.split(',')[1]);
        const blob = Utilities.newBlob(bytes, arq.tipo, arq.nome);
        const arquivo = pasta.createFile(blob);
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        linksAnexos.push(arquivo.getUrl());
      });
    }

    const protocolo = gerarProtocolo();
    const agora = new Date();

    sheet.appendRow([
      agora,
      dados.tipoDenuncia,
      dados.localOcorrencia,
      dados.dataOcorrencia,
      dados.descricao,
      dados.desejaAnexar,
      linksAnexos.join("\n"),
      dados.email || "",
      protocolo,
      "Pendente",
      agora
    ]);

    // Envia e-mail de confirmação, se o usuário informou um e-mail
    if (dados.email && dados.email.trim() !== "") {
      enviarEmailConfirmacao(dados.email, protocolo, dados);
    }

    return { sucesso: true, protocolo: protocolo };
  } catch (e) {
    return { sucesso: false, erro: e.message };
  }
}

function enviarEmailConfirmacao(email, protocolo, dados) {
  const assunto = `Denúncia registrada - Protocolo ${protocolo}`;

  const corpo = `Sua denúncia foi registrada com sucesso.

Protocolo: ${protocolo}

Guarde este número para consultar o andamento da sua denúncia.

Resumo do registro:
- Tipo: ${dados.tipoDenuncia}
- Local: ${dados.localOcorrencia}
- Data da ocorrência: ${dados.dataOcorrencia}
- Descrição: ${dados.descricao}

Este é um e-mail automático, não é necessário responder.`;

  MailApp.sendEmail({
    to: email,
    subject: assunto,
    body: corpo
  });
}