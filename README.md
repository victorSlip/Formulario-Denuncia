# Sistema de Formulário de Denúncia (Google Apps Script)

Sistema de canal de denúncias desenvolvido como um **Web App em Google Apps Script**, integrado ao Google Sheets, Google Drive e Gmail. Permite o registro de denúncias com anexos, geração automática de protocolo, envio de confirmação por e-mail e consulta pública do andamento.

## ✨ Funcionalidades

- Formulário de denúncia com tipo, local, data, descrição e evidências anexadas
- Upload de **múltiplos anexos**, armazenados automaticamente em uma pasta do Google Drive
- Geração automática de **número de protocolo** único (formato `DEN-AAAAMMDD-NNNN`)
- Envio de **e-mail de confirmação** com o protocolo, quando informado pelo denunciante
- Página pública de **consulta de andamento** a partir do número de protocolo
- Exibição de **status colorido** (badge) e de um campo de **andamento** detalhado, preenchido manualmente pelo responsável

## 🧱 Arquitetura

| Componente | Função |
|---|---|
| Google Apps Script (Web App) | Backend (`Code.gs`) e páginas HTML servidas via `doGet()` |
| Google Sheets | Base de dados, cada denúncia é uma linha |
| Google Drive | Armazenamento dos arquivos anexados |
| Gmail (`MailApp`) | Envio do e-mail de confirmação com o protocolo |

O mesmo Web App serve duas páginas, controladas por parâmetro de URL:

```
/exec               → Formulário de denúncia
/exec?page=consulta → Consulta de protocolo
```

## 📁 Estrutura de arquivos

```
├── Code.gs           # Backend: doGet, salvarDenuncia, consultarProtocolo, gerarProtocolo
├── Formulario.html    # Página de envio de denúncia
├── Consulta.html       # Página de consulta de protocolo
└── appsscript.json    # Manifesto com escopos de autorização (OAuth)
```

## ⚙️ Configuração

1. Crie uma planilha no Google Sheets com uma aba (padrão: `Denúncias`) contendo as colunas:

   `Carimbo de data/hora | Tipo da denúncia | Local da ocorrência | Data da ocorrência | Descrição da denúncia | Deseja anexar evidências? | Anexo | E-mail | Protocolo | Status | Data de cadastro | Andamento`

2. Crie uma pasta no Google Drive para armazenar os anexos e copie o ID dela (parte final da URL, depois de `/folders/`).

3. No `Code.gs`, ajuste as constantes:

   ```javascript
   const SHEET_NAME = "Denuncias";
   const PASTA_ANEXOS_ID = "SEU_ID_AQUI";
   ```

4. Cole os escopos necessários no `appsscript.json`:

   ```json
   "oauthScopes": [
     "https://www.googleapis.com/auth/spreadsheets",
     "https://www.googleapis.com/auth/drive",
     "https://www.googleapis.com/auth/script.external_request",
     "https://www.googleapis.com/auth/script.send_mail"
   ]
   ```

5. Implante como Web App: **Implantar → Nova implantação → Executar como "Eu" → Acesso "Qualquer pessoa"**.

6. Configure uma lista suspensa (validação de dados) na coluna **Status** com os valores: `Pendente`, `Em andamento/Análise`, `Concluída`, `Arquivada`.

## 🔐 Permissões necessárias

O script solicita autorização para:
- Ler e escrever na planilha (`spreadsheets`)
- Criar arquivos no Drive (`drive`)
- Enviar e-mails em nome do usuário que implantou o script (`script.send_mail`)

## 🚀 Possíveis evoluções

- Exigir e-mail junto ao protocolo na consulta, como camada extra de proteção
- Notificação automática ao denunciante quando o status for atualizado
- Painel administrativo para atualizar status/andamento sem acessar a planilha diretamente
- Validação de tipo e tamanho de arquivo no upload

## 📄 Licença

Projeto de uso pessoal.
