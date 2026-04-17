# 🤖 Discord Bot: Auto-Cargo + Música do YouTube + Painel Web

Este projeto cria um bot para Discord com três funções iniciais:

1. Dar um **cargo automático** para quem entrar no servidor.
2. Tocar música do YouTube com comando no chat (`-play`).
3. Disponibilizar um **painel web** para você controlar funções e facilitar futuras expansões.

---

## 📦 Requisitos

Antes de começar, instale:

- **Node.js 20+**
- **npm 10+**
- Conta Discord com permissão para criar aplicações/bots

> O projeto usa `ffmpeg-static`, então você não precisa instalar FFmpeg manualmente na maioria dos ambientes.

---

## 1) Criar o bot no Discord Developer Portal

1. Acesse: https://discord.com/developers/applications
2. Clique em **New Application** e dê um nome.
3. Vá em **Bot** → **Add Bot**.
4. Em **Privileged Gateway Intents**, habilite:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Copie o **Token** do bot (você vai usar no `.env`).

---

## 2) Convidar o bot para seu servidor

1. No Developer Portal, abra **OAuth2** → **URL Generator**.
2. Em **Scopes**, marque:
   - `bot`
3. Em **Bot Permissions**, marque no mínimo:
   - Manage Roles (para auto-cargo)
   - View Channels
   - Send Messages
   - Connect
   - Speak
4. Abra a URL gerada e convide o bot para seu servidor.

---

## 3) Descobrir IDs necessários (servidor e cargo)

No Discord (app desktop/web):

1. Vá em **Configurações do Usuário** → **Avançado** → ative **Modo Desenvolvedor**.
2. Clique com botão direito no seu servidor → **Copiar ID** (`GUILD_ID`).
3. Clique com botão direito no cargo que será automático → **Copiar ID** (`AUTO_ROLE_ID`).

⚠️ O cargo do bot na lista de cargos do servidor deve estar **acima** do cargo que ele vai atribuir.

---

## 4) Instalação do projeto

No terminal:

```bash
git clone <url-do-seu-repo>
cd botcde
npm install
```

Depois copie o arquivo de exemplo:

```bash
cp .env.example .env
```

---

## 5) Configurar variáveis de ambiente

Edite o `.env` com seus dados reais:

```env
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=id_da_aplicacao
GUILD_ID=id_do_servidor
AUTO_ROLE_ID=id_do_cargo_automatico
PREFIX=-
PANEL_PORT=3000
PANEL_USERNAME=admin
PANEL_PASSWORD=troque_essa_senha
```

### O que cada variável faz

- `DISCORD_TOKEN`: token do bot no Developer Portal.
- `CLIENT_ID`: ID da aplicação (opcional hoje, útil para evoluções futuras).
- `GUILD_ID`: ID do servidor (opcional hoje, útil para evoluções futuras).
- `AUTO_ROLE_ID`: cargo que será aplicado em novos membros.
- `PREFIX`: prefixo dos comandos no chat (padrão: `-`).
- `PANEL_PORT`: porta do painel web.
- `PANEL_USERNAME` e `PANEL_PASSWORD`: login do painel.

---

## 6) Rodar o bot

```bash
npm start
```

Se tudo estiver certo, você verá logs de conexão do bot e do painel.

---

## 7) Usar comandos de música

Comandos disponíveis no chat:

- `-play <nome da música ou link>`
- `-skip`
- `-stop`

Exemplos:

```text
-play Linkin Park Numb
-play https://www.youtube.com/watch?v=kXYiU_JCYtU
-skip
-stop
```

---

## 8) Acessar o painel web

Depois de iniciar o bot, acesse:

- `http://localhost:3000` (ou a porta definida em `PANEL_PORT`)

Faça login com `PANEL_USERNAME` e `PANEL_PASSWORD`.

No painel você consegue:

- Ativar/desativar **auto-cargo**
- Ativar/desativar **música**

As configurações ficam salvas em:

- `src/storage/settings.json`

---

## 9) Solução de problemas (FAQ)

### O bot não dá cargo automático

Verifique:

- `AUTO_ROLE_ID` está correto no `.env`.
- Bot tem permissão **Manage Roles**.
- Cargo do bot está acima do cargo alvo na hierarquia.
- Intent `SERVER MEMBERS INTENT` está ativa no Developer Portal.

### O comando `-play` não toca nada

Verifique:

- O bot tem permissões **Connect** e **Speak** no canal de voz.
- Você está em um canal de voz ao usar `-play`.
- A função de música está ativa no painel.

### Não consigo entrar no painel

Verifique:

- URL e porta (`PANEL_PORT`).
- Usuário/senha configurados no `.env`.

---

## 10) Estrutura do projeto

```text
src/
  index.js                 # Bot e comandos
  config.js                # Leitura de .env e feature flags
  storage/settings.json    # Flags salvas pelo painel
  panel/
    server.js              # Servidor web do painel
    views/dashboard.ejs    # Interface do painel
```

---

## 11) Próximos passos (sugestões)

- Migrar comandos para slash commands (`/play`)
- Criar módulo de boas-vindas personalizadas
- Criar logs de moderação no painel
- Sistema de permissões por cargo para usar comandos de música

---

Se quiser, no próximo passo eu também posso te entregar:

- versão com **slash commands**,
- painel com **edição de mensagens de boas-vindas**,
- e estrutura de plugins para adicionar novas funções mais rápido.
