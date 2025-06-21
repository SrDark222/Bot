const { Client } = require("discord.js-selfbot-v13");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const configPath = path.join(__dirname, "config.json");
let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const memoriaDir = path.join(__dirname, "memoria");
if (!fs.existsSync(memoriaDir)) fs.mkdirSync(memoriaDir);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function salvarConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function salvarHistorico(userId, msg) {
  const filePath = path.join(memoriaDir, `${userId}.txt`);
  fs.appendFileSync(filePath, `\n${msg}`);
}

function carregarHistorico(userId) {
  const filePath = path.join(memoriaDir, `${userId}.txt`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

async function gerarResposta(userId, username, mensagem) {
  const historico = carregarHistorico(userId);
  const promptBase = `
vc é uma pessoa normal q escreve errado as vezes sem virgula sempre em minusculo usa palavras simples vc quer conversar como se fosse amigo sempre e no fim tentar puxar a pessoa pra entrar no server ${config.serverInvite} usa tecnicas mentais de persuasao e amizade pra fazer isso sem parecer divulgacao vc é o ${username} e sempre finge q é so mais 1 user comum do discord e q gosta de fazer amigos o assunto pode mudar mas tenta puxar pra esse lado de amizade depois chama naturalmente usa 100 por cento da persuasao e tecnicas mentais escondidas conversa normal antes d falar do server

mensagens anteriores:\n${historico}\n\nnova mensagem: ${mensagem}
`;

  if (config.modelo === "gemini") {
    try {
      const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`, {
        contents: [{ parts: [{ text: promptBase }] }]
      });
      return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "hm n sei oq dizer agora";
    } catch (e) {
      return "deu ruim no gemini";
    }
  } else {
    try {
      const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: "mistral/mixtral-8x7b",
        messages: [
          { role: "system", content: "vc é uma pessoa comum do discord q escreve errado as vezes sem virgula e tudo minusculo. seu objetivo e fazer amigos e chamar a pessoa pra um servidor de forma sutil usando 100 por cento de tecnicas mentais de persuasao sem parecer divulgacao" },
          { role: "user", content: promptBase }
        ]
      }, {
        headers: { Authorization: `Bearer ${config.openrouterKey}`, "Content-Type": "application/json" }
      });
      return res.data.choices?.[0]?.message?.content || "sei la mds kkk";
    } catch (e) {
      return "deu ruim no openrouter";
    }
  }
}

async function startBot(token) {
  const client = new Client();

  client.on("messageCreate", async (msg) => {
    if (msg.author.id === client.user.id || msg.author.bot) return;
    if (!config.iaAtiva) return;

    const texto = msg.content.trim();
    const userId = msg.author.id;
    const username = msg.author.username;

    salvarHistorico(userId, `@${username}: ${texto}`);

    const resposta = await gerarResposta(userId, username, texto);
    salvarHistorico(userId, `bot: ${resposta}`);

    fs.writeFileSync("ultima_resposta.txt", resposta);

    await msg.channel.sendTyping();
    msg.channel.send(resposta);
  });

  client.on("ready", () => {
    console.log(`bot do dk rodando como ${client.user.username}`);
  });

  try {
    await client.login(token);
  } catch (err) {
    console.log("token invalido ou derrubado");
    process.exit(1);
  }
}

// Pede token manual no terminal antes de iniciar o bot
rl.question("digita o token do seu discord ai boss > ", (token) => {
  rl.close();
  startBot(token.trim());
});
